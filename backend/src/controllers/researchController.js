import pool from "../db.js";

function mapProject(row) {
  return {
    id: row.id,
    title: row.title,
    college: row.college,
    field: row.field,
    stage: row.stage,
    lab: row.lab,
    plan: row.plan,
    summary: row.summary,
    teamSize: row.team_size,
    createdBy: row.created_by ?? row.createdBy ?? null,
    mentorName: row.mentorName,
    createdAt: row.created_at
  };
}

function mapApplication(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    applicantName: row.applicant_name,
    studentNumber: row.student_number,
    major: row.major,
    contact: row.contact,
    note: row.note,
    createdAt: row.created_at
  };
}

async function findProject(projectId) {
  const [rows] = await pool.query("SELECT id, created_by FROM research_projects WHERE id = ?", [projectId]);
  return rows[0];
}

async function findApplication(projectId, userId) {
  const [rows] = await pool.query(
    `SELECT id, project_id, applicant_name, student_number, major, contact, note, created_at
       FROM research_applications
      WHERE project_id = ? AND user_id = ?
      LIMIT 1`,
    [projectId, userId]
  );
  return rows[0];
}

export async function listResearchProjects(_req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT rp.*, u.full_name AS mentorName
         FROM research_projects rp
         LEFT JOIN users u ON rp.created_by = u.id
         ORDER BY rp.created_at DESC`
    );
    res.json(rows.map(mapProject));
  } catch (error) {
    next(error);
  }
}

export async function listMyResearchProjects(req, res, next) {
  try {
    if (!["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅导师或管理员可查看自己的课题" });
    }

    let sql = `SELECT rp.*, u.full_name AS mentorName
                 FROM research_projects rp
                 LEFT JOIN users u ON rp.created_by = u.id`;
    const params = [];

    if (req.user.role === "mentor") {
      sql += " WHERE rp.created_by = ?";
      params.push(req.user.id);
    }

    sql += " ORDER BY rp.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapProject));
  } catch (error) {
    next(error);
  }
}

const allowedStages = ["课题招募", "数据采集", "论文撰写", "成果申报"];

export async function createResearchProject(req, res, next) {
  try {
    const { title, college, field, stage = "课题招募", lab, plan, summary, teamSize = 0 } = req.body;

    if (!title || !college || !field) {
      return res.status(400).json({ message: "项目名称、学院、研究方向为必填项" });
    }

    if (!allowedStages.includes(stage)) {
      return res.status(400).json({ message: "无效的项目阶段" });
    }

    if (!["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅导师或管理员可发布项目" });
    }

    if (req.user.role === "mentor") {
      if (!req.user.college) {
        return res.status(400).json({ message: "导师账号尚未设置所属学院，无法发布项目" });
      }
      if (college !== req.user.college) {
        return res.status(403).json({ message: "导师只能发布所属学院的项目" });
      }
    }

    const finalCollege = req.user.role === "mentor" ? req.user.college : college;

    const [result] = await pool.query(
      `INSERT INTO research_projects
        (title, college, field, stage, lab, plan, summary, team_size, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, finalCollege, field, stage, lab || null, plan || null, summary || null, teamSize || 0, req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT rp.*, u.full_name AS mentorName
         FROM research_projects rp
         LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: "科研项目发布成功", project: mapProject(rows[0]) });
  } catch (error) {
    next(error);
  }
}

export async function updateResearchProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "无效的项目 ID" });
    }

    const [rows] = await pool.query("SELECT * FROM research_projects WHERE id = ?", [projectId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "项目不存在" });
    }
    const project = rows[0];

    if (req.user.role === "mentor" && project.created_by !== req.user.id) {
      return res.status(403).json({ message: "无权修改该项目" });
    }

    const columnMap = {
      title: "title",
      college: "college",
      field: "field",
      stage: "stage",
      lab: "lab",
      plan: "plan",
      summary: "summary",
      teamSize: "team_size"
    };

    const sets = [];
    const values = [];

    for (const [field, column] of Object.entries(columnMap)) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

      if (field === "college" && req.user.role === "mentor" && req.body[field] !== req.user.college) {
        return res.status(403).json({ message: "导师只能使用所属学院" });
      }
      if (field === "stage" && !allowedStages.includes(req.body[field])) {
        return res.status(400).json({ message: "无效的项目阶段" });
      }

      sets.push(`${column} = ?`);
      values.push(field === "teamSize" ? Number(req.body[field]) || 0 : req.body[field]);
    }

    if (sets.length === 0) {
      return res.status(400).json({ message: "请至少提供一个修改字段" });
    }

    values.push(projectId);
    await pool.query(`UPDATE research_projects SET ${sets.join(", ")} WHERE id = ?`, values);

    const [updatedRows] = await pool.query(
      `SELECT rp.*, u.full_name AS mentorName
         FROM research_projects rp
         LEFT JOIN users u ON rp.created_by = u.id
        WHERE rp.id = ?`,
      [projectId]
    );

    res.json({ message: "项目更新成功", project: mapProject(updatedRows[0]) });
  } catch (error) {
    next(error);
  }
}

