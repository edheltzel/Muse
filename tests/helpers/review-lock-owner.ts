import { readFile, writeFile } from "node:fs/promises";
import { acquirePlanLock } from "../../plugins/Muse/skills/muse/tools/interactive-plan/plan-lock";

const planDir = process.argv[2];
if (!planDir) throw new Error("plan directory is required");
const mode = process.argv[3];
if (mode === "--signal-attempt" || mode === "--signal-write") console.log("attempting");
const lock = await acquirePlanLock(planDir);
console.log("ready");
try {
  if (mode === "--write" || mode === "--signal-write") {
    const dataPath = process.argv[4];
    const key = process.argv[5];
    if (!dataPath || !key) throw new Error("data path and key are required for writes");
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
