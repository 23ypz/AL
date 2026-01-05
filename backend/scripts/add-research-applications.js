import mysql from "mysql2/promise";
import "dotenv/config";

const {
  DB_HOST = "localhost",
  DB_PORT = 3306,
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "academic_light"
} = process.env;

async function ensureResearchApplicationsTable() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS research_applications (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      project_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED,
      applicant_name VARCHAR(100) NOT NULL,
      student_number VARCHAR(50) NOT NULL,
      major VARCHAR(100) NOT NULL,
      contact VARCHAR(120) NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_project_user (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_project_id (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await connection.query(createTableSQL);
    console.log("research_applications table is ready.");
  } finally {
    await connection.end();
  }
}

ensureResearchApplicationsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create research_applications table:", error);
    process.exit(1);
  });
