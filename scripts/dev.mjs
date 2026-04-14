import { spawn } from "node:child_process";

const processes = [];

function run(name, command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  processes.push(child);
}

run("api", process.execPath, ["server/index.mjs"]);
run("expo", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "start"]);

function shutdown() {
  for (const child of processes) {
    child.kill("SIGINT");
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
