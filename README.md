# Personal Expense Tracker

A small single-user expense tracker built with React, Vite, Express, and MongoDB.

## Requirements

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB connection URI

## Setup

1. Install the root development dependency and app dependencies: `npm run install:all`
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` if needed.
3. Run `npm run dev` from the project root. It starts the local MongoDB runtime when available, then launches the API and frontend.
4. Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The API runs on port 4000.

The API stores expense dates as `YYYY-MM-DD` calendar dates, and calculates current periods in `Asia/Kolkata`. On this computer, MongoDB data is kept under `%LOCALAPPDATA%\CodexExpenseTracker\data`, outside the project folder. If you use another computer, install MongoDB Community or provide a `MONGODB_URI`.

## Install on a phone

The client includes a Progressive Web App manifest, icons, and service worker. Once deployed to an HTTPS URL, open that URL in Chrome on Android and choose **Install app** or **Add to Home screen** from Chrome's menu. The app shell can open offline after its first load, but expense data still needs the API and database connection. The current localhost URL is only reachable from this computer; a phone install link requires cloud hosting.

## Free hosted setup

The included `render.yaml` prepares one Render web service that serves both the API and built client. To deploy, push this project to a GitHub repository, create a free MongoDB Atlas database, and create a free Render Blueprint from the repository. Set `MONGODB_URI` to the new empty Atlas database connection string and set `APP_PASSWORD` to a strong private password in Render's environment settings. Atlas must allow connections from Render (its free-tier network rule can use `0.0.0.0/0`; use a unique strong database password). `NODE_ENV=production` is configured; the server refuses hosted record access if `APP_PASSWORD` is missing. Localhost remains password-free when `APP_PASSWORD` is unset. Keep the Atlas database empty; local records are not copied.

Render's free web service may sleep when idle. This project folder does not yet have a Git repository or GitHub remote, so an actual public link cannot be created until the code is pushed to GitHub and the Render and Atlas accounts are connected. Enter database and app passwords only in the providers' settings, never in the repository.
