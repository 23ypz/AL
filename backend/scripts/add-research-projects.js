import mysql from "mysql2/promise";
import "dotenv/config";

const {
  DB_HOST = "localhost",
  DB_PORT = 3306,
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "academic_light"
} = process.env;

async function ensureResearchProjectsTable() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS research_projects (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      college VARCHAR(100) NOT NULL,
      field VARCHAR(120) NOT NULL,
      stage ENUM('课题招募', '数据采集', '论文撰写', '成果申报') DEFAULT '课题招募',
      lab VARCHAR(150),
      plan TEXT,
      summary TEXT,
      team_size INT UNSIGNED DEFAULT 0,
      created_by INT UNSIGNED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await connection.query(createTableSQL);
    console.log("research_projects table is ready.");
  } finally {
    await connection.end();
  }
}

ensureResearchProjectsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create research_projects table:", error);
    process.exit(1);
  });