export async function deleteResearchProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "无效的项目 ID" });
    }

    const [rows] = await pool.query("SELECT id, created_by FROM research_projects WHERE id = ?", [projectId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "项目不存在" });
    }

    const project = rows[0];
    if (req.user.role === "mentor" && project.created_by !== req.user.id) {
      return res.status(403).json({ message: "无权删除该项目" });
    }

    await pool.query("DELETE FROM research_projects WHERE id = ?", [projectId]);
    res.json({ message: "项目已删除" });
  } catch (error) {
    next(error);
  }
}

export async function applyForResearchProject(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "仅学生可以提交申请" });
    }

    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "无效的项目 ID" });
    }

    const { applicantName, studentNumber, major, contact, note } = req.body;
    if (!applicantName || !studentNumber || !major || !contact) {
      return res.status(400).json({ message: "姓名、学号、专业与联系方式为必填项" });
    }

    const project = await findProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "科研项目不存在" });
    }

    const existing = await findApplication(projectId, req.user.id);
    if (existing) {
      return res.status(409).json({ message: "已提交申请，可直接修改信息" });
    }

    await pool.query(
      `INSERT INTO research_applications
        (project_id, user_id, applicant_name, student_number, major, contact, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, req.user.id, applicantName, studentNumber, major, contact, note || null]
    );

    const created = await findApplication(projectId, req.user.id);
    res.status(201).json({ message: "申请提交成功", application: mapApplication(created) });
  } catch (error) {
    next(error);
  }
}

export async function getMyResearchApplication(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "仅学生可以查看申请" });
    }

    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "无效的项目 ID" });
    }

    const project = await findProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "科研项目不存在" });
    }

    const application = await findApplication(projectId, req.user.id);
    res.json({ application: mapApplication(application) });
  } catch (error) {
    next(error);
  }
}

export async function updateMyResearchApplication(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "仅学生可以修改申请" });
    }

    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "无效的项目 ID" });
    }

    const { applicantName, studentNumber, major, contact, note } = req.body;
    if (!applicantName || !studentNumber || !major || !contact) {
      return res.status(400).json({ message: "姓名、学号、专业与联系方式为必填项" });
    }

    const project = await findProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "科研项目不存在" });
    }

    const existing = await findApplication(projectId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "尚未提交申请，无法更新" });
    }

    await pool.query(
      `UPDATE research_applications
          SET applicant_name = ?, student_number = ?, major = ?, contact = ?, note = ?
        WHERE project_id = ? AND user_id = ?`,
      [applicantName, studentNumber, major, contact, note || null, projectId, req.user.id]
    );

    const updated = await findApplication(projectId, req.user.id);
    res.json({ message: "申请信息已更新", application: mapApplication(updated) });
  } catch (error) {
    next(error);
  }
}

export async function deleteMyResearchApplication(req, res, next) {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "仅学生可以撤回申请" });
    }

    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "无效的项目 ID" });
    }

    const project = await findProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "科研项目不存在" });
    }

    const existing = await findApplication(projectId, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "尚未提交申请" });
    }

    await pool.query("DELETE FROM research_applications WHERE project_id = ? AND user_id = ?", [
      projectId,
      req.user.id
    ]);

    res.json({ message: "申请已撤回" });
  } catch (error) {
    next(error);
  }
}

export async function listResearchApplicants(req, res, next) {
  try {
    if (!["mentor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "仅导师或管理员可查看申请信息" });
    }

    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "无效的项目 ID" });
    }

    const [projects] = await pool.query("SELECT id, created_by FROM research_projects WHERE id = ?", [projectId]);
    if (projects.length === 0) {
      return res.status(404).json({ message: "科研项目不存在" });
    }

    const project = projects[0];
    if (req.user.role === "mentor" && project.created_by !== req.user.id) {
      return res.status(403).json({ message: "无权查看该项目的申请信息" });
    }

    const [rows] = await pool.query(
      `SELECT id, project_id, applicant_name, student_number, major, contact, note, created_at
         FROM research_applications
        WHERE project_id = ?
        ORDER BY created_at DESC`,
      [projectId]
    );

    res.json(rows.map(mapApplication));
  } catch (error) {
    next(error);
  }
}
