import pool from "../db.js";

// 发送好友申请
export async function sendFriendRequest(req, res, next) {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: "不能给自己发送好友申请" });
    }

    // 检查是否已经是好友
    const [existingFriendship] = await pool.query(
      "SELECT id FROM user_friendships WHERE user_id = ? AND friend_id = ? AND status = 'active'",
      [senderId, receiverId]
    );
    if (existingFriendship.length > 0) {
      return res.status(400).json({ success: false, message: "已经是好友关系" });
    }

    // 检查是否已有任何状态的申请
    const [existingRequest] = await pool.query(
      "SELECT id, status FROM friend_requests WHERE sender_id = ? AND receiver_id = ?",
      [senderId, receiverId]
    );
    if (existingRequest.length > 0) {
      const status = existingRequest[0].status;
      if (status === 'pending') {
        return res.status(400).json({ success: false, message: "已存在待处理的好友申请" });
      } else if (status === 'accepted') {
        return res.status(400).json({ success: false, message: "已经是好友关系" });
      } else if (status === 'rejected') {
        return res.status(400).json({ success: false, message: "已拒绝过该好友申请" });
      }
    }

    // 创建好友申请
    const [result] = await pool.query(
      "INSERT INTO friend_requests (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [senderId, receiverId, message]
    );

    console.log('好友申请创建成功:', { requestId: result.insertId, senderId, receiverId });

    // 暂时注释掉通知创建
    // await pool.query(
    //   "INSERT INTO notifications (user_id, type, payload) VALUES (?, 'friend_request', ?)",
    //   [receiverId, JSON.stringify({
    //     requestId: result.insertId,
    //     senderId,
    //     message
    //   })]
    // );

    res.json({ success: true, message: "好友申请已发送" });
  } catch (error) {
    console.error('发送好友申请错误:', error);
    next(error);
  }
}

// 获取收到的好友申请
export async function getReceivedRequests(req, res, next) {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.query(
      `SELECT fr.id, fr.sender_id, fr.message, fr.created_at,
              u.full_name, u.email, u.avatar_url
       FROM friend_requests fr
       JOIN users u ON fr.sender_id = u.id
       WHERE fr.receiver_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// 获取发送的好友申请
export async function getSentRequests(req, res, next) {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.query(
      `SELECT fr.id, fr.receiver_id, fr.message, fr.status, fr.created_at,
              u.full_name, u.email, u.avatar_url
       FROM friend_requests fr
       JOIN users u ON fr.receiver_id = u.id
       WHERE fr.sender_id = ?
       ORDER BY fr.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// 处理好友申请（接受/拒绝）
export async function handleFriendRequest(req, res, next) {
  try {
    const { action } = req.body; // action: 'accept' or 'reject'
    const { requestId } = req.params; // 从路由参数获取
    const userId = req.user.id;

    console.log('处理好友申请:', { requestId, action, userId });

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "无效的操作" });
    }

    // 获取申请信息
    const [requestRows] = await pool.query(
      "SELECT sender_id, receiver_id FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'",
      [requestId, userId]
    );

    console.log('查询结果:', requestRows);

    if (requestRows.length === 0) {
      return res.status(404).json({ success: false, message: "申请不存在或已处理" });
    }

    const request = requestRows[0];
    const senderId = request.sender_id;
    const receiverId = request.receiver_id;

    console.log('申请信息:', { senderId, receiverId });

    // 更新申请状态
    await pool.query(
      "UPDATE friend_requests SET status = ? WHERE id = ?",
      [action === 'accept' ? 'accepted' : 'rejected', requestId]
    );

    // 如果接受申请，创建好友关系
    if (action === 'accept') {
      console.log('创建好友关系:', { senderId, receiverId });
      await pool.query(
        "INSERT INTO user_friendships (user_id, friend_id) VALUES (?, ?), (?, ?)",
        [senderId, receiverId, receiverId, senderId]
      );

      // 创建接受通知
      await pool.query(
        "INSERT INTO notifications (user_id, type, payload) VALUES (?, 'friend_accepted', ?)",
        [senderId, JSON.stringify({
          friendId: receiverId
        })]
      );
    }

    res.json({ 
      success: true, 
      message: action === 'accept' ? "已接受好友申请" : "已拒绝好友申请" 
    });
  } catch (error) {
    console.error('处理好友申请错误:', error);
    next(error);
  }
}

// 获取好友列表
export async function getFriends(req, res, next) {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.avatar_url, u.college, u.major, uf.created_at
       FROM user_friendships uf
       JOIN users u ON uf.friend_id = u.id
       WHERE uf.user_id = ? AND uf.status = 'active'
       ORDER BY uf.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// 删除好友关系
export async function removeFriend(req, res, next) {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    // 删除双向好友关系
    await pool.query(
      "DELETE FROM user_friendships WHERE user_id = ? AND friend_id = ?",
      [userId, friendId]
    );

    await pool.query(
      "DELETE FROM user_friendships WHERE user_id = ? AND friend_id = ?",
      [friendId, userId]
    );

    // 清理相关的好友申请记录
    await pool.query(
      "DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
      [userId, friendId, friendId, userId]
    );

    console.log('好友关系和申请记录已清理:', { userId, friendId });

    res.json({ success: true, message: "已删除好友关系" });
  } catch (error) {
    console.error('删除好友关系错误:', error);
    next(error);
  }
}

// 保留原有的 listFriends 函数以兼容现有代码
export async function listFriends(req, res, next) {
  return getFriends(req, res, next);
}
