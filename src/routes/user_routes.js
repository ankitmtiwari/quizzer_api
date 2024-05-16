import { Router } from "express";
import {
  deleteUserController,
  loginUserController,
  logoutUserController,
  registerUserController,
  updatePasswordController,
  getCurrentUser,
} from "../controllers/users_controller.js";

import { checkAuthMiddleware } from "../middlewares/auth_middleware.js";

const userRouters = Router();

//default route is localhost(domain)/api/v1/users/
userRouters.route("/register").post(registerUserController);
userRouters.route("/login").post(loginUserController);
userRouters.route("/logout").post(checkAuthMiddleware, logoutUserController);
userRouters.route("/delete").delete(checkAuthMiddleware, deleteUserController);
userRouters
  .route("/updatePassword")
  .patch(checkAuthMiddleware, updatePasswordController);
userRouters.route("/getCurrentUser").get(checkAuthMiddleware, getCurrentUser);

export { userRouters };
