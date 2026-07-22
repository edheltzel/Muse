import { renderPlanFolder } from "./render";
import { servePlan } from "./server";

function usage(): never {
  throw new Error("Usage: bun runtime.mjs <render|serve> <plan-dir> [port]");
}

const [command, planDir, portArg] = process.argv.slice(2);
if (!command || !planDir) usage();

if (command === "render") {
  const outputs = await renderPlanFolder(planDir);
  console.log(`Rendered ${outputs.indexPath}`);
  console.log(`Static ${outputs.staticExportPath}`);
} else if (command === "serve") {
  const port = Number(portArg ?? 7374);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) usage();
  const server = await servePlan(planDir, port);
  console.log(`muse plan review: http://localhost:${server.port}/`);
} else {
  usage();
}
