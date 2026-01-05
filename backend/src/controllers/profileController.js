import pool from "../db.js";

export async function getProfileStats(req, res, next) {
  try {
    const userId = req.user.id;

    // 发帖数
    const [postsResult] = await pool.query(
      "SELECT COUNT(*) AS posts FROM discussion_posts WHERE created_by = ?",
      [userId]
    );

    // 评论数
    const [commentsResult] = await pool.query(
      "SELECT COUNT(*) AS comments FROM discussion_comments WHERE created_by = ?",
      [userId]
    );

    // 关注数（好友数）
    const [followingResult] = await pool.query(
      "SELECT COUNT(*) AS following FROM user_friendships WHERE user_id = ?",
      [userId]
    );

    // 粉丝数（被关注数）
    const [followersResult] = await pool.query(
      "SELECT COUNT(*) AS followers FROM user_friendships WHERE friend_id = ?",
      [userId]
    );

    // 本月贡献（发帖+评论）
    const [contributionsResult] = await pool.query(
      `SELECT COUNT(*) AS contributions
       FROM (
         SELECT created_at FROM discussion_posts WHERE created_by = ? AND MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE)
         UNION ALL
         SELECT created_at FROM discussion_comments WHERE created_by = ? AND MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE)
       ) AS acts`,
      [userId, userId]
    );

    res.json({
      stats: {
        posts: postsResult[0].posts,
        comments: commentsResult[0].comments,
        following: followingResult[0].following,
        followers: followersResult[0].followers,
        contributions: contributionsResult[0].contributions
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecentActivities(req, res, next) {
  try {
    const userId = req.user.id;

    // 最近发帖
    const [posts] = await pool.query(
      `SELECT id, title, created_at, 'post' AS type
       FROM discussion_posts
       WHERE created_by = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    // 最近评论
    const [comments] = await pool.query(
      `SELECT c.id, p.title, c.created_at, 'comment' AS type
       FROM discussion_comments c
       JOIN discussion_posts p ON c.post_id = p.id
       WHERE c.created_by = ?
       ORDER BY c.created_at DESC
       LIMIT 5`,
      [userId]
    );

    // 合并并按时间排序
    const activities = [...posts, ...comments]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 7)
      .map(item => ({
        id: item.id,
        title: item.type === 'post' ? `发布讨论《${item.title}》` : `在《${item.title}》留下评论`,
        time: formatRelativeTime(item.created_at),
        rawTime: item.created_at
      }));

    res.json({ activities });
  } catch (error) {
    next(error);
  }
}

function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}
