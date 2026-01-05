import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, college: user.college || null },
    process.env.JWT_SECRET || "academic_light_dev_secret",
    { expiresIn: "7d" }
  );
}

export async function register(req, res, next) {
  try {
    const {
      fullName,
      email,
      password,
      role = "student",
      college,
      major,
      avatarUrl,
      bio,
      expertiseTags
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    if (role === "mentor" && !college) {
      return res.status(400).json({ message: "导师账号必须选择所属学院" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "该邮箱已注册" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role, college, major, avatar_url, bio, expertise_tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        fullName,
        email,
        passwordHash,
        role,
        college || null,
        major || null,
        avatarUrl || null,
        bio || null,
        expertiseTags || null
      ]
    );

    const token = generateToken({ id: result.insertId, email, role, college });

    res.status(201).json({
      message: "注册成功",
      token,
      user: {
        id: result.insertId,
        fullName,
        email,
        role,
        college: college || null,
        major: major || null,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        expertiseTags: expertiseTags || null
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const {
      fullName,
      email,
      password,
      role,
      college,
      major,
      avatarUrl,
      bio,
      expertiseTags
    } = req.body;

    const fields = [];
    const values = [];

    if (fullName) {
      fields.push("full_name = ?");
      values.push(fullName);
    }

    if (email) {
      const [existing] = await pool.query(
        "SELECT id FROM users WHERE email = ? AND id <> ?",
        [email, req.user.id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: "该邮箱已被其他账号使用" });
      }
      fields.push("email = ?");
      values.push(email);
    }

    if (role) {
      fields.push("role = ?");
      values.push(role);
    }

    if (college !== undefined) {
      fields.push("college = ?");
      values.push(college || null);
    }

    if (major !== undefined) {
      fields.push("major = ?");
      values.push(major || null);
    }

    if (avatarUrl !== undefined) {
      fields.push("avatar_url = ?");
      values.push(avatarUrl || null);
    }

    if (bio !== undefined) {
      fields.push("bio = ?");
      values.push(bio || null);
    }

    if (expertiseTags !== undefined) {
      fields.push("expertise_tags = ?");
      values.push(expertiseTags || null);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      fields.push("password_hash = ?");
      values.push(passwordHash);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "请至少提供一个要修改的字段" });
    }

    values.push(req.user.id);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    await pool.query(sql, values);

    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, college, major, avatar_url, bio, expertise_tags, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({
      message: "资料更新成功",
      user: {
        id: rows[0].id,
        fullName: rows[0].full_name,
        email: rows[0].email,
        role: rows[0].role,
        college: rows[0].college,
        major: rows[0].major,
        avatarUrl: rows[0].avatar_url,
        bio: rows[0].bio,
        expertiseTags: rows[0].expertise_tags,
        joinedAt: rows[0].created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    const [rows] = await pool.query(
      "SELECT id, full_name, email, password_hash, role, college, major, avatar_url, bio, expertise_tags FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "邮箱或密码错误" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "邮箱或密码错误" });
    }

    const token = generateToken(user);

    res.json({
      message: "登录成功",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        college: user.college,
        major: user.major,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        expertiseTags: user.expertise_tags
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, college, major, avatar_url, bio, expertise_tags, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      college: user.college,
      major: user.major,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      expertiseTags: user.expertise_tags,
      joinedAt: user.created_at
    });
  } catch (error) {
    next(error);
  }
}
