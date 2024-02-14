import express from 'express';

import { createEvent, getAllEvents, getAllMails, getJokes, getWeather, markAsRead } from '../controllers/widgets.js';
import { isAuthenciated } from '../utils/isAuthenciated.js';
import setOauthCredentials from '../middlewares/setOauthCredentials.js';

const widgetRouter = express.Router();

widgetRouter.get('/weather/:lat/:lon', getWeather);
widgetRouter.get('/jokes', getJokes);
widgetRouter
	.route('/calendar')
	.get(isAuthenciated, setOauthCredentials, getAllEvents)
	.post(isAuthenciated, setOauthCredentials, createEvent);
widgetRouter.get('/allMails', isAuthenciated, setOauthCredentials, getAllMails);
widgetRouter.post('/markAsRead/:id', isAuthenciated, setOauthCredentials, markAsRead);

export default widgetRouter;
