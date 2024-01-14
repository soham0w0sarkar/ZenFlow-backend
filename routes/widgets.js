import express from "express";

import { getJokes, getWeather } from "../controllers/widgets.js";

const widgetRouter = express.Router();

widgetRouter.get("/weather/:lat/:lon", getWeather);
widgetRouter.get("/jokes", getJokes);

export default widgetRouter;
