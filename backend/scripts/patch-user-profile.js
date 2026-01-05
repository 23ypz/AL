import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

async function main() {
  const host = requireEnv("DB_HOST", "localhost");
  const port = Number(requireEnv("DB_PORT", 3306));
  const user = requireEnv("DB_USER", "root");
  const password = requireEnv("DB_PASSWORD", "");
  const database = requireEnv("DB_NAME", "academic_light");

  const connection = await mysql.createConnection({ host, port, user, password, database });

  const columns = [
    { name: "avatar_url", definition: "MEDIUMTEXT NULL" },
    { name: "bio", definition: "TEXT NULL" },
    { name: "expertise_tags", definition: "VARCHAR(255) NULL" },
    { name: "major", definition: "VARCHAR(100) NULL" }
  ];

  for (const column of columns) {
    const [rows] = await connection.query(
      "SHOW COLUMNS FROM users LIKE ?",
      [column.name]
    );
    if (rows.length === 0) {
      console.log(`添加列 ${column.name} ...`);
      await connection.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`);
    } else {
      console.log(`列 ${column.name} 已存在，跳过`);
    }
  }

  await connection.end();
  console.log("用户资料字段补丁执行完成 ✅");
}

main().catch((error) => {
  console.error("补丁执行失败：", error.message);
  process.exit(1);
});
