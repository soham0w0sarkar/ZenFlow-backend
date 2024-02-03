import { oauth2Client } from '../config/oauth.js';
import { google } from 'googleapis';
import User from '../models/user.js';
import { sessionStore } from '../app.js';

export const status = (req, res) => {
	res.status(200).json({
		success: true,
		message: 'User is logged in'
	});
};

export const googleLogin = (req, res) => {
	const url = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/calendar',
			'https://www.googleapis.com/auth/gmail.readonly',
		],
		include_granted_scopes: true
	});
	res.redirect(url);
};

export const googleCallback = async (req, res) => {
	const { code } = req.query;
	const { tokens } = await oauth2Client.getToken(code);

	oauth2Client.setCredentials(tokens);

	const oauth2 = google.oauth2({
		auth: oauth2Client,
		version: 'v2'
	});

	const { data } = await oauth2.userinfo.get();

	let user = await User.findOne({ email: data.email });

	if (user) {
		user.access_token = tokens.access_token;
		await user.save();

		req.session.user = user;
		req.session.access_token_expiration = new Date().getTime() + 3000000;
		req.session.save();

		return res.redirect(process.env.FRONTEND_URI);
	}

	user = await User.create({
		name: data.name,
		email: data.email,
		access_token: tokens.access_token,
		refresh_token: tokens.refresh_token
	});

	req.session.user = user;
	req.session.access_token_expiration = new Date().getTime() + 3000000;
	req.session.save();

	res.redirect(process.env.FRONTEND_URI);
};

export const logout = (req, res) => {
	const sessionId = req.session.id;
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).json({ message: 'Could not log out, please try again.' });
		} else {
			sessionStore.destroy(sessionId, (err) => {
				if (err) {
					return res.status(500).json({ message: 'Could not delete session from database.' });
				} else {
					res.clearCookie('connect.sid');
					return res.status(200).json({ success: true, message: 'Logged out successfully.' });
				}
			});
		}
	});
};
