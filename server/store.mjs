import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const { Pool } = pg;

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, "server", "data");
const sqlitePath = path.join(dataDir, "stack-pulse.sqlite");

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function getDatabaseMode() {
  return process.env.DATABASE_URL ? "postgres" : "sqlite";
}

function createEmptyContentMeta(issueCount = 0) {
  return {
    generatedAt: "",
    issueCount,
    sourceCount: 0,
    officialSourceCount: 0,
    fallbackSourceCount: 0,
    lastUpdatedAt: "",
    fetchMode: "db_empty",
    enrichmentMode: "db_empty",
  };
}

function createEmptyUserProfile(userId) {
  const timestamp = new Date().toISOString();

  return {
    userId,
    accountType: "guest",
    createdAt: timestamp,
    updatedAt: timestamp,
    isOnboarded: false,
    preferences: null,
    issueStates: {},
  };
}

class SqliteStore {
  constructor() {
    ensureDataDir();
    this.db = new DatabaseSync(sqlitePath);
  }

  async init() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        severity TEXT NOT NULL,
        original_title TEXT NOT NULL,
        published_at TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS issue_tags (
        issue_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (issue_id, tag),
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS issue_sources (
        issue_id TEXT NOT NULL,
        source_url TEXT NOT NULL,
        published_at TEXT NOT NULL,
        PRIMARY KEY (issue_id, source_url),
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        account_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_onboarded INTEGER NOT NULL DEFAULT 0,
        preferences_json TEXT
      );

      CREATE TABLE IF NOT EXISTS user_issue_states (
        user_id TEXT NOT NULL,
        issue_id TEXT NOT NULL,
        state_json TEXT NOT NULL,
        PRIMARY KEY (user_id, issue_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  async syncBundle(bundle) {
    const insertIssue = this.db.prepare(`
      INSERT INTO issues (id, severity, original_title, published_at, payload_json)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        severity = excluded.severity,
        original_title = excluded.original_title,
        published_at = excluded.published_at,
        payload_json = excluded.payload_json
    `);

    const insertTag = this.db.prepare(`
      INSERT OR IGNORE INTO issue_tags (issue_id, tag)
      VALUES (?, ?)
    `);

    const insertSource = this.db.prepare(`
      INSERT OR IGNORE INTO issue_sources (issue_id, source_url, published_at)
      VALUES (?, ?, ?)
    `);

    const deleteTags = this.db.prepare(`DELETE FROM issue_tags WHERE issue_id = ?`);
    const deleteSources = this.db.prepare(`DELETE FROM issue_sources WHERE issue_id = ?`);
    const upsertMetadata = this.db.prepare(`
      INSERT INTO metadata (key, value_json)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json
    `);

    try {
      this.db.exec("BEGIN");

      for (const issue of bundle.issues) {
        insertIssue.run(
          issue.id,
          issue.severity,
          issue.originalTitle,
          issue.publishedAt,
          JSON.stringify(issue),
        );

        deleteTags.run(issue.id);
        deleteSources.run(issue.id);

        for (const tag of issue.tags) {
          insertTag.run(issue.id, tag);
        }

        for (const source of issue.sources) {
          insertSource.run(issue.id, source.url, source.publishedAt);
        }
      }

      upsertMetadata.run("content_meta", JSON.stringify(bundle.contentMeta));
      upsertMetadata.run("available_stacks", JSON.stringify(bundle.availableStacks));
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  async getContentMeta() {
    const row = this.db.prepare(`SELECT value_json FROM metadata WHERE key = ?`).get("content_meta");
    return row ? JSON.parse(row.value_json) : null;
  }

  async getAvailableStacks() {
    const row = this.db.prepare(`SELECT value_json FROM metadata WHERE key = ?`).get("available_stacks");
    return row ? JSON.parse(row.value_json) : [];
  }

  async getFeed(stacks, cursor, limit) {
    const filters = stacks.filter(Boolean);
    const baseSelect = `
      SELECT DISTINCT issues.payload_json AS payload_json
      FROM issues
      LEFT JOIN issue_tags ON issue_tags.issue_id = issues.id
    `;

    let rows;

    if (filters.length > 0) {
      const placeholders = filters.map(() => "?").join(", ");
      rows = this.db
        .prepare(
          `${baseSelect}
           WHERE issue_tags.tag IN (${placeholders})
           ORDER BY datetime(issues.published_at) DESC`,
        )
        .all(...filters);
    } else {
      rows = this.db
        .prepare(
          `${baseSelect}
           ORDER BY datetime(issues.published_at) DESC`,
        )
        .all();
    }

    const allIssues = rows.map((row) => JSON.parse(row.payload_json));
    const offset = Number.parseInt(cursor || "0", 10);
    const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const issues = allIssues.slice(safeOffset, safeOffset + safeLimit);
    const nextCursor =
      safeOffset + safeLimit < allIssues.length ? String(safeOffset + safeLimit) : null;
    const contentMeta = await this.getContentMeta();

    return {
      issues,
      availableStacks: await this.getAvailableStacks(),
      nextCursor,
      contentMeta: contentMeta
        ? {
            ...contentMeta,
            issueCount: allIssues.length,
          }
        : createEmptyContentMeta(allIssues.length),
    };
  }

  async getIssueById(issueId) {
    const row = this.db.prepare(`SELECT payload_json FROM issues WHERE id = ?`).get(issueId);
    return row ? JSON.parse(row.payload_json) : null;
  }

  async getUserProfile(userId) {
    const userRow = this.db
      .prepare(
        `
          SELECT id, account_type, created_at, updated_at, is_onboarded, preferences_json
          FROM users
          WHERE id = ?
        `,
      )
      .get(userId);

    if (!userRow) {
      return createEmptyUserProfile(userId);
    }

    const issueRows = this.db
      .prepare(`SELECT issue_id, state_json FROM user_issue_states WHERE user_id = ?`)
      .all(userId);

    return {
      userId: userRow.id,
      accountType: userRow.account_type,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
      isOnboarded: Boolean(userRow.is_onboarded),
      preferences: userRow.preferences_json ? JSON.parse(userRow.preferences_json) : null,
      issueStates: Object.fromEntries(
        issueRows.map((row) => [row.issue_id, JSON.parse(row.state_json)]),
      ),
    };
  }

  async syncUserProfile(profile) {
    const upsertUser = this.db.prepare(`
      INSERT INTO users (id, account_type, created_at, updated_at, is_onboarded, preferences_json)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        account_type = excluded.account_type,
        updated_at = excluded.updated_at,
        is_onboarded = excluded.is_onboarded,
        preferences_json = excluded.preferences_json
    `);
    const deleteIssueStates = this.db.prepare(`DELETE FROM user_issue_states WHERE user_id = ?`);
    const insertIssueState = this.db.prepare(`
      INSERT INTO user_issue_states (user_id, issue_id, state_json)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, issue_id) DO UPDATE SET
        state_json = excluded.state_json
    `);

    try {
      this.db.exec("BEGIN");

      upsertUser.run(
        profile.userId,
        profile.accountType,
        profile.createdAt,
        profile.updatedAt,
        profile.isOnboarded ? 1 : 0,
        profile.preferences ? JSON.stringify(profile.preferences) : null,
      );

      deleteIssueStates.run(profile.userId);

      for (const [issueId, state] of Object.entries(profile.issueStates ?? {})) {
        insertIssueState.run(profile.userId, issueId, JSON.stringify(state));
      }

      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return this.getUserProfile(profile.userId);
  }

  async close() {
    this.db.close();
  }

  getInfo() {
    return {
      mode: "sqlite",
      path: sqlitePath,
    };
  }
}

class PostgresStore {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.STACK_PULSE_DB_SSL === "false" ? false : undefined,
    });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        severity TEXT NOT NULL,
        original_title TEXT NOT NULL,
        published_at TIMESTAMPTZ NOT NULL,
        payload_json JSONB NOT NULL
      );
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS issue_tags (
        issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        tag TEXT NOT NULL,
        PRIMARY KEY (issue_id, tag)
      );
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS issue_sources (
        issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        source_url TEXT NOT NULL,
        published_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (issue_id, source_url)
      );
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value_json JSONB NOT NULL
      );
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        account_type TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
        preferences_json JSONB
      );
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS user_issue_states (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        issue_id TEXT NOT NULL,
        state_json JSONB NOT NULL,
        PRIMARY KEY (user_id, issue_id)
      );
    `);
  }

  async syncBundle(bundle) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      for (const issue of bundle.issues) {
        await client.query(
          `
            INSERT INTO issues (id, severity, original_title, published_at, payload_json)
            VALUES ($1, $2, $3, $4, $5::jsonb)
            ON CONFLICT(id) DO UPDATE SET
              severity = EXCLUDED.severity,
              original_title = EXCLUDED.original_title,
              published_at = EXCLUDED.published_at,
              payload_json = EXCLUDED.payload_json
          `,
          [
            issue.id,
            issue.severity,
            issue.originalTitle,
            issue.publishedAt,
            JSON.stringify(issue),
          ],
        );

        await client.query(`DELETE FROM issue_tags WHERE issue_id = $1`, [issue.id]);
        await client.query(`DELETE FROM issue_sources WHERE issue_id = $1`, [issue.id]);

        for (const tag of issue.tags) {
          await client.query(
            `INSERT INTO issue_tags (issue_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [issue.id, tag],
          );
        }

