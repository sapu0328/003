# AI Chat Web App

This project is a web application that allows users to have text conversations with an AI using the Google API. The application provides a simple interface for users to input their messages and receive responses from the AI.

## Project Structure

```
ai-chat-webapp
├── public
│   ├── index.html       # HTML structure for the web application
│   └── styles.css       # CSS styles for the web application
├── src
│   ├── app.js           # Main JavaScript file for handling chat logic
│   └── api
│       └── googleApi.js # Functions to interact with the Google API
├── package.json          # npm configuration file
└── README.md             # Project documentation
```

## Getting Started

To run this application, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ai-chat-webapp
   ```

2. **Install dependencies**:
   Make sure you have Node.js installed. Then run:
   ```bash
   npm install
   ```

3. **Set up your Google API key**:
   Replace the placeholder in `src/api/googleApi.js` with your actual Google API key.

4. **Open the application**:
   Open `public/index.html` in your web browser to start using the chat application.

## Usage

- Type your message in the input field and click the "Send" button or press Enter to send your message.
- The AI will respond based on the input provided.

## License

This project is licensed under the MIT License.