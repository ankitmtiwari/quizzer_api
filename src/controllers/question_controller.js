import { userModel } from "../models/user_model.js";
import { questionModel } from "../models/question_model.js";

const getExistingQuestionById = async (quid) => {
  const existingQuestion = await questionModel.findById(quid);
  return existingQuestion;
};

const createQuestionController = async (req, res) => {
  //get data sent from client
  const {
    question,
    allAnswers,
    correctAnswerIndex,
    subject,
    level,
    questionType,
    timeRequired,
  } = req.body;

  //check if all fields are provided
  if (
    [
      question,
      correctAnswerIndex,
      subject,
      level,
      questionType,
      timeRequired,
    ].some((field) => field?.trim() === undefined || field?.trim() === "")
  ) {
    return res.status(400).send({
      success: false,
      message:
        "All Fields are required question, correcrAnswerIndex, subject, level, questionType, timeRequired",
    });
  }

  //check if atleast 2 options are given
  if (allAnswers.length < 2) {
    return res.status(400).send({
      success: false,
      message: "minimum two answers are required",
      data: { allAnswers },
    });
  }

  //check if user is available through middleware
  if (!req.user._id) {
    return res
      .status(401)
      .send({ success: false, message: "Invalid request", data: {} });
  }

  //check if user exists in db
  const usr = await userModel.findById(req.user._id);

  //error if no user
  if (!usr) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid user", data: {} });
  }

  try {
    //check if same question is already added with the same difficuly level
    const existingQuestion = await questionModel
      .findOne({
        $and: [{ question }, { level }],
      })
      .populate({
        path: "addedBy",
        select: "firstName lastName userName -_id",
      });

    //retuen the existing question if question and level is same
    if (existingQuestion) {
      return res.status(400).send({
        success: false,
        message: "Question already exists",
        data: { existingQuestion },
      });
    }

    //create a new question
    const createdQuestion = await questionModel.create({
      question,
      allAnswers,
      correctAnswerIndex,
      subject,
      level,
      questionType,
      timeRequired,
      addedBy: req.user._id,
    });

    //error if created question not found
    if (!createdQuestion) {
      return res
        .status(500)
        .send({ success: false, message: "Failed to add question", data: {} });
    }

    console.log("After Creating Question");
    //remove addedBy field before sending
    const c_que = await questionModel
      .findById(createdQuestion._id)
      .select("-addedBy");

    return res.status(201).send({
      success: true,
      message: "Question added successfully",
      data: c_que,
    });
  } catch (error) {
    return res.status(400).send({
      success: false,
      message: error.message,
      data: { error },
    });
  }
};

