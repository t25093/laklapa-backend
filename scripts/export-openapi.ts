import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { openApiDocument } from "../src/docs/openapi";

/** יוצר את docs/openapi.json מתוך src/docs/openapi.ts */
const target = join(__dirname, "..", "docs", "openapi.json");
writeFileSync(target, `${JSON.stringify(openApiDocument, null, 2)}\n`, "utf8");
// eslint-disable-next-line no-console
console.log(`openapi.json נוצר: ${target}`);
