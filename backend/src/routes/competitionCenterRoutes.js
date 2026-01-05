import { Router } from "express";
import authenticate from "../middleware/authMiddleware.js";
import {
  getCompetitions,
  getCompetitionById,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getCompetitionStats
} from "../controllers/competitionCenterController.js";

const router = Router();

// 获取竞赛列表（所有用户）
router.get("/", authenticate, getCompetitions);

// 获取竞赛统计数据（所有用户）
router.get("/stats", authenticate, getCompetitionStats);

// 获取竞赛详情（所有用户）
router.get("/:id", authenticate, getCompetitionById);

// 创建竞赛（仅导师）
router.post("/", authenticate, createCompetition);

// 更新竞赛（仅导师）
router.put("/:id", authenticate, updateCompetition);

// 删除竞赛（仅导师）
router.delete("/:id", authenticate, deleteCompetition);

export default router;
