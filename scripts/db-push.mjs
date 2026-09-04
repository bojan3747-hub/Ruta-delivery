import "dotenv/config";
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "psql",
  [process.env.DATABASE_URL ?? "", "-f", "db/schema.sql"],
  { stdio: "inherit" }
);
process.exit(result.status ?? 1);
