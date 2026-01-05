import mysql from "mysql2/promise";
import "dotenv/config";

const {
  DB_HOST = "localhost",
  DB_PORT = 3306,
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "academic_light"
} = process.env;

async function ensureDiscussionCommentsTable() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS discussion_comments (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      post_id INT UNSIGNED NOT NULL,
      content TEXT NOT NULL,
      created_by INT UNSIGNED,
      parent_id INT UNSIGNED NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_id) REFERENCES discussion_comments(id) ON DELETE CASCADE,
      INDEX idx_post_id (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    ALTER TABLE discussion_comments
      ADD COLUMN IF NOT EXISTS parent_id INT UNSIGNED NULL AFTER created_by;

    ALTER TABLE discussion_comments
      ADD CONSTRAINT IF NOT EXISTS fk_discussion_comments_parent
      FOREIGN KEY (parent_id) REFERENCES discussion_comments(id) ON DELETE CASCADE;
  `;

  try {
    await connection.query(createTableSQL);
    console.log("discussion_comments table is ready.");
  } finally {
    await connection.end();
  }
}

ensureDiscussionCommentsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create discussion_comments table:", error);
    process.exit(1);
  });
