import pool from "../db.js";

// 收藏竞赛
export async function favoriteCompetition(req, res, next) {
  try {
    const { competitionId } = req.body;
    const userId = req.user.id;
    
    // 检查是否已收藏
    const [existing] = await pool.query(
      "SELECT id FROM competition_favorites WHERE user_id = ? AND competition_id = ?",
      [userId, competitionId]
    );
    
    if (existing.length > 0) {
      // 已收藏，取消收藏
      await pool.query(
        "DELETE FROM competition_favorites WHERE user_id = ? AND competition_id = ?",
        [userId, competitionId]
      );
      
      // 更新竞赛的收藏数量
      await pool.query(
        "UPDATE competitions SET favorite_count = favorite_count - 1 WHERE id = ?",
        [competitionId]
      );
      
      res.json({ success: true, message: "已取消收藏", favorited: false });
    } else {
      // 未收藏，添加收藏
      await pool.query(
        "INSERT INTO competition_favorites (user_id, competition_id) VALUES (?, ?)",
        [userId, competitionId]
      );
      
      // 更新竞赛的收藏数量
      await pool.query(
        "UPDATE competitions SET favorite_count = favorite_count + 1 WHERE id = ?",
        [competitionId]
      );
      
      res.json({ success: true, message: "收藏成功", favorited: true });
    }
  } catch (error) {
    next(error);
  }
}

// 获取用户收藏的竞赛
export async function getUserFavorites(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const [favorites] = await pool.query(
      `SELECT c.*, cf.created_at as favorited_at
       FROM competition_favorites cf
       JOIN competitions c ON cf.competition_id = c.id
       WHERE cf.user_id = ? AND c.status = 'active'
       ORDER BY cf.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );
    
    // 获取总数
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM competition_favorites cf JOIN competitions c ON cf.competition_id = c.id WHERE cf.user_id = ? AND c.status = 'active'",
      [userId]
    );
    
    res.json({
      success: true,
      data: favorites,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

// 检查竞赛是否已收藏
export async function checkFavoriteStatus(req, res, next) {
  try {
    const { competitionId } = req.params;
    const userId = req.user.id;
    
    const [existing] = await pool.query(
      "SELECT id FROM competition_favorites WHERE user_id = ? AND competition_id = ?",
      [userId, competitionId]
    );
    
    res.json({ 
      success: true, 
      favorited: existing.length > 0 
    });
  } catch (error) {
    next(error);
  }
}
