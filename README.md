# Audio Diary App

A voice diary application with AI-powered weekly reflections and geolocation insights. Record audio entries throughout the week, then receive an AI-generated summary on your chosen reflection day.

## Features

- 🎙️ **Audio Recording**: Record voice diary entries with Web Audio API
- 📍 **Geolocation Tracking**: Optional location capture to understand movement patterns
- 🤖 **AI Reflections**: Weekly summaries powered by GPT-4 with mood analysis and key themes
- 📊 **Location Insights**: Mobility scores, distance traveled, and location clustering
- ⏰ **Scheduled Processing**: Automated reflection generation on user-specified day/time
- 🔐 **Authentication**: Secure JWT-based auth with bcrypt password hashing

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB with Mongoose
- OpenAI (Whisper for transcription, GPT-4 for summaries)
- Node-cron for scheduled jobs
- Luxon for timezone handling

**Frontend:**
- Vanilla JavaScript
- Web Audio API for recording
- Geolocation API
- Modern CSS with gradients and animations

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your:
   - MongoDB URI
   - OpenAI API key
   - JWT secret

3. **Start MongoDB:**
   ```bash
   # Make sure MongoDB is running locally or use MongoDB Atlas
   ```

4. **Run the server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to `http://localhost:3000/login.html`

## How It Works

### The Reflection Day Model

1. **Recording Phase (6 days)**: Users record audio entries throughout the week
2. **Reflection Day**: On the user's chosen day/time, all entries are:
   - Transcribed using OpenAI Whisper
   - Analyzed for location patterns
   - Summarized by GPT-4 with mood trends and key themes
3. **View Reflections**: Users can browse past weeks and see their journey

### Geolocation Features

- Optional GPS capture during recording
- Location clustering (identifies "home", "work", etc.)
- Mobility score (0-100) based on movement
- Distance traveled calculation
- Exploration score for new places visited
- Privacy-first: no exact coordinates shown, only aggregated insights

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Entries
- `POST /api/entries` - Upload audio entry (with optional location)
- `GET /api/entries` - Get entries for user/week

### Weeks
- `GET /api/weeks` - Get all weeks for user
- `GET /api/weeks/:id` - Get specific week with transcriptions
- `POST /api/weeks/:id/generate-reflection` - Manually trigger reflection

### User Settings
- `GET /api/user/settings` - Get preferences
- `PUT /api/user/settings` - Update reflection day/time/timezone

## Project Structure

```
diary/
├── models/           # Mongoose schemas
│   ├── User.js
│   ├── Entry.js
│   └── Week.js
├── routes/           # Express routes
│   ├── auth.js
│   ├── entries.js
│   ├── weeks.js
│   └── user.js
├── services/         # Business logic
│   ├── reflectionService.js
│   └── scheduler.js
├── utils/            # Helper functions
│   └── locationAnalysis.js
├── public/           # Frontend files
│   ├── index.html
│   ├── login.html
│   ├── reflections.html
│   ├── styles.css
│   ├── app.js
│   ├── auth.js
│   └── reflections.js
└── server.js         # Main server file
```

## Development

```bash
# Run with auto-reload
npm run dev

# Run tests (when implemented)
npm test
```

## Future Enhancements

- [ ] iOS app with SwiftUI
- [ ] Map visualization of locations
- [ ] Email notifications when reflection is ready
- [ ] Monthly/yearly summaries
- [ ] Export functionality
- [ ] Audio playback in reflections view
- [ ] S3 storage for audio files
- [ ] Redis for job queue (Bull)

## License

ISC
