import { readFile, writeFile } from "node:fs/promises";
import { acquirePlanLock } from "./parent-plan-lock";

const [planDir, mode = "--hold", dataPath, key] = process.argv.slice(2);
if (!planDir) throw new Error("plan directory is required");
if (mode === "--signal-attempt") console.log("attempting");
const lock = await acquirePlanLock(planDir);
console.log("acquired");
try {
  if (mode === "--write") {
    if (!dataPath || !key) throw new Error("data path and key are required for writes");
    const entries = JSON.parse(await readFile(dataPath, "utf8")) as string[];
    entries.push(key);
    await writeFile(dataPath, `${JSON.stringify(entries)}\n`);
  } else if (mode === "--controlled-write") {
    if (!dataPath || !key) throw new Error("data path and key are required for writes");
    await new Response(Bun.stdin.stream()).text();
    const entries = JSON.parse(await readFile(dataPath, "utf8")) as string[];
    entries.push(key);
    await writeFile(dataPath, `${JSON.stringify(entries)}\n`);
  } else {
    await Promise.withResolvers<never>().promise;
  }
} finally {
  await lock.release();
}
console.log("acknowledged");
