import mongoose from "mongoose";

// const dbUrl = "mongodb://localhost:27017/";

const dbName = "quizzer";

const connectDB = async (dbUrl) => {
  try {
    await mongoose.connect(`${dbUrl}${dbName}`).then(() => {
      console.log("DB Connection Success");
    });
  } catch (error) {
    console.log(`Error while connecting to database ${error}`);
    process.exit(1);
  }
};

export default connectDB;
