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
	oauth2Client.setCredentials({
		refresh_token: refreshToken
	});

	oauth2Client.refreshAccessToken(function (err, tokens) {
		if (err) {
			throw new ErrorHandler(err.message, 500);
		}

		req.session.user.access_token = tokens.access_token;
		req.session.access_token_expiration = new Date().getTime() + 3000000;
		req.session.save();
	});
};
