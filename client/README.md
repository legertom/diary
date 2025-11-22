# Audio Diary - React Frontend

React application for the Audio Diary app with geolocation-enabled voice recording and AI-powered weekly reflections.

## Features

- 🔐 Authentication (Login/Register)
- 🎙️ Audio recording with Web Audio API
- 📍 Optional geolocation capture
- 📊 Weekly reflection viewing with location insights
- 🎨 Modern, premium UI with gradient backgrounds

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── AudioRecorder.jsx    # Recording component with geolocation
│   │   └── PrivateRoute.jsx     # Auth-protected route wrapper
│   ├── context/
│   │   └── AuthContext.jsx      # Authentication state management
│   ├── pages/
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration with reflection settings
│   │   ├── Dashboard.jsx        # Main recording interface
│   │   └── Reflections.jsx      # Past reflections viewer
│   ├── styles/
│   │   ├── Auth.css
│   │   ├── Dashboard.css
│   │   └── Reflections.css
│   ├── App.jsx                  # Main app with routing
│   ├── App.css                  # Global styles
│   └── main.jsx                 # Entry point
└── package.json
```

## API Integration

The frontend expects the backend API to be running on `http://localhost:3000`. Update the API URL in the following files if needed:

- `src/context/AuthContext.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/Reflections.jsx`
- `src/components/AudioRecorder.jsx`

## Future Enhancements

- [ ] Internationalization (i18n) for multi-language support
- [ ] Environment variables for API URL
- [ ] Audio playback in reflections view
- [ ] Progressive Web App (PWA) support
- [ ] Offline recording with sync
- [ ] Dark mode toggle
