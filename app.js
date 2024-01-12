import express from "express";
import session from "express-session";
import passport from "passport";
import errorMiddleware from "./middlewares/error.js";

import { config } from "dotenv";
config({ path: "./config/config.env" });

const app = express();

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
import appRouter from "./routes/app.js";
import backgroundRouter from "./routes/background.js";
import widgetRouter from "./routes/widgets.js";

app.use("/auth", authRouter);
app.use("/app", appRouter);
app.use("/background", backgroundRouter);
app.use("/widgets", widgetRouter);

export default app;

app.use(errorMiddleware);
