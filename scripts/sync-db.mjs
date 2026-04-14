import fs from "node:fs";
import path from "node:path";
import { createStore, getStoreInfo } from "../server/store.mjs";

const projectRoot = process.cwd();
const contentPath = path.join(projectRoot, "content", "app-content.json");

const raw = fs.readFileSync(contentPath, "utf8");
const bundle = JSON.parse(raw);
const store = await createStore();

try {
  await store.syncBundle(bundle);
  const storeInfo = getStoreInfo();
  console.log(`Synced ${bundle.issues.length} issues into ${JSON.stringify(storeInfo)}`);
} finally {
  await store.close();
}