        for (const source of issue.sources) {
          await client.query(
            `
              INSERT INTO issue_sources (issue_id, source_url, published_at)
              VALUES ($1, $2, $3)
              ON CONFLICT DO NOTHING
            `,
            [issue.id, source.url, source.publishedAt],
          );
        }
      }

      await client.query(
        `
          INSERT INTO metadata (key, value_json)
          VALUES ($1, $2::jsonb)
          ON CONFLICT(key) DO UPDATE SET value_json = EXCLUDED.value_json
        `,
        ["content_meta", JSON.stringify(bundle.contentMeta)],
      );
      await client.query(
        `
          INSERT INTO metadata (key, value_json)
          VALUES ($1, $2::jsonb)
          ON CONFLICT(key) DO UPDATE SET value_json = EXCLUDED.value_json
        `,
        ["available_stacks", JSON.stringify(bundle.availableStacks)],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getContentMeta() {
    const result = await this.pool.query(`SELECT value_json FROM metadata WHERE key = $1`, ["content_meta"]);
    return result.rows[0] ? result.rows[0].value_json : null;
  }

  async getAvailableStacks() {
    const result = await this.pool.query(`SELECT value_json FROM metadata WHERE key = $1`, ["available_stacks"]);
    return result.rows[0] ? result.rows[0].value_json : [];
  }

  async getFeed(stacks, cursor, limit) {
    const offset = Number.parseInt(cursor || "0", 10);
    const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const params = [];
    let whereClause = "";

    if (stacks.length > 0) {
      params.push(stacks);
      whereClause = `WHERE EXISTS (
        SELECT 1
        FROM issue_tags
        WHERE issue_tags.issue_id = issues.id
          AND issue_tags.tag = ANY($1::text[])
      )`;
    }

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    params.push(safeLimit + 1, safeOffset);

    const issuesResult = await this.pool.query(
      `
        SELECT issues.payload_json
        FROM issues
        ${whereClause}
        ORDER BY issues.published_at DESC, issues.id DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      params,
    );

    const countParams = [];
    let countWhereClause = "";

    if (stacks.length > 0) {
      countParams.push(stacks);
      countWhereClause = `WHERE EXISTS (
        SELECT 1
        FROM issue_tags
        WHERE issue_tags.issue_id = issues.id
          AND issue_tags.tag = ANY($1::text[])
      )`;
    }

    const countResult = await this.pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM issues
        ${countWhereClause}
      `,
      countParams,
    );

    const rows = issuesResult.rows;
    const issues = rows.slice(0, safeLimit).map((row) => row.payload_json);
    const nextCursor = rows.length > safeLimit ? String(safeOffset + safeLimit) : null;
    const contentMeta = await this.getContentMeta();
    const total = countResult.rows[0]?.total ?? issues.length;

    return {
      issues,
      availableStacks: await this.getAvailableStacks(),
      nextCursor,
      contentMeta: contentMeta
        ? {
            ...contentMeta,
            issueCount: total,
          }
        : createEmptyContentMeta(total),
    };
  }

  async getIssueById(issueId) {
    const result = await this.pool.query(`SELECT payload_json FROM issues WHERE id = $1`, [issueId]);
    return result.rows[0] ? result.rows[0].payload_json : null;
  }

  async getUserProfile(userId) {
    const userResult = await this.pool.query(
      `
        SELECT id, account_type, created_at, updated_at, is_onboarded, preferences_json
        FROM users
        WHERE id = $1
      `,
      [userId],
    );

    if (!userResult.rows[0]) {
      return createEmptyUserProfile(userId);
    }

    const issueStatesResult = await this.pool.query(
      `
        SELECT issue_id, state_json
        FROM user_issue_states
        WHERE user_id = $1
      `,
      [userId],
    );

    const row = userResult.rows[0];

    return {
      userId: row.id,
      accountType: row.account_type,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
      isOnboarded: Boolean(row.is_onboarded),
      preferences: row.preferences_json ?? null,
      issueStates: Object.fromEntries(
        issueStatesResult.rows.map((issueRow) => [issueRow.issue_id, issueRow.state_json]),
      ),
    };
  }

  async syncUserProfile(profile) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(
        `
          INSERT INTO users (id, account_type, created_at, updated_at, is_onboarded, preferences_json)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
          ON CONFLICT(id) DO UPDATE SET
            account_type = EXCLUDED.account_type,
            updated_at = EXCLUDED.updated_at,
            is_onboarded = EXCLUDED.is_onboarded,
            preferences_json = EXCLUDED.preferences_json
        `,
        [
          profile.userId,
          profile.accountType,
          profile.createdAt,
          profile.updatedAt,
          profile.isOnboarded,
          profile.preferences ? JSON.stringify(profile.preferences) : null,
        ],
      );
      await client.query(`DELETE FROM user_issue_states WHERE user_id = $1`, [profile.userId]);

      for (const [issueId, state] of Object.entries(profile.issueStates ?? {})) {
        await client.query(
          `
            INSERT INTO user_issue_states (user_id, issue_id, state_json)
            VALUES ($1, $2, $3::jsonb)
          `,
          [profile.userId, issueId, JSON.stringify(state)],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return this.getUserProfile(profile.userId);
  }

  async close() {
    await this.pool.end();
  }

  getInfo() {
    return {
      mode: "postgres",
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    };
  }
}

export async function createStore() {
  if (getDatabaseMode() !== "postgres") {
    const store = new SqliteStore();
    await store.init();
    return store;
  }

  const postgresStore = new PostgresStore();

  try {
    await postgresStore.init();
    return postgresStore;
  } catch (error) {
    console.warn("Postgres store unavailable. Falling back to local SQLite store.");
    console.warn(error instanceof Error ? error.message : String(error));

    const sqliteStore = new SqliteStore();
    await sqliteStore.init();
    return sqliteStore;
  }
}

export function getStoreInfo() {
  return getDatabaseMode() === "postgres"
    ? {
        mode: "postgres",
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        fallback: "sqlite_on_failure",
      }
    : {
        mode: "sqlite",
        path: sqlitePath,
      };
}
