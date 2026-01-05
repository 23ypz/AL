import { Router } from "express";
import authenticate from "../middleware/authMiddleware.js";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/notificationController.js";

const router = Router();

router.get("/", authenticate, listNotifications);
router.post("/:id/read", authenticate, markNotificationRead);
router.post("/mark-all-read", authenticate, markAllNotificationsRead);

export default router;
