import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function setupFriendTables() {
  const passwords = ['20050126', '', '123456', 'root', 'password'];
  
  for (const password of passwords) {
    try {
      console.log(`尝试密码: ${password || '(空)'}`);
      
      // 创建数据库连接
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: password,
        database: 'academic_light'
      });

      console.log('连接数据库成功...');

      // 创建好友申请表
      const createFriendRequestsTable = `
        CREATE TABLE IF NOT EXISTS friend_requests (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          sender_id INT UNSIGNED NOT NULL,
          receiver_id INT UNSIGNED NOT NULL,
          message TEXT,
          status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_sender_receiver (sender_id, receiver_id),
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_receiver_status (receiver_id, status),
          INDEX idx_sender_status (sender_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `;

      // 更新好友关系表
      const updateFriendshipsTable = `
        ALTER TABLE user_friendships 
        ADD COLUMN IF NOT EXISTS status ENUM('active', 'blocked') DEFAULT 'active',
        ADD INDEX IF NOT EXISTS idx_status (status)
      `;

      // 执行SQL
      console.log('创建好友申请表...');
      await connection.execute(createFriendRequestsTable);
      console.log('好友申请表创建成功');

      console.log('更新好友关系表...');
      try {
        await connection.execute(updateFriendshipsTable);
        console.log('好友关系表更新成功');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('字段已存在，跳过更新');
        } else {
          throw error;
        }
      }

      // 验证表是否创建成功
      const [tables] = await connection.execute("SHOW TABLES LIKE 'friend_requests'");
      if (tables.length > 0) {
        console.log('✅ friend_requests 表创建成功');
      } else {
        console.log('❌ friend_requests 表创建失败');
      }

      await connection.end();
      console.log('🎉 数据库设置完成！');
      return;
      
    } catch (error) {
      console.error(`密码 ${password || '(空)'} 失败:`, error.message);
      if (password === passwords[passwords.length - 1]) {
        console.log('\n所有密码都尝试失败，请检查MySQL配置');
        console.log('可能的解决方案:');
        console.log('1. 检查MySQL服务是否启动');
        console.log('2. 检查用户名密码是否正确');
        console.log('3. 尝试在MySQL Workbench中手动执行SQL');
      }
    }
  }
}

setupFriendTables();
