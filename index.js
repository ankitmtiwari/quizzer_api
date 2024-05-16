import { app } from "./app.js";
import connectDB from "./src/db/connection.js";
import dotenv from "dotenv"

dotenv.config({
  path: './.env'
})


const connectServer = async () => {
  app.listen(process.env.PORT, () => {
    console.log(`app listening at ${process.env.PORT}`);
  });
};

await connectDB(process.env.DB_CONNECT_URL)
  .then(() => {
    connectServer();
  })
  .catch((err) => {
    console.log("Failed in connecting to db");
  });
