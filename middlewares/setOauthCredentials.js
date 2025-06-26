import { oauth2Client, refreshAccessToken } from '../config/oauth.js';
import { catchAsyncError } from './catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';

const setOauthCredentials = catchAsyncError(async (req, res, next) => {
	try {
		if (!req.session?.user?.access_token) {
			throw new ErrorHandler('No access token found. Please re-authenticate.', 401);
		}

		const currentTime = new Date().getTime();
		const expirationTime = req.session.access_token_expiration || 0;

		const bufferTime = 5 * 60 * 1000;

		if (expirationTime - bufferTime <= currentTime) {
			if (!req.session.user.refresh_token) {
				throw new ErrorHandler('No refresh token available. Please re-authenticate.', 401);
			}

			console.log('Refreshing access token...');
			await refreshAccessToken(req.session.user.refresh_token, req);
		}

		oauth2Client.setCredentials({
			access_token: req.session.user.access_token,
			refresh_token: req.session.user.refresh_token
		});

		next();
	} catch (error) {
		console.error('OAuth credentials error:', error);

		if (req.session?.user) {
			delete req.session.user.access_token;
			delete req.session.user.refresh_token;
			delete req.session.access_token_expiration;
		}

		next(error);
	}
});

export default setOauthCredentials;
