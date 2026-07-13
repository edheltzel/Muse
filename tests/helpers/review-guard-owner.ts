import { mkdir, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";

const planDir = process.argv[2];
if (!planDir) throw new Error("plan directory is required");
const guard = join(planDir, ".muse-review.lock.guard");
await mkdir(guard);
await writeFile(join(guard, "owner.json"), `${JSON.stringify({
  nonce: crypto.randomUUID(),
  pid: process.pid,
  createdAt: 0,
})}\n`);
await utimes(guard, new Date(0), new Date(0));
console.log("ready");
await Bun.sleep(60_000);
