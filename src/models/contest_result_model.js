import mongoose, { mongo } from "mongoose";

const contestResultSchema = mongoose.Schema(
  {
    contestId: {
      type: mongoose.Types.ObjectId,
      ref: "Contest",
    },
  },
  { timestamp: true }
);

export const contestResultModel = mongoose.model(
  "ContestResult",
  contestResultSchema
);
