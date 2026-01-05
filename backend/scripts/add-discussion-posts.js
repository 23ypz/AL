import mysql from "mysql2/promise";
import "dotenv/config";

const {
  DB_HOST = "localhost",
  DB_PORT = 3306,
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "academic_light"
} = process.env;

async function ensureDiscussionPostsTable() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS discussion_posts (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      college VARCHAR(100),
      tags VARCHAR(200),
      created_by INT UNSIGNED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await connection.query(createTableSQL);
    console.log("discussion_posts table is ready.");
  } finally {
    await connection.end();
  }
}

ensureDiscussionPostsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create discussion_posts table:", error);
    process.exit(1);
  });
