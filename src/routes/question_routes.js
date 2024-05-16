import { Router } from "express";
import {
  createQuestionController,
  deleteQuestionController,
  getAllQuestionController,
  updateQuestionController,
  getRandomQuestionController,
} from "../controllers/question_controller.js";
import { checkAuthMiddleware } from "../middlewares/auth_middleware.js";

const questionRouter = Router();

//create question
questionRouter
  .route("/create")
  .post(checkAuthMiddleware, createQuestionController);

//update question
questionRouter
  .route("/update")
  .patch(checkAuthMiddleware, updateQuestionController);

//delete question
questionRouter
  .route("/delete")
  .delete(checkAuthMiddleware, deleteQuestionController);

//get all questions
questionRouter
  .route("/getall")
  .post(checkAuthMiddleware, getAllQuestionController);

//get any one random question based on the given parameters
questionRouter.route("/getRandomQuestion").get(getRandomQuestionController);

export { questionRouter };
