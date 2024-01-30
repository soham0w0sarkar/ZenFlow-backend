import express from 'express';

import { createEvent, getAllEvents, getJokes, getWeather } from '../controllers/widgets.js';
import { isAuthenciated } from '../utils/isAuthenciated.js';
import setOauthCredentials from '../middlewares/setOauthCredentials.js';

const widgetRouter = express.Router();

widgetRouter.get('/weather/:lat/:lon', getWeather);
widgetRouter.get('/jokes', getJokes);
widgetRouter.route('/calendar', isAuthenciated, setOauthCredentials).get(getAllEvents).post(createEvent);

export default widgetRouter;
