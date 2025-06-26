import User from '../models/user.js';
import ErrorHandler from '../utils/errorHandler.js';
import CryptoJS from 'crypto-js';
import { oauth2Client } from '../config/oauth.js';
import { google } from 'googleapis';
import { sessionStore } from '../app.js';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';

export const status = (req, res) => {
	res.status(200).json({
		success: true,
		message: 'User is logged in'
	});
};

export const googleLogin = (req, res, next) => {
	const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

	const loginUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/calendar',
			'https://www.googleapis.com/auth/gmail.modify'
		],
		include_granted_scopes: true,
		state: state
	});

	return res.status(200).json({
		success: true,
		loginUrl
	});
};

export const googleCallback = async (req, res, next) => {
	try {
		const { code } = req.query;
		const { tokens } = await oauth2Client.getToken(code);

		if (!tokens) {
			return next(new ErrorHandler('Unable to get tokens', 400));
		}

		oauth2Client.setCredentials(tokens);

		const oauth2 = google.oauth2({
			auth: oauth2Client,
			version: 'v2'
		});

		const { data } = await oauth2.userinfo.get();

		if (!data) {
			return next(new ErrorHandler('Unable to get user info', 400));
		}

		let user = await User.findOne({ email: data.email });

		if (user) {
			user.access_token = tokens.access_token;
			if (tokens.refresh_token) {
				user.refresh_token = tokens.refresh_token;
			}
			await user.save();
		} else {
			user = await User.create({
				name: data.name,
				email: data.email,
				access_token: tokens.access_token,
				refresh_token: tokens.refresh_token
			});
		}

		req.session.user = {
			_id: user._id,
			name: user.name,
			email: user.email,
			access_token: user.access_token,
			refresh_token: user.refresh_token
		};

		req.session.access_token_expiration = new Date().getTime() + 3000000;
		req.session.isAuthenticated = true;

		req.session.save((err) => {
			if (err) {
				return next(new ErrorHandler('Could not save session, please try again.', 500));
			}

			return res.redirect(`${process.env.FRONTEND_URI}`);
		});
	} catch (error) {
		return next(new ErrorHandler(error.message, 500));
	}
};

export const logout = (req, res, next) => {
	const sessionId = req.session.id;
	req.session.destroy((err) => {
		if (err) {
			return next(new ErrorHandler('Could not log out, please try again.', 500));
		} else {
			sessionStore.destroy(sessionId, (err) => {
				if (err) {
					return next(new ErrorHandler('Could not delete session from database.', 500));
				} else {
					res.clearCookie('connect.sid');
					return res.status(200).json({ success: true, message: 'Logged out successfully.' });
				}
			});
		}
	});
};
