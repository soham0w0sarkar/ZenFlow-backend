// config/oauth.js
import { google } from 'googleapis';
import ErrorHandler from '../utils/errorHandler.js';

export let oauth2Client;

export const initializeOAuthClient = () => {
	oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		'http://localhost:9090/api/v1/auth/google/callback'
	);
};

export const refreshAccessToken = async (refreshToken, req) => {
	try {
		oauth2Client.setCredentials({
			refresh_token: refreshToken
		});

		const tokens = await new Promise((resolve, reject) => {
			oauth2Client.refreshAccessToken((err, tokens) => {
				if (err) {
					reject(new ErrorHandler(`Token refresh failed: ${err.message}`, 401));
				} else {
					resolve(tokens);
				}
			});
		});

		req.session.user.access_token = tokens.access_token;

		req.session.access_token_expiration = tokens.expiry_date || new Date().getTime() + tokens.expires_in * 1000;

		if (tokens.refresh_token) {
			req.session.user.refresh_token = tokens.refresh_token;
		}

		await new Promise((resolve, reject) => {
			req.session.save((err) => {
				if (err) reject(err);
				else resolve();
			});
		});

		return tokens;
	} catch (error) {
		console.error('Token refresh error:', error);
		throw error;
	}
};
