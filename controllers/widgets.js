import Widget from "../models/widgets.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";


export const getWeather = catchAsyncError(async (req, res, next) => {
  const { lat, lon } = req.params;
  const weatherData = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`
  );
  const weather = await weatherData.json();
  res.status(200).json({
    status: "success",
    data: {
      weather,
    },
  });
});
