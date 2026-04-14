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
  const store = getDatabaseMode() === "postgres" ? new PostgresStore() : new SqliteStore();
  await store.init();
  return store;
}

export function getStoreInfo() {
  return getDatabaseMode() === "postgres"
    ? {
        mode: "postgres",
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      }
    : {
        mode: "sqlite",
        path: sqlitePath,
      };
}
