import cloudinary from 'cloudinary';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import getDataUri from '../middlewares/dataUri.js';
import Background from '../models/background.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getBackground = catchAsyncError(async (req, res, next) => {
	let backgrounds = await Background.find({ user: req.session.user._id });

	if (!backgrounds) next(new ErrorHandler('No Background uploaded', 404));

	let currentBackground = backgrounds.find((background) => background.current);

	backgrounds = backgrounds.map((background) => {
		return {
			id: background._id,
			url: background.url
		};
	});

	res.status(200).json({
		success: true,
		currentBackground: currentBackground.url,
		backgrounds
	});
});

export const setBackground = catchAsyncError(async (req, res, next) => {
	const file = req.file;
	if (!file) next(new ErrorHandler('No file found!!', 404));

	const fileUri = getDataUri(file);

	const uploadCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
		folder: `background/${req.session.user.name}`
	});

	await Background.updateMany({ user: req.session.user._id }, { current: false });

	const background = await Background.create({
		public_id: uploadCloud.public_id,
		url: uploadCloud.secure_url,
		current: true,
		user: req.session.user._id
	});

	res.status(200).json({
		success: true,
		id: background._id,
		url: background.url,
		message: 'Background image updated successfully!!'
	});
});

export const deleteBackground = catchAsyncError(async (req, res, next) => {
	const background = await Background.findById(req.params.id);

	if (!background) next(new ErrorHandler('No Background found!!', 404));

	await cloudinary.v2.uploader.destroy(background.public_id);

	await background.deleteOne();

	res.status(200).json({
		success: true,
		message: 'Background image deleted successfully!!'
	});
});

export const setCurrentBackground = catchAsyncError(async (req, res, next) => {
	const background = await Background.findById(req.params.id);

	if (!background) next(new ErrorHandler('No Background found!!', 404));

	await Background.updateMany({ user: req.session.user._id }, { current: false });
	await background.updateOne({ current: true });

	res.status(200).json({
		success: true,
		message: 'Background image updated successfully!!'
	});
});