const updateQuestionController = async (req, res) => {
  //get the data from client
  const {
    quid,
    question,
    allAnswers,
    correctAnswerIndex,
    subject,
    level,
    questionType,
    timeRequired,
  } = req.body;

  //error if quid(question id) is not given
  if (!quid) {
    return res
      .status(400)
      .send({ success: false, message: "question id is required", data: {} });
  }

  //method one to make a object that has all the update fileds
  /*
  // const fieldsToUpdate = {};
  // if (question) {
  //   fieldsToUpdate.question = question;
  // }
  // if (allAnswers) {
  //   fieldsToUpdate.allAnswers = allAnswers;
  // }
  // if (correctAnswerIndex) {
  //   fieldsToUpdate.correctAnswerIndex = correctAnswerIndex;
  // }
  // if (subject) {
  //   fieldsToUpdate.subject = subject;
  // }
  // if (level) {
  //   fieldsToUpdate.level = level;
  // }

  // if (questionType) {
  //   fieldsToUpdate.questionType = questionType;
  // }
  // if (timeRequired) {
  //   fieldsToUpdate.timeRequired = timeRequired;
  // }
*/

  //method two to make a object that has all the update fileds
  /*
  // Object.assign(fieldsToUpdate, {
  //   question,
  //   allAnswers,
  //   correctAnswerIndex,
  //   subject,
  //   level,
  //   questionType,
  //   timeRequired,
  // });
*/

  //method three to make a object that has all the update fileds
  const fieldsToUpdate = {
    question,
    allAnswers,
    correctAnswerIndex,
    subject,
    level,
    questionType,
    timeRequired,
  };

  Object.keys(fieldsToUpdate).forEach((key) => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  if (Object.keys(fieldsToUpdate).length == 0) {
    return res.status(400).send({
      success: false,
      message: "No Data Found to update",
      data: fieldsToUpdate,
    });
  }

  // const q = await getExistingQuestionById(quid).catch((err) => {
  //   return res
  //     .status(400)
  //     .send({ success: false, message: err.name, data: err.message });
  // });

  try {
    const q = await questionModel.findOne({ _id: quid, addedBy: req.user._id });

    if (!q) {
      return res.status(404).send({
        success: false,
        message: "Question Does Not Exists with given quid",
        data: fieldsToUpdate,
      });
    }

    //check if the question exists with with same level
    const matchedQuestion = await questionModel.aggregate([
      {
        $match: {
          question: question,
          level: level,
          // timeRequired: timeRequired,
        },
      },
      { $sample: { size: 1 } },
    ]);

    //error if question with the same level already exists
    if (matchedQuestion.length > 0) {
      return res.status(400).send({
        success: false,
        message: "Question Already Exists at same level",
        data: fieldsToUpdate,
      });
    }

    //update the fields
    const updatedFields = await questionModel.updateOne(
      { _id: quid },
      {
        $set: fieldsToUpdate,
      },
      { runValidators: true }
    );

    //error if modified count is not 1 as we are updating only one question here
    if (updatedFields.modifiedCount != 1) {
      return res.status(400).send({
        success: false,
        message: "No fields updated",
        data: {},
      });
    }

    return res.status(201).send({
      success: true,
      message: "Question Updated Successfully",
      data: fieldsToUpdate,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.name || "Failed to update",
      data: error.message,
    });
  }
};

const deleteQuestionController = async (req, res) => {
  const { quid } = req.body;

  if (!quid) {
    return res
      .status(400)
      .send({ success: false, message: "quid is required", data: {} });
  }
  
  if (!req.user._id) {
    return res.status(401).send({
      success: false,
      message: "Invalid request or UnAuthorized request",
      data: {},
    });
  }
  // console.log(quid);
  // const existingQuestion = await questionModel.findById(quid);

  // //error if question does not exists with given id
  // if (!existingQuestion) {
  //   return res.status(404).send({
  //     success: false,
  //     message: "Question does not exists with given credentials",
  //     data: { quid },
  //   });
  // }

  const questionDeeleteMarkSUmmary = await questionModel
    .updateOne(
      { _id: quid, addedBy: req.user._id },
      { $set: { isActive: false } }
    )
    .catch((err) => {
      return res.status(500).send({
        success: false,
        message: "Failed to mark as deleted",
        data: err,
      });
    });

  // console.log(questionDeeleteMarkSUmmary);
  if (questionDeeleteMarkSUmmary.modifiedCount != 1) {
    return res
      .status(400)
      .send({ success: false, message: "Failed to mark as deleted", data: {} });
  }

  return res
    .status(200)
    .send({ success: true, message: "Delete Question Sucess", data: {} });
};

const getAllQuestionController = async (req, res) => {
  res.send("Get All Question Sucess");
};

const getRandomQuestionController = async (req, res) => {
  const { level, subject, questionType, noQue } = req.body;
  console.log(noQue);
  if (
    [level, subject, questionType, noQue].every(
      (field) => field?.trim() === undefined || field?.trim() === ""
    )
  ) {
    return res.status(400).send({
      success: false,
      message:
        "Atleast one parameter required (level, subject, questionType, noQue) to get a question of choice",
      data: {},
    });
  }

  // const r_que = await questionModel.find({
  //   level: level,
  //   subject: subject,
  //   questionType: questionType,
  // });

  const matchConditions = {};

  // Add conditions for provided parameters
  if (level) {
    matchConditions.level = level;
  }
  if (subject) {
    matchConditions.subject = subject;
  }
  if (questionType) {
    matchConditions.questionType = questionType;
  }

  // Get one random document matching {a: 10} from the mycoll collection.
  const r_que = await questionModel.aggregate([
    { $match: { isActive: true } },
    { $match: matchConditions },
    { $sample: { size: parseInt(noQue) } },
  ]);

  if (!r_que || !Array.isArray(r_que) || r_que.length === 0) {
    return res
      .status(404)
      .send({ success: false, message: "No question found", data: {} });
  }

  return res.status(200).send({
    success: true,
    message: "Question fetched successfully",
    data: r_que,
  });
};

export {
  createQuestionController,
  updateQuestionController,
  deleteQuestionController,
  getAllQuestionController,
  getRandomQuestionController,
};
