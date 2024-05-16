import mongoose from "mongoose";

const quizContestSchema = new mongoose.Schema(
  {
    contestName: {
      type: "String",
      require: true,
      default: "Simple Quiz Contest",
      trim: true,
    },
    noOfQuestions: {
      type: Number,
      require: [true, "Number of questions is contest is required"],
    },
    allQuestions: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Question",
      },
    ],
    questionScope: {
      type: String,
      require: [true, "questionScope is required to create contest"],
      enum: ["private", "public"],
      default: "public",
    },
    contestDuration: {
      type: Number,
      require: [true, "Duration of contest is required"],
    },
    contestStartDateTime: {
      type: Date,
      require: [true, "contest start date time is required"],
      default: Date()
    },
    contestEndDateTime: {
      type: Date,
      require: [true, "contest start date time is required"],
      default: Date()
    },
    isActive: {
      type: Boolean,
      require: [true, "Contest Status is required"],
      default: true,
    },
    isContestDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "created by user is requred"],
    },
  },
  { timestamps: true }
);

export const contestModel = mongoose.model("Contest", quizContestSchema);
