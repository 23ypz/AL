import { Router } from "express";
import authenticate from "../middleware/authMiddleware.js";
import {
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  handleFriendRequest,
  getFriends,
  removeFriend,
  listFriends
} from "../controllers/friendController.js";

const router = Router();

// 发送好友申请
router.post("/requests", authenticate, sendFriendRequest);

// 获取收到的好友申请
router.get("/requests/received", authenticate, getReceivedRequests);

// 获取发送的好友申请
router.get("/requests/sent", authenticate, getSentRequests);

// 处理好友申请（接受/拒绝）
router.post("/requests/:requestId/handle", authenticate, handleFriendRequest);

// 获取好友列表
router.get("/", authenticate, getFriends);

// 删除好友
router.delete("/:friendId", authenticate, removeFriend);

// 兼容原有接口
router.get("/list", authenticate, listFriends);

export default router;
