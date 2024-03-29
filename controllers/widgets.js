import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import { oauth2Client } from '../config/oauth.js';
import { google } from 'googleapis';
import ErrorHandler from '../utils/errorHandler.js';

const cityFormat = (value) => {
	value = value.split(' ');
	value = value.map((word, indx) => {
		if (indx !== value.length - 1) {
			return word[0].toUpperCase();
		}
		return word[0].toUpperCase() + word.slice(1);
	});

	if (value.length === 1) {
		return value;
	} else if (value.length === 2) {
		return value.join(' ');
	} else {
		return value.join('').slice(0, 2) + ' ' + value.join('').slice(2);
	}
};

const retrieveMessages = catchAsyncError(async (gmail, messages, res) => {
	const mails = messages.map(async (message) => {
		const response = await gmail.users.messages.get({
			userId: 'me',
			id: message.id
		});

		const headers = response.data.payload.headers;
		const subject = headers.find((header) => header.name === 'Subject').value;
		const senderName = headers
			.find((header) => header.name === 'From')
			.value.split('<')[0]
			.trim();

		return {
			id: message.id,
			subject,
			short: `${subject.split(' ').slice(0, 3).join(' ')} ...`,
			senderName,
			link: `https://mail.google.com/mail/u/0/#inbox/${message.id}`
		};
	});

	const allMails = await Promise.all(mails);

	res.status(200).json({
		success: true,
		mails: allMails
	});
});

export const getWeather = catchAsyncError(async (req, res, next) => {
	const { lat, lon } = req.params;

	const weatherData = await fetch(
		`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`
	);

	if (!weatherData.ok) {
		next(new ErrorHandler(`Error fetching weather) data`, 500));
	}

	const weather = await weatherData.json();

	if (weather.cod[0] === 4 || weather.cod[0] === 5) {
		return next(new ErrorHandler(weather.message, weather.cod));
	}

	const data = {
		icon: weather.weather[0].icon,
		main: weather.weather[0].main,
		description: weather.weather[0].description,
		temp: Math.round(weather.main.temp - 273),
		feels_like: Math.round(weather.main.feels_like - 273),
		wind_speed: (weather.wind.speed * 3.6).toFixed(2),
		wind_deg: weather.wind.deg,
		sunrise: new Date(weather.sys.sunrise * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
		sunset: new Date(weather.sys.sunset * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
		humidity: weather.main.humidity,
		city_full: weather.name,
		city: cityFormat(weather.name)
	};

	res.status(200).json({
		success: true,
		data
	});
});

export const getJokes = catchAsyncError(async (req, res) => {
	const response = await fetch('https://v2.jokeapi.dev/joke/Programming?blacklistFlags=nsfw&type=single');
	const data = await response.json();

	res.status(200).json({
		success: true,
		joke: data.joke
	});
});

export const getAllEvents = catchAsyncError(async (req, res, next) => {
	const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

	const response = await calendar.events.list({
		calendarId: 'primary',
		timeMin: new Date().toISOString(),
		timeMax: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
		singleEvents: true,
		orderBy: 'startTime'
	});

	if (response.status !== 200) {
		next(new ErrorHandler('Error fetching events)', response.status));
	}

	if (!response.data.items) {
		res.status(200).json({
			success: true,
			events: []
		});

		return;
	}

	const events = response.data.items.map(async (item) => {
		let location = item.location || 'No location';
		location = location.split(',')[0];

		let repeat = 'No repeat';

		if (item.recurringEventId) {
			const recurrence = await calendar.events.get({
				calendarId: 'primary',
				eventId: item.recurringEventId
			});
			repeat = recurrence.data.recurrence[0].split(';')[0].split('=')[1];
			repeat = repeat[0].toUpperCase() + repeat.slice(1).toLocaleLowerCase();
		}

		let description = item.description || 'No description';

		if (item.start.dateTime) {
			const startDateTimeString = item.start.dateTime;
			const endDateTimeString = item.end.dateTime;
			const startDateTimeObj = new Date(startDateTimeString);
			const endDateTimeObj = new Date(endDateTimeString);

			const startDate = startDateTimeObj.toLocaleDateString('en-US', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
			const startTime = startDateTimeObj.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: 'numeric'
			});
			const endTime = endDateTimeObj.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: 'numeric'
			});
			const endDate = endDateTimeObj.toLocaleDateString('en-US', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});

			return {
				colorId: item.colorId || '7',
				summary: item.summary,
				description,
				location,
				repeat,
				startDate,
				startTime,
				endDate,
				endTime
			};
		} else {
			const startDate = new Date(item.start.date).toLocaleDateString('en-US', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
			const endDate = new Date(item.end.date).toLocaleDateString('en-US', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});

			return {
				colorId: item.colorId || '7',
				summary: item.summary,
				description,
				repeat,
				location,
				startDate,
				startTime: 'All Day',
				endDate,
				endTime: 'All Day'
			};
		}
	});

	const allEvents = await Promise.all(events);

	res.status(200).json({
		success: true,
		events: allEvents
	});
});

export const createEvent = catchAsyncError(async (req, res, next) => {
	const { summary, description, location, startDate, startTime, endDate, endTime, currentColorId, reccurence } =
		req.body;

	if (!summary || !startDate || !endDate || !currentColorId || !reccurence || !description) {
		next(new ErrorHandler('Please fill all) fields', 400));
	}

	const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

	let start;
	let end;

	if (startTime && endTime) {
		start = {
			dateTime: new Date(`${startDate} ${startTime}`),
			timeZone: 'Asia/Kolkata'
		};
		end = {
			dateTime: new Date(`${endDate} ${endTime}`),
			timeZone: 'Asia/Kolkata'
		};
	}

	if (!startTime && !endTime) {
		start = {
			date: new Date(startDate).toISOString().split('T')[0]
		};
		end = {
			date: new Date(endDate).toISOString().split('T')[0]
		};
	}

	let event = {
		colorId: currentColorId,
		summary,
		description,
		location,
		start,
		end,
		reccurence: [reccurence]
	};

	const response = await calendar.events.insert({
		calendarId: 'primary',
		resource: event
	});

	res.status(200).json({
		success: true,
		message: 'Event created successfully'
	});
});

export const getAllMails = catchAsyncError(async (req, res, next) => {
	const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

	const today = new Date().toISOString().split('T')[0];

	const response = await gmail.users.messages.list({
		userId: 'me',
		q: `is:unread after:${today}`
	});

	if (!response.data.messages) {
		res.status(200).json({
			success: true,
			mails: []
		});

		return;
	}
	const messages = response.data.messages;

	retrieveMessages(gmail, messages, res);
});

export const markAsRead = catchAsyncError(async (req, res, next) => {
	const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

	const { id } = req.params;

	await gmail.users.messages.modify({
		userId: 'me',
		id,
		resource: {
			removeLabelIds: ['UNREAD']
		}
	});

	res.status(200).json({
		success: true,
		message: 'Mail marked as read'
	});
});
