import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import { oauth2Client } from '../config/oauth.js';
import { google } from 'googleapis';

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

export const getWeather = catchAsyncError(async (req, res, next) => {
	const { lat, lon } = req.params;
	const weatherData = await fetch(
		`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`
	);
	const weather = await weatherData.json();

	const data = {
		icon: weather.weather[0].icon,
		temp: Math.round(weather.main.temp - 273),
		city: cityFormat(weather.name)
	};

	res.status(200).json({
		success: true,
		data
	});
});

export const getJokes = catchAsyncError(async (req, res) => {
	const response = await fetch('https://v2.jokeapi.dev/joke/Programming?type=single');
	const data = await response.json();

	res.status(200).json({
		success: true,
		joke: data.joke
	});
});

export const getAllEvents = catchAsyncError(async (req, res) => {
	const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

	const response = await calendar.events.list({
		calendarId: 'primary',
		timeMin: new Date().toISOString(),
		timeMax: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
		maxResults: 10,
		singleEvents: true,
		orderBy: 'startTime'
	});

	const events = response.data.items.map((item) => {
		let location = item.location || 'No location';
		location = location.split(',')[0];

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
				location,
				startDate,
				startTime: 'All Day',
				endDate,
				endTime: 'All Day'
			};
		}
	});

	console.log(events);

	res.status(200).json({
		success: true,
		events
	});
});

export const createEvent = catchAsyncError(async (req, res) => {
	const { summary, description, location, startDate, startTime, endDate, endTime, currentColorId } = req.body;

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
		end
	};

	const response = await calendar.events.insert({
		calendarId: 'primary',
		resource: event
	});

	if (response.data.start.dateTime) {
		const startDateTimeString = response.data.start.dateTime;
		const endDateTimeString = response.data.end.dateTime;
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

		event = {
			summary: response.data.summary,
			description,
			location,
			startDate,
			startTime,
			endDate,
			endTime
		};
	} else {
		const startDate = new Date(response.data.start.date).toLocaleDateString('en-US', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
		const endDate = new Date(response.data.end.date).toLocaleDateString('en-US', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});

		event = {
			summary: response.data.summary,
			description,
			location,
			startDate,
			startTime: 'All Day',
			endDate,
			endTime: 'All Day'
		};
	}

	res.status(200).json({
		success: true,
		event
	});
});

export const getAllMails = catchAsyncError(async (req, res) => {
	const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

	const today = new Date().toISOString().split('T')[0];

	const response = await gmail.users.messages.list({
		userId: 'me',
		maxResults: 10,
		q: `is:unread after:${today}`
	});

	const messages = response.data.messages;

	retrieveMessages(gmail, messages, res);
});

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
			subject,
			short: subject.split(' ').slice(0, 3).join(' ') + '...',
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
