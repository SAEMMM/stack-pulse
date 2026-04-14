import fs from "node:fs";
import path from "node:path";
import { openDatabase, getDatabasePath } from "../server/db.mjs";

const projectRoot = process.cwd();
const contentPath = path.join(projectRoot, "content", "app-content.json");

const raw = fs.readFileSync(contentPath, "utf8");
const bundle = JSON.parse(raw);
const db = openDatabase();

const insertIssue = db.prepare(`
  INSERT INTO issues (id, severity, original_title, published_at, payload_json)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    severity = excluded.severity,
    original_title = excluded.original_title,
    published_at = excluded.published_at,
    payload_json = excluded.payload_json
`);

const insertTag = db.prepare(`
  INSERT OR IGNORE INTO issue_tags (issue_id, tag)
  VALUES (?, ?)
`);

const insertSource = db.prepare(`
  INSERT OR IGNORE INTO issue_sources (issue_id, source_url, published_at)
  VALUES (?, ?, ?)
`);

const deleteTags = db.prepare(`DELETE FROM issue_tags WHERE issue_id = ?`);
const deleteSources = db.prepare(`DELETE FROM issue_sources WHERE issue_id = ?`);
const upsertMetadata = db.prepare(`
  INSERT INTO metadata (key, value_json)
  VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json
`);

try {
  db.exec("BEGIN");

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
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

console.log(`Synced ${bundle.issues.length} issues into ${getDatabasePath()}`);
