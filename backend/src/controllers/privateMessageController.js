import pool from "../db.js";

// 发送私聊消息
export async function sendPrivateMessage(req, res, next) {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: "接收者和消息内容不能为空" });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: "不能给自己发送消息" });
    }

    // 检查是否是好友关系
    const [friendship] = await pool.query(
      "SELECT id FROM user_friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) AND status = 'active'",
      [senderId, receiverId, receiverId, senderId]
    );

    if (friendship.length === 0) {
      return res.status(403).json({ success: false, message: "只能给好友发送消息" });
    }

    const [result] = await pool.query(
      "INSERT INTO private_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [senderId, receiverId, message.trim()]
    );

    res.json({ 
      success: true, 
      message: "消息发送成功",
      data: {
        id: result.insertId,
        senderId,
        receiverId,
        message: message.trim(),
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

// 获取与某个好友的聊天记录
export async function getChatMessages(req, res, next) {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    if (!friendId) {
      return res.status(400).json({ success: false, message: "好友ID不能为空" });
    }

    // 检查是否是好友关系
    const [friendship] = await pool.query(
      "SELECT id FROM user_friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) AND status = 'active'",
      [userId, friendId, friendId, userId]
    );

    if (friendship.length === 0) {
      return res.status(403).json({ success: false, message: "只能查看好友的聊天记录" });
    }

    const [rows] = await pool.query(
      `SELECT pm.id, pm.sender_id, pm.receiver_id, pm.message, pm.is_read, pm.created_at,
              u1.full_name as sender_name, u1.avatar_url as sender_avatar,
              u2.full_name as receiver_name, u2.avatar_url as receiver_avatar
       FROM private_messages pm
       JOIN users u1 ON pm.sender_id = u1.id
       JOIN users u2 ON pm.receiver_id = u2.id
       WHERE (pm.sender_id = ? AND pm.receiver_id = ?) OR (pm.sender_id = ? AND pm.receiver_id = ?)
       ORDER BY pm.created_at ASC`,
      [userId, friendId, friendId, userId]
    );

    // 标记消息为已读
    await pool.query(
      "UPDATE private_messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE",
      [userId, friendId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// 获取所有私聊会话列表
export async function getChatConversations(req, res, next) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT DISTINCT 
        CASE 
          WHEN pm.sender_id = ? THEN pm.receiver_id 
          ELSE pm.sender_id 
        END as friend_id,
        u.full_name,
        u.avatar_url,
        u.college,
        u.major,
        MAX(pm.created_at) as last_message_time,
        (SELECT COUNT(*) FROM private_messages WHERE receiver_id = ? AND sender_id = u.id AND is_read = FALSE) as unread_count,
        (SELECT message FROM private_messages WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) as last_message
       FROM private_messages pm
       JOIN users u ON (CASE WHEN pm.sender_id = ? THEN pm.receiver_id ELSE pm.sender_id END) = u.id
       WHERE (pm.sender_id = ? OR pm.receiver_id = ?)
       AND EXISTS (
         SELECT 1 FROM user_friendships uf 
         WHERE (uf.user_id = ? AND uf.friend_id = u.id) OR (uf.user_id = u.id AND uf.friend_id = ?)
         AND uf.status = 'active'
       )
       GROUP BY u.id, u.full_name, u.avatar_url, u.college, u.major
       ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// 标记消息为已读
export async function markMessagesAsRead(req, res, next) {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    await pool.query(
      "UPDATE private_messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE",
      [userId, friendId]
    );

    res.json({ success: true, message: "消息已标记为已读" });
  } catch (error) {
    next(error);
  }
}
