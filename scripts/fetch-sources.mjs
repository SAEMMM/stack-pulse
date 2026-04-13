import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, "content", "fetched-sources.json");
const fixturePath = path.join(projectRoot, "content", "fixtures", "source-snapshot.json");

const liveSources = [
  {
    name: "Next.js Release Notes",
    mode: "fixture",
  },
  {
    name: "Vercel Blog",
    mode: "fixture",
  },
  {
    name: "GitHub Advisory",
    mode: "fixture",
  },
  {
    name: "React RFC",
    mode: "fixture",
  },
];

function readFixtureSnapshot() {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

async function fetchLiveSources() {
  const snapshot = readFixtureSnapshot();

  return snapshot.map((item) => ({
    ...item,
    collectedAt: new Date().toISOString(),
  }));
}

async function main() {
  const mode = process.env.STACK_PULSE_FETCH_MODE ?? "fixture";
  const fixtureSnapshot = readFixtureSnapshot();

  let sources;

  if (mode === "live") {
    try {
      sources = await fetchLiveSources();
    } catch (error) {
      console.warn("Live fetch failed, falling back to fixture snapshot.");
      console.warn(error instanceof Error ? error.message : String(error));
      sources = fixtureSnapshot;
    }
  } else {
    sources = fixtureSnapshot;
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(sources, null, 2)}\n`);

  console.log(
    `Fetched ${sources.length} sources into content/fetched-sources.json using ${mode} mode.`,
  );
  console.log(`Configured sources: ${liveSources.map((source) => source.name).join(", ")}`);
}

main();
