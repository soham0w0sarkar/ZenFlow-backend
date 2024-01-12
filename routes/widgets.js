import express from "express";
import { isAdmin } from "../utils/isAuthenciated.js";
import {
  getAllAvailableWidgets,
  getWeather,
  toggelWidget,
} from "../controllers/widgets.js";

const widgetRouter = express.Router();

widgetRouter.get("/weather:lat:lon", getWeather);

export default widgetRouter;
