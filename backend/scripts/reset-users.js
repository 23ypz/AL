import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

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
  const adminEmail = process.env.ADMIN_EMAIL || "admin@academic-light.test";

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true
  });

  console.log("开始删除所有竞赛数据...");
  const [competitionResult] = await connection.query("DELETE FROM competitions");
  console.log(`已删除 ${competitionResult.affectedRows} 条竞赛记录。`);

  console.log("开始删除学生/导师账号...");
  const [userResult] = await connection.query("DELETE FROM users WHERE email <> ?", [adminEmail]);
  console.log(`已删除 ${userResult.affectedRows} 个账号，保留管理员 ${adminEmail}。`);

  await connection.end();
  console.log("数据清理完成，可以重新注册账号 ✅");
}

main().catch((error) => {
  console.error("清理失败：", error.message);
  process.exit(1);
});
