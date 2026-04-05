import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const envFilePath = path.join(rootDir, ".env");

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const parsed = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    parsed[key] = value;
  }

  return parsed;
}

function run(name, args, extraEnv = {}) {
  const command = `corepack pnpm ${args.join(" ")}`;

  const child = spawn(command, {
    cwd: rootDir,
    env: {
      ...process.env,
      ...baseEnv,
      ...extraEnv,
    },
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    if (isShuttingDown) return;
    if (code !== 0) {
      console.error(`\n[${name}] exited with code ${code}. Shutting down...`);
      shutdown(code ?? 1);
    }
  });

  return child;
}

const baseEnv = parseDotEnv(envFilePath);

let isShuttingDown = false;
let apiProcess;
let webProcess;

function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (apiProcess && !apiProcess.killed) apiProcess.kill();
  if (webProcess && !webProcess.killed) webProcess.kill();

  setTimeout(() => process.exit(code), 100);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("Starting API server on http://localhost:3000 ...");
apiProcess = run("api", ["--filter", "@workspace/api-server", "run", "dev"], {
  NODE_ENV: "development",
  PORT: "3000",
});

console.log("Starting frontend on http://localhost:5173 ...");
webProcess = run("web", ["--filter", "@workspace/school-platform", "run", "dev"], {
  NODE_ENV: "development",
  PORT: "5173",
  BASE_PATH: "/",
});
