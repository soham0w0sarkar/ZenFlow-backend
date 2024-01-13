import express from "express";

import {
  getWeather,
} from "../controllers/widgets.js";

const widgetRouter = express.Router();

widgetRouter.get("/weather:lat:lon", getWeather);

export default widgetRouter;
