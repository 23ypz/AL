import { Router } from "express";
import {
  listDiscussionPosts,
  createDiscussionPost,
  deleteDiscussionPost,
  listDiscussionComments,
  createDiscussionComment,
  deleteDiscussionComment
} from "../controllers/discussionController.js";
import authenticate from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listDiscussionPosts);
router.post("/", authenticate, createDiscussionPost);
router.delete("/:id", authenticate, deleteDiscussionPost);
router.get("/:id/comments", listDiscussionComments);
router.post("/:id/comments", authenticate, createDiscussionComment);
router.delete("/:id/comments/:commentId", authenticate, deleteDiscussionComment);

export default router;
