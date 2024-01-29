export const isAuthenciated = (req, res, next) => {
	if (req.session.cookie) {
		next();
	} else {
		res.status(401).json({
			success: false,
			message: 'Unauthorized'
		});
	}
};
