import jwt from "jsonwebtoken";

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

  if (!token) {
    return res.status(401).json({ message: "未提供认证 token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "academic_light_dev_secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "token 无效或已过期" });
  }
}
