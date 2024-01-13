import express from "express";
import session from "express-session";
import passport from "passport";
import errorMiddleware from "./middlewares/error.js";
import cors from "cors";

import { config } from "dotenv";
config({ path: "./config/config.env" });

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ["Set-Cookie"],
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Content-Type",
      "Authorization",
      "Set-Cookie",
    ],
  })
);

app.use(express.json());

import intializePassport from "./config/passport.js";
intializePassport(passport);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("Hello Everynian!!");
});

import authRouter from "./routes/auth.js";
import backgroundRouter from "./routes/background.js";

app.use("/auth", authRouter);
app.use("/api/v1/background", backgroundRouter);

export default app;

app.use(errorMiddleware);
