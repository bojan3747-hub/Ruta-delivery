import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const schemaPath = fileURLToPath(new URL("../db/schema.sql", import.meta.url));
const schema = readFileSync(schemaPath, "utf8");

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(schema);
  console.log("Schema applied.");
} finally {
  await client.end();
}
