import { Router } from "express";
import authenticate from "../middleware/authMiddleware.js";
import {
  getProfileStats,
  getRecentActivities
} from "../controllers/profileController.js";

const router = Router();

router.get("/stats", authenticate, getProfileStats);
router.get("/activities", authenticate, getRecentActivities);

export default router;
