import { Router } from "express";
import {
  listCompetitions,
  listMyCompetitions,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  applyForCompetition,
  getMyCompetitionApplication,
  updateMyCompetitionApplication,
  deleteMyCompetitionApplication,
  listCompetitionApplicants
} from "../controllers/competitionController.js";
import authenticate from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listCompetitions);
router.get("/mine", authenticate, listMyCompetitions);
router.post("/", authenticate, createCompetition);
router.put("/:id", authenticate, updateCompetition);
router.delete("/:id", authenticate, deleteCompetition);
router.post("/:id/apply", authenticate, applyForCompetition);
router.get("/:id/my-application", authenticate, getMyCompetitionApplication);
router.put("/:id/my-application", authenticate, updateMyCompetitionApplication);
router.delete("/:id/my-application", authenticate, deleteMyCompetitionApplication);
router.get("/:id/applicants", authenticate, listCompetitionApplicants);

export default router;
