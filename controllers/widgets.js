import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import { oauth2Client } from '../config/oauth.js';
import { google } from 'googleapis';
import ErrorHandler from '../utils/errorHandler.js';


const getHeaderValue = (headers, headerName) => {
    const header = headers.find((h) => h.name.toLowerCase() === headerName.toLowerCase());
	return header ? header.value : '';
};

const parseSenderName = (fromHeader) => {
    if (!fromHeader) return 'Unknown Sender';
    
	const match = fromHeader.match(/^(.*?)\s*<(.+)>$/) || fromHeader.match(/^(.+)$/);
	if (match && match[1] && match[1].trim()) {
        return match[1].trim().replace(/^["']|["']$/g, '');
	}
	return fromHeader.split('@')[0];
};

const createShortSnippet = (subject, wordLimit = 5) => {
    if (!subject) return 'No Subject';
	const words = subject.split(' ').filter((word) => word.length > 0);
	if (words.length <= wordLimit) return subject;
	return `${words.slice(0, wordLimit).join(' ')}...`;
};

const retrieveMessages = async (gmail, messages, maxResults = 50) => {
    try {
        const limitedMessages = messages.slice(0, maxResults);
        
		const messagePromises = limitedMessages.map(async (message) => {
            try {
                const response = await gmail.users.messages.get({
                    userId: 'me',
					id: message.id,
					format: 'metadata',
					metadataHeaders: ['Subject', 'From', 'Date']
				});
                
				const headers = response.data.payload?.headers || [];
				const subject = getHeaderValue(headers, 'Subject') || 'No Subject';
				const fromHeader = getHeaderValue(headers, 'From');
				const dateHeader = getHeaderValue(headers, 'Date');
                
				const senderName = parseSenderName(fromHeader);
				const shortSnippet = createShortSnippet(subject);
                
				const receivedDate = dateHeader ? new Date(dateHeader) : new Date();
                
				return {
                    id: message.id,
					subject,
					short: shortSnippet,
					senderName,
					senderEmail: fromHeader,
					receivedDate: receivedDate.toISOString(),
					link: `https://mail.google.com/mail/u/0/#inbox/${message.id}`
				};
			} catch (error) {
                console.error(`Error retrieving message ${message.id}:`, error.message);
                
				return {
                    id: message.id,
					subject: 'Error loading message',
					short: 'Error loading...',
					senderName: 'Unknown',
					senderEmail: '',
					receivedDate: new Date().toISOString(),
					link: `https://mail.google.com/mail/u/0/#inbox/${message.id}`,
					error: true
				};
			}
		});
        
		const allMails = await Promise.all(messagePromises);
        
		return allMails.filter((mail) => !mail.error).sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));
	} catch (error) {
        console.error('Error in retrieveMessages:', error);
		throw new ErrorHandler('Failed to retrieve messages', 500);
	}
};

export const getAllMails = catchAsyncError(async (req, res, next) => {
    try {
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
		const { days = 1, maxResults = 50, includeRead = false } = req.query;
        
		// Calculate date range
		const dateFrom = new Date();
		dateFrom.setDate(dateFrom.getDate() - parseInt(days));
		const dateString = dateFrom.toISOString().split('T')[0];
        
		let searchQuery = `after:${dateString}`;
		if (!includeRead) {
            searchQuery += ' is:unread';
		}
        
		console.log(`Searching Gmail with query: ${searchQuery}`);
        
		const response = await gmail.users.messages.list({
            userId: 'me',
			q: searchQuery,
			maxResults: parseInt(maxResults)
		});
        
		if (!response.data.messages || response.data.messages.length === 0) {
            return res.status(200).json({
                success: true,
				mails: [],
				totalCount: 0,
				message: 'No messages found'
			});
		}
        
		const messages = response.data.messages;
		const mails = await retrieveMessages(gmail, messages, parseInt(maxResults));
        
		res.status(200).json({
            success: true,
			mails,
			totalCount: mails.length,
			resultEstimate: response.data.resultSizeEstimate || 0
		});
	} catch (error) {
        console.error('Error in getAllMails:', error);
        
		if (error.code === 403) {
            throw new ErrorHandler('Gmail API access denied. Please check permissions.', 403);
		} else if (error.code === 429) {
            throw new ErrorHandler('Gmail API rate limit exceeded. Please try again later.', 429);
		} else if (error.code === 401) {
            throw new ErrorHandler('Gmail authentication failed. Please re-authenticate.', 401);
		}
        
		throw new ErrorHandler('Failed to retrieve emails', 500);
	}
});

export const markAsRead = catchAsyncError(async (req, res, next) => {
    try {
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
		const { id } = req.params;
        
		if (!id) {
            throw new ErrorHandler('Message ID is required', 400);
		}
        
		// Verify message exists and is unread before modifying
		try {
            const messageInfo = await gmail.users.messages.get({
                userId: 'me',
				id,
				format: 'minimal'
			});
            
			if (!messageInfo.data) {
                throw new ErrorHandler('Message not found', 404);
			}
		} catch (error) {
            if (error.code === 404) {
                throw new ErrorHandler('Message not found', 404);
			}
			throw error;
		}
        
		await gmail.users.messages.modify({
            userId: 'me',
			id,
			resource: {
                removeLabelIds: ['UNREAD']
			}
		});
        
		res.status(200).json({
            success: true,
			message: 'Email marked as read successfully',
			messageId: id
		});
	} catch (error) {
        console.error('Error in markAsRead:', error);
        
		// Handle specific errors
		if (error.code === 404) {
            throw new ErrorHandler('Email not found', 404);
		} else if (error.code === 403) {
            throw new ErrorHandler('Permission denied to modify email', 403);
		} else if (error.code === 401) {
            throw new ErrorHandler('Gmail authentication failed', 401);
		}
        
		throw new ErrorHandler('Failed to mark email as read', 500);
	}
});

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
	const { summary, description, location, startDate, startTime, endDate, endTime, currentColorId, recurrence } =
		req.body;

	if (!summary || !startDate || !endDate || !currentColorId || !recurrence || !description) {
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
		recurrence: [recurrence]
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