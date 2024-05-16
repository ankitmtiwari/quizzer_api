import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//global middleware setup
app.use(
  cors({
    origin: "*",
    credential: true,
  })
);

//when data comes from form
app.use(express.json({ limit: "16kb" }));
//when data comes from url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
//static files folder assets
app.use(express.static("public"));
//to use cookies
app.use(cookieParser());

//All Routers import
import { userRouters } from "./src/routes/user_routes.js";
import { questionRouter } from "./src/routes/question_routes.js";
import { contestRouter } from "./src/routes/contest_routes.js";

//all the routes
app.use("/api/v1/users", userRouters);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/contests", contestRouter);

export { app };
