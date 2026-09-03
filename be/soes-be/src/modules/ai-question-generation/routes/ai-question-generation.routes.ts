import { Router } from "express";
import { asyncHandler } from "../../../middlewares/asyncHandler";
import { authenticate } from "../../auth/middlewares/authenticate";
import { requireTeacher } from "../../auth/middlewares/authorize";
import * as controller from "../controllers/ai-question-generation.controller";

const router = Router();
router.use(authenticate, requireTeacher());
router.get(
  "/ai-question-generation/materials",
  asyncHandler(controller.listMaterials),
);
router.get(
  "/ai-question-generations",
  asyncHandler(controller.listHistories),
);
router.post("/ai-question-generations", asyncHandler(controller.generate));
router.post(
  "/ai-question-generations/questions",
  asyncHandler(controller.saveApproved),
);

export default router;
