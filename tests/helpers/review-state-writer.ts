import { updateReviewState } from "../../plugins/Muse/skills/muse/tools/interactive-plan/state-store";

const [planDir, key, value] = process.argv.slice(2);
if (!planDir || !key || !value) throw new Error("Usage: review-state-writer <plan-dir> <key> <value>");
await updateReviewState(planDir, { answers: { [key]: value } });
