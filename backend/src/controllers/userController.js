import pool from "../db.js";

export async function getUserPublicProfile(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "无效的用户 ID" });
    }

    const [rows] = await pool.query(
      `SELECT id, full_name, email, role, college, major, avatar_url, bio, expertise_tags, created_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = rows[0];
    res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        college: user.college,
        major: user.major,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        expertiseTags: user.expertise_tags,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}
