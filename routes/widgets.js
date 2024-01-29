import express from 'express';

import { createEvent, getAllEvents, getJokes, getWeather } from '../controllers/widgets.js';
import { isAuthenciated } from '../utils/isAuthenciated.js';

const widgetRouter = express.Router();

widgetRouter.get('/weather/:lat/:lon', getWeather);
widgetRouter.get('/jokes', getJokes);
widgetRouter.route('/calendar').get('/getAllEvents', isAuthenciated, getAllEvents).post('/createEvent', isAuthenciated, createEvent);

export default widgetRouter;
