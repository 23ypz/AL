import pool from "../db.js";

function mapNotification(row) {
  let payload = null;
  try {
    payload = row.payload ? JSON.parse(row.payload) : null;
  } catch (error) {
    payload = row.payload;
  }

  return {
    id: row.id,
    type: row.type,
    payload,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at
  };
}

export async function listNotifications(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "需要登录才能查看消息" });
    }

    const [rows] = await pool.query(
      `SELECT *
         FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50`,
      [req.user.id]
    );

    res.json(rows.map(mapNotification));
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "需要登录才能操作消息" });
    }

    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
      return res.status(400).json({ message: "无效的消息 ID" });
    }

    const [rows] = await pool.query("SELECT id, user_id FROM notifications WHERE id = ?", [notificationId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "消息不存在" });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "无权操作该消息" });
    }

    await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [notificationId]);
    res.json({ message: "消息已标记为已读" });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "需要登录才能操作消息" });
    }

    await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.user.id]);
    res.json({ message: "所有消息已标记为已读" });
  } catch (error) {
    next(error);
  }
}
