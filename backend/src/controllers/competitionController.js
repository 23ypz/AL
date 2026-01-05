import pool from "../db.js";

function mapCompetition(row) {
  return {
    id: row.id,
    title: row.title,
    college: row.college,
    level: row.level,
    deadline: row.deadline,
    status: row.status,
    description: row.description,
    focus: row.focus,
    records: row.records,
    creatorName: row.creatorName,
    creatorEmail: row.creatorEmail,
    avatarUrl: row.avatarUrl,
    createdBy: row.created_by ?? row.createdBy ?? null
  };
}

function mapApplication(row) {
  if (!row) return null;
  return {
    id: row.id,
    competitionId: row.competition_id,
    applicantName: row.applicant_name,
    studentNumber: row.student_number,
    major: row.major,
    contact: row.contact,
    note: row.note,
    createdAt: row.created_at
  };
}

async function findCompetition(competitionId) {
  const [rows] = await pool.query("SELECT id, created_by FROM competitions WHERE id = ?", [competitionId]);
  return rows[0];
}

async function findApplication(competitionId, userId) {
  const [rows] = await pool.query(
    `SELECT id, competition_id, applicant_name, student_number, major, contact, note, created_at
       FROM competition_applications
      WHERE competition_id = ? AND user_id = ?
      LIMIT 1`,
    [competitionId, userId]
  );
  return rows[0];
}

