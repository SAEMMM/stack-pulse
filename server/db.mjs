import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, "server", "data");
const dbPath = path.join(dataDir, "stack-pulse.sqlite");

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function openDatabase() {
  ensureDataDir();
  const db = new DatabaseSync(dbPath);
  db.exec(`
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

  return db;
}

export function getDatabasePath() {
  return dbPath;
}
