// 一回限りの管理スクリプト: Supabase Management API 経由で SQL 実行
// 使い方: SB_PAT=xxx node scripts/sb-exec-sql.mjs <ref> <sqlPath>
import { readFileSync } from "node:fs";

const [, , ref, sqlPath] = process.argv;
const pat = process.env.SB_PAT;
if (!pat || !ref || !sqlPath) {
  console.error("Usage: SB_PAT=xxx node sb-exec-sql.mjs <ref> <sqlPath>");
  process.exit(1);
}
const query = readFileSync(sqlPath, "utf8");
const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);
const text = await res.text();
console.log(`HTTP ${res.status}`);
console.log(text.slice(0, 2000));
