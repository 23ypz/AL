import pool from "../db.js";

let schemaReady = false;

async function ensureDiscussionSchema() {
  if (schemaReady) return;

  const [[{ dbName }]] = await pool.query("SELECT DATABASE() AS dbName");

  const [parentColumn] = await pool.query("SHOW COLUMNS FROM discussion_comments LIKE 'parent_id'");
  if (parentColumn.length === 0) {
    await pool.query("ALTER TABLE discussion_comments ADD COLUMN parent_id INT UNSIGNED NULL AFTER created_by");
  }

  const [fkRows] = await pool.query(
    `SELECT CONSTRAINT_NAME
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'discussion_comments'
        AND COLUMN_NAME = 'parent_id'
        AND REFERENCED_TABLE_NAME = 'discussion_comments'`,
    [dbName]
  );

  if (fkRows.length === 0) {
    await pool.query(
      "ALTER TABLE discussion_comments ADD CONSTRAINT fk_discussion_comments_parent FOREIGN KEY (parent_id) REFERENCES discussion_comments(id) ON DELETE CASCADE"
    );
  }

  await pool.query(
    `CREATE TABLE IF NOT EXISTS notifications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        type VARCHAR(100) NOT NULL,
        payload JSON,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_read (user_id, is_read)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  schemaReady = true;
}

function mapDiscussion(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    college: row.college,
    tags: row.tags,
    createdBy: row.created_by ?? row.createdBy ?? null,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
    avatarUrl: row.avatarUrl,
    createdAt: row.created_at
  };
}

function mapComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    createdBy: row.created_by ?? row.createdBy ?? null,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
    avatarUrl: row.avatarUrl,
    createdAt: row.created_at,
    parentId: row.parent_id ?? row.parentId ?? null,
    parentAuthorName: row.parentAuthorName || null,
    parentContent: row.parentContent || null
  };
}

async function findDiscussion(postId) {
  const [rows] = await pool.query("SELECT id, created_by FROM discussion_posts WHERE id = ?", [postId]);
  return rows[0];
}

async function findComment(commentId) {
  const [rows] = await pool.query(
    `SELECT dc.*, u.full_name AS authorName
       FROM discussion_comments dc
       LEFT JOIN users u ON dc.created_by = u.id
      WHERE dc.id = ?`,
    [commentId]
  );
  return rows[0];
}

async function createNotification(userId, type, payload) {
  if (!userId) return;
  await pool.query(
    `INSERT INTO notifications (user_id, type, payload)
     VALUES (?, ?, JSON_OBJECT("postId", ?, "postTitle", ?, "commentContent", ?, "fromUser", ?, "fromUserId", ?))`,
    [userId, type, payload.postId, payload.postTitle, payload.commentContent, payload.fromUser, payload.fromUserId]
  );
}

export async function listDiscussionPosts(_req, res, next) {
  try {
    await ensureDiscussionSchema();
    const [rows] = await pool.query(
      `SELECT dp.*, u.full_name AS authorName, u.email AS authorEmail, u.avatar_url AS avatarUrl
         FROM discussion_posts dp
         LEFT JOIN users u ON dp.created_by = u.id
         ORDER BY dp.created_at DESC`
    );
    res.json(rows.map(mapDiscussion));
  } catch (error) {
    next(error);
  }
}

export async function createDiscussionPost(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "需要登录才能发布讨论" });
    }

    const { title, content, college, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "标题与内容为必填项" });
    }

    const [result] = await pool.query(
      `INSERT INTO discussion_posts (title, content, college, tags, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [title, content, college || null, tags || null, req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT dp.*, u.full_name AS authorName
         FROM discussion_posts dp
         LEFT JOIN users u ON dp.created_by = u.id
        WHERE dp.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: "讨论发布成功", post: mapDiscussion(rows[0]) });
  } catch (error) {
    next(error);
  }
}

export async function deleteDiscussionPost(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "需要登录才能删除讨论" });
    }

    const postId = Number(req.params.id);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: "无效的讨论 ID" });
    }

    const post = await findDiscussion(postId);
    if (!post) {
      return res.status(404).json({ message: "讨论不存在" });
    }

    if (post.created_by !== req.user.id && !["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅作者或管理员可删除讨论" });
    }

    await pool.query("DELETE FROM discussion_posts WHERE id = ?", [postId]);
    res.json({ message: "讨论已删除" });
  } catch (error) {
    next(error);
  }
}

