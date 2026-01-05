import { Router } from "express";
import authenticate from "../middleware/authMiddleware.js";
import {
  sendPrivateMessage,
  getChatMessages,
  getChatConversations,
  markMessagesAsRead
} from "../controllers/privateMessageController.js";

const router = Router();

// 发送私聊消息
router.post("/messages", authenticate, sendPrivateMessage);

// 获取与某个好友的聊天记录
router.get("/messages/:friendId", authenticate, getChatMessages);

// 获取所有私聊会话列表
router.get("/conversations", authenticate, getChatConversations);

// 标记消息为已读
router.post("/messages/:friendId/read", authenticate, markMessagesAsRead);

export default router;
