import express from "express";
import { googleLogin, googleCallback } from "../controllers/auth.js";

const authRouter = express.Router();

authRouter.get("/googleLogin", googleLogin);
authRouter.get("/google/callback", googleCallback);

export default authRouter;
