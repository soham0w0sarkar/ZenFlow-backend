import express from 'express';
import { googleLogin, googleCallback, status, logout, setCredentials } from '../controllers/auth.js';
import { isAuthenciated } from '../utils/isAuthenciated.js';

const authRouter = express.Router();

authRouter.get('/googleLogin', googleLogin);
authRouter.get('/google/callback', googleCallback);
authRouter.get('/status', isAuthenciated, status);
authRouter.get('/logout', logout);

export default authRouter;
