import { userModel } from "../models/user_model.js";
import { ApiError } from "../utils/api_error.js";

export const isVerifiedUser = async (uid) => {
  try {
    const dbUser = await userModel.findById(uid);
    if (dbUser) {
      return dbUser;
    } else {
      return false;
    }
  } catch (error) {
    throw new ApiError(404, "Failed to verify user");
  }
};
