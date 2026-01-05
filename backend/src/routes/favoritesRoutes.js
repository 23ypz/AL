import { Router } from "express";
import authenticate from "../middleware/authMiddleware.js";
import {
  favoriteCompetition,
  getUserFavorites,
  checkFavoriteStatus
} from "../controllers/favoritesController.js";

const router = Router();

// 收藏/取消收藏竞赛
router.post("/", authenticate, favoriteCompetition);

// 获取用户收藏的竞赛
router.get("/", authenticate, getUserFavorites);

// 检查竞赛收藏状态
router.get("/:competitionId/status", authenticate, checkFavoriteStatus);

export default router;
