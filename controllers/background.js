import cloudinary from "cloudinary";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import getDataUri from "../middlewares/dataUri.js";
import Background from "../models/background.js";
import ErrorHandler from "../utils/errorHandler.js";

export const getBackground = catchAsyncError(async (req, res, next) => {
  const backgrounds = await Background.find({});
  if (!backgrounds)
    return next(new ErrorHandler("No such setting found!!", 404));

  res.status(200).json({
    success: true,
    backgrounds,
  });
});

export const setBackground = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  if (!file) return next(new ErrorHandler("No file found!!", 404));

  const fileUri = getDataUri(file);

  const uploadCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    folder: "background",
    use_filename: true,
  });

  const background = await Background.create({
    name: fileUri.filename,
    public_id: uploadCloud.public_id,
    url: uploadCloud.secure_url,
  });

  res.status(200).json({
    success: true,
    message: "Background image updated successfully!!",
  });
});
