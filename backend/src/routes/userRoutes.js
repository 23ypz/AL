import { Router } from "express";
import {
  getUserPublicProfile
} from "../controllers/userController.js";

const router = Router();

router.get("/:id", getUserPublicProfile);

export default router;
