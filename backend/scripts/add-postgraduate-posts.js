import mysql from "mysql2/promise";
import "dotenv/config";

const {
  DB_HOST = "localhost",
  DB_PORT = 3306,
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "academic_light"
} = process.env;

async function ensurePostgraduatePostsTable() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS postgraduate_posts (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      college VARCHAR(100) NOT NULL,
      category VARCHAR(120) DEFAULT '经验分享',
      stage ENUM('资料收集', '网申/报名', '笔试/测评', '面试汇报', '录取公示') DEFAULT '资料收集',
      highlight TEXT,
      resources TEXT,
      deadline DATE NULL,
      created_by INT UNSIGNED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await connection.query(createTableSQL);
    console.log("postgraduate_posts table is ready.");
  } finally {
    await connection.end();
  }
}

ensurePostgraduatePostsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create postgraduate_posts table:", error);
    process.exit(1);
  });
