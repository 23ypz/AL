import pool from "../db.js";

function mapPost(row) {
  return {
    id: row.id,
    title: row.title,
    college: row.college,
    category: row.category,
    stage: row.stage,
    highlight: row.highlight,
    resources: row.resources,
    deadline: row.deadline,
    createdBy: row.created_by ?? row.createdBy ?? null,
    mentorName: row.mentorName,
    createdAt: row.created_at
  };
}

export async function listPostgraduatePosts(_req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT pp.*, u.full_name AS mentorName
         FROM postgraduate_posts pp
         LEFT JOIN users u ON pp.created_by = u.id
         ORDER BY pp.created_at DESC`
    );
    res.json(rows.map(mapPost));
  } catch (error) {
    next(error);
  }
}

export async function listMyPostgraduatePosts(req, res, next) {
  try {
    if (!["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅导师或管理员可查看自己的保研发布" });
    }

    let sql = `SELECT pp.*, u.full_name AS mentorName
                 FROM postgraduate_posts pp
                 LEFT JOIN users u ON pp.created_by = u.id`;
    const params = [];

    if (req.user.role === "mentor") {
      sql += " WHERE pp.created_by = ?";
      params.push(req.user.id);
    }

    sql += " ORDER BY pp.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapPost));
  } catch (error) {
    next(error);
  }
}

const allowedStages = ["资料收集", "网申/报名", "笔试/测评", "面试汇报", "录取公示"];

export async function createPostgraduatePost(req, res, next) {
  try {
    const { title, college, category = "经验分享", stage = "资料收集", highlight, resources, deadline } = req.body;

    if (!title || !college) {
      return res.status(400).json({ message: "标题与学院为必填项" });
    }

    if (!allowedStages.includes(stage)) {
      return res.status(400).json({ message: "无效的阶段" });
    }

    if (!["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅导师或管理员可发布保研信息" });
    }

    if (req.user.role === "mentor") {
      if (!req.user.college) {
        return res.status(400).json({ message: "导师账号尚未设置所属学院，无法发布" });
      }
      if (college !== req.user.college) {
        return res.status(403).json({ message: "导师只能发布所属学院的保研信息" });
      }
    }

    const finalCollege = req.user.role === "mentor" ? req.user.college : college;

    const [result] = await pool.query(
      `INSERT INTO postgraduate_posts
        (title, college, category, stage, highlight, resources, deadline, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, finalCollege, category, stage, highlight || null, resources || null, deadline || null, req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT pp.*, u.full_name AS mentorName
         FROM postgraduate_posts pp
         LEFT JOIN users u ON pp.created_by = u.id
        WHERE pp.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: "保研信息发布成功", post: mapPost(rows[0]) });
  } catch (error) {
    next(error);
  }
}

export async function updatePostgraduatePost(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: "无效的保研 ID" });
    }

    const [rows] = await pool.query("SELECT * FROM postgraduate_posts WHERE id = ?", [postId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "保研信息不存在" });
    }
    const post = rows[0];

    if (req.user.role === "mentor" && post.created_by !== req.user.id) {
      return res.status(403).json({ message: "无权修改该保研信息" });
    }

    const columnMap = {
      title: "title",
      college: "college",
      category: "category",
      stage: "stage",
      highlight: "highlight",
      resources: "resources",
      deadline: "deadline"
    };

    const sets = [];
    const values = [];

    for (const [field, column] of Object.entries(columnMap)) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

      if (field === "college" && req.user.role === "mentor" && req.body[field] !== req.user.college) {
        return res.status(403).json({ message: "导师只能使用所属学院" });
      }
      if (field === "stage" && !allowedStages.includes(req.body[field])) {
        return res.status(400).json({ message: "无效的阶段" });
      }

      sets.push(`${column} = ?`);
      values.push(req.body[field]);
    }

    if (sets.length === 0) {
      return res.status(400).json({ message: "请至少提供一个修改字段" });
    }

    values.push(postId);
    await pool.query(`UPDATE postgraduate_posts SET ${sets.join(", ")} WHERE id = ?`, values);

    const [updatedRows] = await pool.query(
      `SELECT pp.*, u.full_name AS mentorName
         FROM postgraduate_posts pp
         LEFT JOIN users u ON pp.created_by = u.id
        WHERE pp.id = ?`,
      [postId]
    );

    res.json({ message: "保研信息更新成功", post: mapPost(updatedRows[0]) });
  } catch (error) {
    next(error);
  }
}

export async function deletePostgraduatePost(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: "无效的保研 ID" });
    }

    const [rows] = await pool.query("SELECT id, created_by FROM postgraduate_posts WHERE id = ?", [postId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "保研信息不存在" });
    }

    const post = rows[0];
    if (req.user.role === "mentor" && post.created_by !== req.user.id) {
      return res.status(403).json({ message: "无权删除该保研信息" });
    }

    await pool.query("DELETE FROM postgraduate_posts WHERE id = ?", [postId]);
    res.json({ message: "保研信息已删除" });
  } catch (error) {
    next(error);
  }
}
