import { catchAsyncError } from "../middlewares/catchAsyncError.js";

const cityFormat = (value) => {
  value = value.split(' ');
  value = value.map((word, indx) => {
    if (indx !== value.length - 1) {
      return word[0].toUpperCase();
    }
    return word[0].toUpperCase() + word.slice(1);
  });
  
  if(value.length === 1) {
    return value;
  } else if(value.length === 2) {
    return value.join(' ');
  } else {
    return value.join('').slice(0, 2) + ' ' + value.join('').slice(2);
  }
};

export const getWeather = catchAsyncError(async (req, res, next) => {
  const { lat, lon } = req.params;
  const weatherData = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`
  );
  const weather = await weatherData.json();

  const data = {
    icon: weather.weather[0].icon,
    temp: Math.round(weather.main.temp - 273),
    city: cityFormat(weather.name),
  }

  res.status(200).json({
    status: "success",
    data,
  });
});

export const getJokes = catchAsyncError(async (req, res) => {
  const response = await fetch(
    "https://v2.jokeapi.dev/joke/Programming?type=single"
  );
  const data = await response.json();

  res.status(200).json({
    status: "success",
    joke: data.joke,
  });
});
