import { Router } from "express";
import {
  listResearchProjects,
  listMyResearchProjects,
  createResearchProject,
  updateResearchProject,
  deleteResearchProject,
  applyForResearchProject,
  getMyResearchApplication,
  updateMyResearchApplication,
  deleteMyResearchApplication,
  listResearchApplicants
} from "../controllers/researchController.js";
import authenticate from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listResearchProjects);
router.get("/mine", authenticate, listMyResearchProjects);
router.post("/", authenticate, createResearchProject);
router.put("/:id", authenticate, updateResearchProject);
router.delete("/:id", authenticate, deleteResearchProject);
router.post("/:id/apply", authenticate, applyForResearchProject);
router.get("/:id/my-application", authenticate, getMyResearchApplication);
router.put("/:id/my-application", authenticate, updateMyResearchApplication);
router.delete("/:id/my-application", authenticate, deleteMyResearchApplication);
router.get("/:id/applicants", authenticate, listResearchApplicants);

export default router;
