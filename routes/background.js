import express from "express";
import { getBackground, setBackground } from "../controllers/background.js";
import singleStorage from "../middlewares/multer.js";
import { isAuthenciated } from "../utils/isAuthenciated.js";

const backgroundRouter = express.Router();

backgroundRouter.get("/getBackground",isAuthenciated, getBackground);
backgroundRouter.post(
  "/setBackground",
  isAuthenciated,
  singleStorage,
  setBackground
);

export default backgroundRouter;
