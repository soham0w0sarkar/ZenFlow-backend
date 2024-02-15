import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import errorMiddleware from './middlewares/error.js';
import cors from 'cors';
import { initializeOAuthClient } from './config/oauth.js';

import { config } from 'dotenv';
config({ path: './config/config.env' });

initializeOAuthClient();

const app = express();

app.use(
	cors({
		origin: process.env.FRONTEND_URI,
		credentials: true,
		optionsSuccessStatus: 200,
		exposedHeaders: ['Set-Cookie'],
		methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Access-Control-Allow-Origin', 'Content-Type', 'Authorization', 'Set-Cookie']
	})
);

app.use(express.json());

export const sessionStore = MongoStore.create({
	mongoUrl: process.env.MONGO_URI,
	collectionName: 'sessions'
});

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
		cookie: {
			maxAge: 3 * 24 * 60 * 60 * 1000,
			secure: false,
			sameSite: 'none'
		},
		store: sessionStore
	})
);

app.use((req, res, next) => {
	console.log('\n');
	console.log('/******* Request ******/');
	console.log('sessionId : ', req.sessionID);
	console.log('method : ', req.method);
	console.log('url : ', req.url);
	console.log('/*************/');
	console.log('\n');
	next();
});

app.get('/', (req, res) => {
	res.send('Hello Everynian!!');
});

import authRouter from './routes/auth.js';
import backgroundRouter from './routes/background.js';
import widgetRouter from './routes/widgets.js';

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/background', backgroundRouter);
app.use('/api/v1/widgets', widgetRouter);

app.use(errorMiddleware);

export default app;
