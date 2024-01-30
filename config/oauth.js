import { google } from 'googleapis';

export let oauth2Client;

export const initializeOAuthClient = () => {
	oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		'http://localhost:9090/api/v1/auth/google/callback'
	);
};

export const refreshAccessToken = async (refreshToken) => {
	oauth2Client.setCredentials({
		refresh_token: req.session.user.refresh_token
	});

	oauth2Client.refreshAccessToken(function (err, tokens) {
		if (err) {
			console.error('Error refreshing access token', err);
			return;
		}

		req.session.user.access_token = tokens.access_token;
	});
};
