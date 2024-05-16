import { Router } from "express";
import { checkAuthMiddleware } from "../middlewares/auth_middleware.js";
import {
  createContestController,
  deleteContestController,
  getAllContestsController,
  getContestController,
  updateContestController,
} from "../controllers/contest_controller.js";

const contestRouter = Router();

contestRouter
  .route("/create")
  .post(checkAuthMiddleware, createContestController);
contestRouter.route("/get").get(checkAuthMiddleware, getContestController);
contestRouter
  .route("/getAllContests")
  .get(checkAuthMiddleware, getAllContestsController);
contestRouter
  .route("/update")
  .post(checkAuthMiddleware, updateContestController);
contestRouter
  .route("/delete")
  .delete(checkAuthMiddleware, deleteContestController);

export { contestRouter };
