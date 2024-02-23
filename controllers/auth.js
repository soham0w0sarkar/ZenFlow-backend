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
	const loginUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/calendar',
			'https://www.googleapis.com/auth/gmail.modify'
		],
		include_granted_scopes: true
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
			await user.save();

			const ciphertext = CryptoJS.AES.encrypt(user.id, process.env.SESSION_SECRET).toString();

			return res.redirect(process.env.FRONTEND_URI + '/' + encodeURIComponent(ciphertext));
		}

		user = await User.create({
			name: data.name,
			email: data.email,
			access_token: tokens.access_token,
			refresh_token: tokens.refresh_token
		});

		const ciphertext = CryptoJS.AES.encrypt(user.id, process.env.SESSION_SECRET).toString();

		return res.redirect(process.env.FRONTEND_URI + '/' + encodeURIComponent(ciphertext));
	} catch (error) {
		return next(new ErrorHandler(error.message, 500));
	}
};

export const setCredentials = catchAsyncError(async (req, res, next) => {
	try {
		let { userId } = req.params;
		userId = decodeURIComponent(userId);
		userId = CryptoJS.AES.decrypt(userId, process.env.SESSION_SECRET).toString(CryptoJS.enc.Utf8);

		const user = await User.findById(userId);

		if (!user) {
			return next(new ErrorHandler('User not found', 404));
		}

		req.session.user = user;
		req.session.access_token_expiration = new Date().getTime() + 3000000;
		req.session.save();

		return res.status(200).json({
			success: true,
			message: 'Credentials set successfully'
		});
	} catch (error) {
		return next(new ErrorHandler(error.message, 500));
	}
});

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
