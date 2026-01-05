import pool from "../db.js";

// 获取所有竞赛
export async function getCompetitions(req, res, next) {
  try {
    const { level, category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE status = 'active'";
    const params = [];
    
    // 筛选条件
    if (level) {
      whereClause += " AND level = ?";
      params.push(level);
    }
    
    if (category) {
      whereClause += " AND category LIKE ?";
      params.push(`%${category}%`);
    }
    
    if (search) {
      whereClause += " AND (name LIKE ? OR description LIKE ? OR organizer LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // 查询竞赛列表
    const [competitions] = await pool.query(
      `SELECT id, name, level, category, description, organizer, event_time,
              popularity_score, view_count, favorite_count, created_at
       FROM competitions 
       ${whereClause}
       ORDER BY popularity_score DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    
    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM competitions ${whereClause}`,
      params
    );
    
    res.json({
      success: true,
      data: competitions,
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

// 获取竞赛详情
export async function getCompetitionById(req, res, next) {
  try {
    const { id } = req.params;
    
    const [competitions] = await pool.query(
      "SELECT * FROM competitions WHERE id = ? AND status = 'active'",
      [id]
    );
    
    if (competitions.length === 0) {
      return res.status(404).json({ success: false, message: "竞赛不存在" });
    }
    
    // 增加浏览次数
    await pool.query(
      "UPDATE competitions SET view_count = view_count + 1 WHERE id = ?",
      [id]
    );
    
    res.json({ success: true, data: competitions[0] });
  } catch (error) {
    next(error);
  }
}

// 创建竞赛（仅导师）
export async function createCompetition(req, res, next) {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ success: false, message: "只有导师可以创建竞赛" });
    }
    
    // 定义允许创建的字段
    const allowedFields = [
      'name', 'level', 'category', 'description', 'organizer', 'co_organizer',
      'official_website', 'contact_email', 'contact_phone', 'event_time',
      'registration_time', 'duration', 'target_participants', 'education_requirement',
      'team_requirement', 'registration_fee', 'technical_requirements',
      'competition_format', 'knowledge_areas', 'technical_skills',
      'competition_process', 'evaluation_criteria', 'award_settings',
      'award_ratio', 'participant_scale', 'participating_universities',
      'historical_topics', 'growth_trend', 'popularity_score'
    ];
    
    // 过滤只包含允许的字段
    const competitionData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        competitionData[field] = req.body[field];
      }
    });
    
    // 添加创建者和更新者信息
    competitionData.created_by = req.user.id;
    competitionData.updated_by = req.user.id;
    
    if (Object.keys(competitionData).length < 3) { // 至少需要 name, level, category
      return res.status(400).json({ success: false, message: "请提供必要的竞赛信息" });
    }
    
    const fields = Object.keys(competitionData).join(', ');
    const placeholders = Object.keys(competitionData).map(() => '?').join(', ');
    const values = Object.values(competitionData);
    
    const [result] = await pool.query(
      `INSERT INTO competitions (${fields}) VALUES (${placeholders})`,
      values
    );
    
    res.json({
      success: true,
      message: "竞赛创建成功",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建竞赛错误:', error);
    next(error);
  }
}

// 更新竞赛（仅导师）
export async function updateCompetition(req, res, next) {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ success: false, message: "只有导师可以修改竞赛" });
    }
    
    const { id } = req.params;
    
    // 定义允许更新的字段
    const allowedFields = [
      'name', 'level', 'category', 'description', 'organizer', 'co_organizer',
      'official_website', 'contact_email', 'contact_phone', 'event_time',
      'registration_time', 'duration', 'target_participants', 'education_requirement',
      'team_requirement', 'registration_fee', 'technical_requirements',
      'competition_format', 'knowledge_areas', 'technical_skills',
      'competition_process', 'evaluation_criteria', 'award_settings',
      'award_ratio', 'participant_scale', 'participating_universities',
      'historical_topics', 'growth_trend', 'popularity_score'
    ];
    
    // 过滤只包含允许的字段
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    // 添加更新者信息
    updateData.updated_by = req.user.id;
    
    if (Object.keys(updateData).length === 1) { // 只有 updated_by
      return res.status(400).json({ success: false, message: "没有提供有效的更新数据" });
    }
    
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    
    const [result] = await pool.query(
      `UPDATE competitions SET ${fields} WHERE id = ?`,
      [...values, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "竞赛不存在" });
    }
    
    res.json({ success: true, message: "竞赛更新成功" });
  } catch (error) {
    console.error('更新竞赛错误:', error);
    next(error);
  }
}

// 删除竞赛（仅导师）
export async function deleteCompetition(req, res, next) {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ success: false, message: "只有导师可以删除竞赛" });
    }
    
    const { id } = req.params;
    
    const [result] = await pool.query(
      "UPDATE competitions SET status = 'inactive', updated_by = ? WHERE id = ?",
      [req.user.id, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "竞赛不存在" });
    }
    
    res.json({ success: true, message: "竞赛删除成功" });
  } catch (error) {
    next(error);
  }
}

// 获取竞赛统计数据
export async function getCompetitionStats(req, res, next) {
  try {
    // 基础统计
    const [basicStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN level = 'A' THEN 1 END) as level_a,
        COUNT(CASE WHEN level = 'B' THEN 1 END) as level_b,
        COUNT(CASE WHEN level = 'C' THEN 1 END) as level_c,
        COUNT(CASE WHEN level = 'D' THEN 1 END) as level_d,
        AVG(popularity_score) as avg_popularity,
        SUM(view_count) as total_views,
        SUM(favorite_count) as total_favorites
      FROM competitions 
      WHERE status = 'active'
    `);
    
    // 本月新增
    const [monthlyStats] = await pool.query(`
      SELECT COUNT(*) as monthly_new
      FROM competitions 
      WHERE status = 'active' 
      AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
    `);
    
    // 热门竞赛
    const [popularCompetitions] = await pool.query(`
      SELECT id, name, level, popularity_score
      FROM competitions 
      WHERE status = 'active'
      ORDER BY popularity_score DESC 
      LIMIT 5
    `);
    
    // 分类统计
    const [categoryStats] = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM competitions 
      WHERE status = 'active'
      GROUP BY category
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      data: {
        basic: basicStats[0],
        monthly: monthlyStats[0],
        popular: popularCompetitions,
        categories: categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
}
