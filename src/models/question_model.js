import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
    },
    allAnswers: [
      {
        type: String,
        required: true,
      },
    ],
    correctAnswerIndex: {
      type: Number,
      required: [true, "Correct Answer Index is required"],
    },
    subject: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    questionType: {
      type: String,
      required: true,
      enum: ["mcq", "true_false"],
      default: "mcq",
    },
    timeRequired: {
      type: Number,
      required: [true, "time required in mandatory"], //Always consider it in seconds
    },
    addedBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Added by user is requred"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

questionSchema.index({ question: 1, level: 1 }, { unique: true });
// questionSchema.pre("save", async function (next) {
//   console.log("Before creating new question", this.question);
// });

export const questionModel = mongoose.model("Question", questionSchema);
