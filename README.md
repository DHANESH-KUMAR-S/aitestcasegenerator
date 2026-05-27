# TestForge AI - Flask Application

A Flask web application for generating manual test cases and automation scripts from project requirements using AI.

## Features

- Generate manual test cases from project requirements
- Create automation scripts using various frameworks (Selenium, Playwright, Cypress, Robot Framework)
- Support for plain text input and file uploads (TXT, PDF, DOCX)
- Dark mode support
- Responsive design with Tailwind CSS

## Project Structure

```
testcasegen/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── styles.css    # Custom CSS styles
    └── js/
        └── script.js     # JavaScript functionality
```

## Setup Instructions

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Flask application:**
   ```bash
   python app.py
   ```

3. **Access the application:**
   Open your browser and go to `http://localhost:5000`

## API Endpoints

- `GET /` - Main application page
- `POST /upload` - File upload endpoint (for future use)
- `GET /health` - Health check endpoint

## Configuration

- The application uses the Gemini AI API for generating test cases
- File upload size is limited to 10MB
- Supported file types: TXT, PDF, DOCX

## Development

- The application runs in debug mode by default
- Static files are served from the `static/` directory
- Templates are located in the `templates/` directory

## Security Notes

- Change the `SECRET_KEY` in `app.py` for production use
- Consider implementing proper authentication for production deployment
- The Gemini API key is currently hardcoded in the JavaScript file - consider moving it to environment variables for production 