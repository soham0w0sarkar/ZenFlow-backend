import express from "express";
import session from "express-session";
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

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.get("/", (req, res) => {
  res.send("Hello Everynian!!");
});

import authRouter from "./routes/auth.js";
import backgroundRouter from "./routes/background.js";
import widgetRouter from "./routes/widgets.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/background", backgroundRouter);
app.use("/api/v1/widgets", widgetRouter);

app.use(errorMiddleware);

export default app;
