# ZenFlow Backend

## backend for [ZenFlow](https://github.com/soham0w0sarkar/ZenFlow)

ZenFlow is a productivity Chrome extension designed to streamline your daily tasks and enhance your workflow. This repository contains the backend codebase for ZenFlow, responsible for managing user authentication, background customization, and various widgets integration.

## How it Works

ZenFlow backend is built using Node.js and Express.js, providing a RESTful API to interact with the Chrome extension frontend. Here's an overview of its functionality:

- **User Authentication**: Users can log in to the ZenFlow extension using their Google accounts. OAuth 2.0 authentication is implemented to securely authenticate users.

- **Background Customization**: Users have the ability to customize their extension background with uploaded images. Cloudinary is used for image storage and retrieval.

- **Widgets Integration**: Various widgets are integrated into the extension to provide additional functionality:

  - **Weather Widget**: Fetches weather data based on the user's location using the OpenWeatherMap API.
  - **Jokes Widget**: Retrieves programming-related jokes from the JokeAPI.
  - **Calendar Widget**: Retrieves upcoming events from the user's Google Calendar using Google Calendar API.
  - **Email Widget**: Fetches unread emails from the user's Gmail inbox using Gmail API.

- **Session Management**: Express session middleware is used for managing user sessions. Sessions are stored in MongoDB using `connect-mongo` to maintain user authentication state.

- **Error Handling**: Custom error handling middleware is implemented to gracefully handle exceptions and errors, providing informative error messages to clients.

## Contributing

Contributions to ZenFlow are welcome! To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/new-feature`).
3. Make your changes and commit them (`git commit -am 'Add new feature'`).
4. Push the changes to your branch (`git push origin feature/new-feature`).
5. Create a pull request.

## License

This project is licensed under the [MIT License](./LICENSE).