export async function listCompetitions(_req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT c.id,
              c.name AS title,
              c.organizer AS college,
              c.level,
              c.registration_time AS deadline,
              c.growth_trend AS status,
              c.description,
              c.knowledge_areas AS focus,
              c.historical_topics AS records,
              u.full_name AS creatorName,
              u.email AS creatorEmail,
              u.avatar_url AS avatarUrl,
              c.created_by
         FROM competitions c
         LEFT JOIN users u ON c.created_by = u.id
         ORDER BY c.created_at DESC`
    );
    res.json(rows.map(mapCompetition));
  } catch (error) {
    next(error);
  }
}

export async function listMyCompetitions(req, res, next) {
  try {
    if (!["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅导师或管理员可查看自己的竞赛" });
    }

    let sql = `SELECT c.id,
                      c.name AS title,
                      c.organizer AS college,
                      c.level,
                      c.registration_time AS deadline,
                      c.growth_trend AS status,
                      c.description,
                      c.knowledge_areas AS focus,
                      c.historical_topics AS records,
                      u.full_name AS creatorName,
                      c.created_by
                 FROM competitions c
                 LEFT JOIN users u ON c.created_by = u.id`;
    const params = [];

    if (req.user.role === "mentor") {
      sql += " WHERE c.created_by = ?";
      params.push(req.user.id);
    }

    sql += " ORDER BY c.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapCompetition));
  } catch (error) {
    next(error);
  }
}

export async function createCompetition(req, res, next) {
  try {
    const {
      title,
      college,
      level,
      deadline,
      status = "normal",
      description,
      focus,
      records,
      category
    } = req.body;

    if (!title || !college || !level || !deadline) {
      return res.status(400).json({ message: "标题、学院、级别、截止日期为必填项" });
    }

    if (!['A', 'B', 'C', 'D'].includes(level)) {
      return res.status(400).json({ message: "竞赛级别必须为 A/B/C/D" });
    }

    if (!["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅导师或管理员可发布竞赛" });
    }

    if (req.user.role === "mentor") {
      if (!req.user.college) {
        return res.status(400).json({ message: "导师账号尚未设置所属学院，无法发布竞赛" });
      }
      if (college !== req.user.college) {
        return res.status(403).json({ message: "导师只能发布所属学院的竞赛信息" });
      }
    }

    const finalCollege = req.user.role === "mentor" ? req.user.college : college;
    const finalCategory = category || "未分类";

    const [result] = await pool.query(
      `INSERT INTO competitions (
         name,
         organizer,
         category,
         level,
         registration_time,
         growth_trend,
         description,
         knowledge_areas,
         historical_topics,
         created_by,
         updated_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, finalCollege, finalCategory, level, deadline, status, description, focus, records, req.user.id, req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT c.id,
              c.name AS title,
              c.organizer AS college,
              c.category,
              c.level,
              c.registration_time AS deadline,
              c.growth_trend AS status,
              c.description,
              c.knowledge_areas AS focus,
              c.historical_topics AS records,
              u.full_name AS creatorName,
              c.created_by
         FROM competitions c
         LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "竞赛信息发布成功",
      competition: mapCompetition(rows[0])
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCompetition(req, res, next) {
  try {
    const competitionId = Number(req.params.id);
    if (Number.isNaN(competitionId)) {
      return res.status(400).json({ message: "无效的竞赛 ID" });
    }

    const [rows] = await pool.query(
      `SELECT id, organizer AS college, created_by FROM competitions WHERE id = ?`,
      [competitionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "竞赛不存在" });
    }

    const competition = rows[0];

    if (req.user.role === "mentor" && competition.created_by !== req.user.id) {
      return res.status(403).json({ message: "无权编辑该竞赛" });
    }

    const allowedFields = ["title", "college", "category", "level", "deadline", "status", "description", "focus", "records"];
    const sets = [];
    const values = [];

    const fieldMap = {
      title: "name",
      college: "organizer",
      category: "category",
      level: "level",
      deadline: "registration_time",
      status: "growth_trend",
      description: "description",
      focus: "knowledge_areas",
      records: "historical_topics"
    };

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === "level" && !['A', 'B', 'C', 'D'].includes(req.body[field])) {
          return res.status(400).json({ message: "竞赛级别必须为 A/B/C/D" });
        }
        if (field === "college" && req.user.role === "mentor" && req.body[field] !== req.user.college) {
          return res.status(403).json({ message: "导师只能将竞赛分配在所属学院" });
        }
        sets.push(`${fieldMap[field]} = ?`);
        values.push(req.body[field]);
      }
    }

    sets.push("updated_by = ?");
    values.push(req.user.id);

    if (sets.length === 0) {
      return res.status(400).json({ message: "请至少提供一个要更新的字段" });
    }

    values.push(competitionId);

    await pool.query(`UPDATE competitions SET ${sets.join(", ")} WHERE id = ?`, values);

    const [updatedRows] = await pool.query(
      `SELECT c.id,
              c.name AS title,
              c.organizer AS college,
              c.level,
              c.registration_time AS deadline,
              c.growth_trend AS status,
              c.description,
              c.knowledge_areas AS focus,
              c.historical_topics AS records,
              u.full_name AS creatorName,
              c.created_by
         FROM competitions c
         LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = ?`,
      [competitionId]
    );

    res.json({
      message: "竞赛信息更新成功",
      competition: mapCompetition(updatedRows[0])
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCompetition(req, res, next) {
  try {
    const competitionId = Number(req.params.id);
    if (Number.isNaN(competitionId)) {
      return res.status(400).json({ message: "无效的竞赛 ID" });
    }

    const [rows] = await pool.query(`SELECT id, created_by FROM competitions WHERE id = ?`, [competitionId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "竞赛不存在" });
    }

    const competition = rows[0];

    if (req.user.role === "mentor" && competition.created_by !== req.user.id) {
      return res.status(403).json({ message: "无权删除该竞赛" });
    }

    await pool.query("DELETE FROM competitions WHERE id = ?", [competitionId]);

    res.json({ message: "竞赛已删除" });
  } catch (error) {
    next(error);
  }
}

export async function applyForCompetition(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "仅学生可以提交报名" });
    }

    const competitionId = Number(req.params.id);
    if (Number.isNaN(competitionId)) {
      return res.status(400).json({ message: "无效的竞赛 ID" });
    }

    const { applicantName, studentNumber, major, contact, note } = req.body;

    if (!applicantName || !studentNumber || !major || !contact) {
      return res.status(400).json({ message: "姓名、学号、专业与联系方式为必填项" });
    }

    const competition = await findCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "竞赛不存在" });
    }

    const existing = await findApplication(competitionId, req.user.id);
    if (existing) {
      return res.status(409).json({ message: "已提交报名，可直接修改信息" });
    }

    await pool.query(
      `INSERT INTO competition_applications
        (competition_id, user_id, applicant_name, student_number, major, contact, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [competitionId, req.user.id, applicantName, studentNumber, major, contact, note || null]
    );

    const created = await findApplication(competitionId, req.user.id);

    res.status(201).json({ message: "报名提交成功", application: mapApplication(created) });
  } catch (error) {
    next(error);
  }
}

export async function getMyCompetitionApplication(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "仅学生可以查看报名信息" });
    }

    const competitionId = Number(req.params.id);
    if (Number.isNaN(competitionId)) {
      return res.status(400).json({ message: "无效的竞赛 ID" });
    }

    const competition = await findCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "竞赛不存在" });
    }

    const application = await findApplication(competitionId, req.user.id);
    res.json({ application: mapApplication(application) });
  } catch (error) {
    next(error);
  }
}

export async function updateMyCompetitionApplication(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "仅学生可以修改报名信息" });
    }

    const competitionId = Number(req.params.id);
    if (Number.isNaN(competitionId)) {
      return res.status(400).json({ message: "无效的竞赛 ID" });
    }

    const { applicantName, studentNumber, major, contact, note } = req.body;

    if (!applicantName || !studentNumber || !major || !contact) {
      return res.status(400).json({ message: "姓名、学号、专业与联系方式为必填项" });
    }

    const competition = await findCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "竞赛不存在" });
    }

    const existing = await findApplication(competitionId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "尚未提交报名，无法更新" });
    }

    await pool.query(
      `UPDATE competition_applications
          SET applicant_name = ?, student_number = ?, major = ?, contact = ?, note = ?
        WHERE competition_id = ? AND user_id = ?`,
      [applicantName, studentNumber, major, contact, note || null, competitionId, req.user.id]
    );

    const updated = await findApplication(competitionId, req.user.id);
    res.json({ message: "报名信息已更新", application: mapApplication(updated) });
  } catch (error) {
    next(error);
  }
}

export async function deleteMyCompetitionApplication(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "仅学生可以撤回报名" });
    }

    const competitionId = Number(req.params.id);
    if (Number.isNaN(competitionId)) {
      return res.status(400).json({ message: "无效的竞赛 ID" });
    }

    const competition = await findCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "竞赛不存在" });
    }

    const existing = await findApplication(competitionId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "尚未提交报名" });
    }

    await pool.query(`DELETE FROM competition_applications WHERE competition_id = ? AND user_id = ?`, [
      competitionId,
      req.user.id
    ]);

    res.json({ message: "报名已撤回" });
  } catch (error) {
    next(error);
  }
}

export async function listCompetitionApplicants(req, res, next) {
  try {
    if (!["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅导师或管理员可查看报名信息" });
    }

    const competitionId = Number(req.params.id);
    if (Number.isNaN(competitionId)) {
      return res.status(400).json({ message: "无效的竞赛 ID" });
    }

    const [competitions] = await pool.query("SELECT id, created_by FROM competitions WHERE id = ?", [competitionId]);
    if (competitions.length === 0) {
      return res.status(404).json({ message: "竞赛不存在" });
    }

    const competition = competitions[0];
    if (req.user.role === "mentor" && competition.created_by !== req.user.id) {
      return res.status(403).json({ message: "无权查看该竞赛的报名信息" });
    }

    const [rows] = await pool.query(
      `SELECT id, competition_id, applicant_name, student_number, major, contact, note, created_at
         FROM competition_applications
        WHERE competition_id = ?
        ORDER BY created_at DESC`,
      [competitionId]
    );

    res.json(rows.map(mapApplication));
  } catch (error) {
    next(error);
  }
}
