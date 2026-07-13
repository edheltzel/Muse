import { acquirePlanLock } from "../../plugins/Muse/skills/muse/tools/interactive-plan/plan-lock";

const planDir = process.argv[2];
if (!planDir) throw new Error("plan directory is required");
const lock = await acquirePlanLock(planDir);
console.log("ready");
try {
  await Promise.withResolvers<never>().promise;
} finally {
  await lock.release();
}