export async function listDiscussionComments(req, res, next) {
  try {
    await ensureDiscussionSchema();
    const postId = Number(req.params.id);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: "无效的讨论 ID" });
    }

    const post = await findDiscussion(postId);
    if (!post) {
      return res.status(404).json({ message: "讨论不存在" });
    }

    const [rows] = await pool.query(
      `SELECT dc.*,
              u.full_name AS authorName,
              u.email AS authorEmail,
              u.avatar_url AS avatarUrl,
              parent.content AS parentContent,
              pu.full_name AS parentAuthorName,
              parent.created_by AS parentAuthorId
         FROM discussion_comments dc
         LEFT JOIN users u ON dc.created_by = u.id
         LEFT JOIN discussion_comments parent ON dc.parent_id = parent.id
         LEFT JOIN users pu ON parent.created_by = pu.id
        WHERE dc.post_id = ?
        ORDER BY dc.created_at ASC`,
      [postId]
    );

    res.json(rows.map(mapComment));
  } catch (error) {
    next(error);
  }
}

export async function createDiscussionComment(req, res, next) {
  try {
    await ensureDiscussionSchema();
    if (!req.user) {
      return res.status(401).json({ message: "需要登录才能评论" });
    }

    const postId = Number(req.params.id);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: "无效的讨论 ID" });
    }

    const { content, parentId } = req.body;
    if (!content) {
      return res.status(400).json({ message: "评论内容不能为空" });
    }

    const post = await findDiscussion(postId);
    if (!post) {
      return res.status(404).json({ message: "讨论不存在" });
    }

    let parentComment = null;
    if (parentId) {
      parentComment = await findComment(parentId);
      if (!parentComment || parentComment.post_id !== postId) {
        return res.status(400).json({ message: "无效的回复目标" });
      }
    }

    await pool.query(
      `INSERT INTO discussion_comments (post_id, content, created_by, parent_id)
       VALUES (?, ?, ?, ?)`,
      [postId, content, req.user.id, parentId || null]
    );

    const [rows] = await pool.query(
      `SELECT dc.*,
              u.full_name AS authorName,
              parent.content AS parentContent,
              pu.full_name AS parentAuthorName,
              parent.created_by AS parentAuthorId
         FROM discussion_comments dc
         LEFT JOIN users u ON dc.created_by = u.id
         LEFT JOIN discussion_comments parent ON dc.parent_id = parent.id
         LEFT JOIN users pu ON parent.created_by = pu.id
        WHERE dc.post_id = ?
        ORDER BY dc.created_at ASC`,
      [postId]
    );

    if (parentComment && parentComment.created_by && parentComment.created_by !== req.user.id) {
      await createNotification(parentComment.created_by, "discussion_reply", {
        postId,
        postTitle: post.title,
        commentContent: content,
        fromUser: req.user.fullName || "匿名同学",
        fromUserId: req.user.id
      });
    }

    res.status(201).json({ message: "评论发布成功", comments: rows.map(mapComment) });
  } catch (error) {
    next(error);
  }
}

export async function deleteDiscussionComment(req, res, next) {
  try {
    await ensureDiscussionSchema();
    if (!req.user) {
      return res.status(401).json({ message: "需要登录才能删除评论" });
    }

    const commentId = Number(req.params.commentId);
    if (Number.isNaN(commentId)) {
      return res.status(400).json({ message: "无效的评论 ID" });
    }

    const [rows] = await pool.query("SELECT id, post_id, created_by FROM discussion_comments WHERE id = ?", [commentId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "评论不存在" });
    }

    const comment = rows[0];
    if (comment.created_by !== req.user.id && !["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅作者或管理员可删除评论" });
    }

    await pool.query("DELETE FROM discussion_comments WHERE id = ?", [commentId]);
    res.json({ message: "评论已删除", postId: comment.post_id });
  } catch (error) {
    next(error);
  }
}
