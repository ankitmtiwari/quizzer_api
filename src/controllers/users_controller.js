import { userModel } from "../models/user_model.js";
import { ApiResponse } from "../utils/api_response.js";
import { ApiError } from "../utils/api_error.js";
import { asyncHandler } from "../utils/async_handler.js";

//generate and save authToken and refresh Token
const generateAuthTokens = async (userId) => {
  try {
    const user = await userModel.findById(userId);
    //short term
    const accessToken = await user.createAccessToken();
    //long term
    const refreshToken = await user.createRefreshToken();

    //short term
    user.accessToken = accessToken;
    //long term
    user.refreshToken = refreshToken;

    user.isAcDeleted = false;
    user.isAcDeactivated = false;
    //save the updated data
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("ERROR: Failed to create and store auth Token", error);
    // throw new ApiError(
    //   500,
    //   "Something went wrong while generating referesh and access token"
    // );
  }
};

//create new user
const registerUserController = async (req, res) => {
  //get all the fields
  const {
    firstName,
    lastName,
    userName,
    email,
    password,
    phoneNumber,
    schoolName,
    role,
  } = req.body;

  //check if required fields are empty
  if (
    [
      firstName,
      lastName,
      userName,
      email,
      password,
      phoneNumber,
      schoolName,
      role,
    ].some((field) => field?.trim() === undefined || field?.trim() === "")
  ) {
    return res.status(400).send({
      success: false,
      message:
        "All Fields are required firstName,lastName,userName,email,password,phoneNumber, schoolName,role",
    });
  }

  // check if user already exists with email or username
  const existingUser = await userModel.findOne({
    $or: [{ userName }, { email }],
  });

  //error if user already exists
  if (existingUser) {
    console.log(existingUser);
    return res.status(400).send({
      success: false,
      message: "User Already Exists with email or username",
    });
  }

  //create new user
  try {
    const user = await userModel.create({
      firstName: firstName,
      lastName: lastName,
      userName: userName.toLowerCase(),
      email: email.toLowerCase(),
      password: password,
      phoneNumber: phoneNumber,
      schoolName: schoolName,
      role: role.toLowerCase(),
    });

    //server error if user not created
    if (!user) {
      res
        .status(500)
        .send({ success: false, message: "User not created", data: {} });
    }

    //get created users details from db except password
    const createdUser = await userModel.findById(user._id).select("-password");

    //error if no user found
    if (!createdUser) {
      return res.status(500).send({
        success: false,
        message: "Something went wrong Try to login in",
      });
    }

    return res.status(201).send({
      success: true,
      message: "User Created Successfully",
      data: createdUser,
    });
  } catch (error) {
    return res.status(400).send({
      success: false,
      message: error.message,
      data: {},
    });
  }
};

//validate and login the user
const loginUserController = async (req, res) => {
  const { userName, email, password } = req.body;
  // const userName = "ankittiwari";
  // const email = "";
  // const password = "1234";

  //check if atleast email or username is given
  if (!userName && !email) {
    return res.status(400).send({
      success: false,
      message: "Username Or Email is required",
      data: {},
    });
  }

  //check if user exists with given username or email
  const existingUser = await userModel.findOne({
    $or: [{ userName }, { email }],
  });

  //error if no user found
  if (!existingUser) {
    return res.status(400).send({
      success: false,
      message: "User Does Not Exist with email or username",
      data: {},
    });
  }

  //if password matches or not
  const isPasswordValid = await existingUser.isPasswordCorrect(password);

  //error if password is invalid
  if (!isPasswordValid) {
    return res
      .status(401)
      .send({ success: false, message: "Invalid Credentials", data: {} });
  }

  //generate  auth Token to keep the user logged in
  const { accessToken, refreshToken } = await generateAuthTokens(
    existingUser._id
  );

  //server error if unable to generate auth token
  if (!accessToken || !refreshToken) {
    return res.status(500).send({
      success: false,
      message: "Unable to generate auth token",
      data: {},
    });
  }

  // console.log("ACCESS TOKEN:", accessToken);
  //get the user details from db except passowrd
  const loggedInUser = await userModel
    .findById(existingUser._id)
    .select("-password -accessToken -refreshToken");

  //cofigure options for storing token in browser cookier of the user
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .send({
      success: true,
      message: "Login Successfull",
      data: { user: loggedInUser, accessToken, refreshToken },
    });
};

//logout the user and clear authToken
const logoutUserController = async (req, res) => {
  try {
    if (!req.user._id) {
      return res.status(401).send({
        success: false,
        message: "Invalid request or UnAuthorized request",
        data: {},
      });
    }

    await userModel
      .findByIdAndUpdate(
        req.user._id,
        {
          $unset: {
            accessToken: 1, // this removes the field from document
            refreshToken: 1, // this removes the field from document
          },
        },
        {
          new: true,
        }
      )
      .catch((er) => {
        return res
          .status(500)
          .send({ success: false, message: "Failed to clear token", data: er });
      });

    //cofigure options for storing token in browser cookier of the user
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .send({ success: true, message: "Logout Successfully", data: {} });
  } catch (error) {
    return res
      .status(400)
      .send({ success: false, message: error.message, data: error });
  }
};

//delete the user from database
const deleteUserController = async (req, res) => {
  if (!req.user._id) {
    return res.status(401).send({
      success: false,
      message: "Invalid request or UnAuthorized request",
      data: {},
    });
  }

  const acDeleteSummary = await userModel.updateOne(
    { _id: req.user._id },
    {
      $set: { isAcDeleted: true },
      $unset: {
        accessToken: 1, // this removes the field from document
        refreshToken: 1, // this removes the field from document
      },
    }
  );

  //cofigure options for storing token in browser cookier of the user
  const options = {
    httpOnly: true,
    secure: true,
  };

  if (acDeleteSummary.modifiedCount != 1) {
    return res
      .status(500)
      .send({ success: false, message: "Failed to delete account", data: {} });
  }

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .send({
      success: true,
      message: "User Deleted And logged out Successfully",
      data: {},
    });
};

//change password
const updatePasswordController = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!req.user._id) {
    return res.status(401).send({
      success: false,
      message: "Invalid request or UnAuthorized request",
      data: {},
    });
  }

  if (
    [oldPassword, newPassword].some(
      (field) => field === "" || field === undefined || field === null
    )
  ) {
    return res.status(400).send({
      success: false,
      message: "Old and New Password is required",
      data: {},
    });
  }

  //get the existing user
  const existingUser = await userModel.findById(req.user._id);

  //check if given password matches to the stored password
  const isPasswordCorrect = await existingUser.isPasswordCorrect(oldPassword);

  //check if password matched or not
  if (!isPasswordCorrect) {
    return res.status(401).send({
      success: false,
      message: "old password does not match",
      data: { oldPassword, newPassword },
    });
  }

  //update the new password in the db
  existingUser.password = newPassword;
  await existingUser.save({ validateBeforeSave: false });

  //success response and give the newPassword
  return res.status(201).send({
    success: true,
    message: "Password Changed successfully",
    data: { newPassword: newPassword },
  });
};

//get the current User
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user fetched successfully"));
  // return res
  //   .status(200)
  //   .send({ success: true, message: "user fetched successfully", data: user });
});

export {
  registerUserController,
  loginUserController,
  logoutUserController,
  deleteUserController,
  updatePasswordController,
  getCurrentUser,
};
