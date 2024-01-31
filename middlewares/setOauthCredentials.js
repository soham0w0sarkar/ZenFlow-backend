import { oauth2Client, refreshAccessToken } from '../config/oauth.js';
import { catchAsyncError } from './catchAsyncError.js';

const setOauthCredentials = catchAsyncError((req, res, next) => {
	if (req.session.access_token_expiration <= new Date().getTime()) {
		console.log('req.session.access_token_expiration', req.session.access_token_expiration);
		refreshAccessToken(req.session.user.refresh_token);
		console.log('here');
	}

	oauth2Client.setCredentials({
		access_token: req.session.user.access_token,
		refresh_token: req.session.user.refresh_token
	});

	next();
});

export default setOauthCredentials;