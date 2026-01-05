import { Router } from "express";
import { register, login, getProfile, updateProfile } from "../controllers/authController.js";
import authenticate from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getProfile);
router.put("/me", authenticate, updateProfile);

export default router;
