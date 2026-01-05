import { Router } from "express";
import {
  listPostgraduatePosts,
  listMyPostgraduatePosts,
  createPostgraduatePost,
  updatePostgraduatePost,
  deletePostgraduatePost
} from "../controllers/postgraduateController.js";
import authenticate from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listPostgraduatePosts);
router.get("/mine", authenticate, listMyPostgraduatePosts);
router.post("/", authenticate, createPostgraduatePost);
router.put("/:id", authenticate, updatePostgraduatePost);
router.delete("/:id", authenticate, deletePostgraduatePost);

export default router;
