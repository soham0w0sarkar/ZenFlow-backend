import express from "express";

import { getAllEvents, getJokes, getWeather } from "../controllers/widgets.js";
import { isAuthenciated } from "../utils/isAuthenciated.js";

const widgetRouter = express.Router();

widgetRouter.get("/weather/:lat/:lon", getWeather);
widgetRouter.get("/jokes", getJokes);
widgetRouter.get("/calendar/getAllEvents", isAuthenciated, getAllEvents);

export default widgetRouter;
