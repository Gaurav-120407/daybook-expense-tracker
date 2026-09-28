# Personal Expense Tracker

A small single-user expense tracker built with React, Vite, Express, and MongoDB.

## Requirements

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB connection URI

## Setup

1. Install the root development dependency and app dependencies: `npm run install:all`
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` if needed.
3. Run `npm run dev` from the project root. It starts the local MongoDB runtime when available, then launches the API and frontend.
4. Open the Vite URL shown in the terminal (normally `http://localhost:5173`; this computer uses `http://localhost:5174` because 5173 is occupied). The API runs on port 4000.

The API stores expense dates as `YYYY-MM-DD` calendar dates, and calculates current periods in `Asia/Kolkata`. On this computer, MongoDB data is kept under `%LOCALAPPDATA%\CodexExpenseTracker\data`, outside the project folder. If you use another computer, install MongoDB Community or provide a `MONGODB_URI`.

## Install on a phone

The client includes a Progressive Web App manifest, icons, and service worker. Once deployed to an HTTPS URL, open that URL in Chrome on Android and choose **Install app** or **Add to Home screen** from Chrome's menu. The app shell can open offline after its first load, but expense data still needs the API and database connection. The current localhost URL is only reachable from this computer; a phone install link requires cloud hosting.

## Free hosted setup

The [private GitHub repository](https://github.com/Gaurav-120407/daybook-expense-tracker) contains the app and its `render.yaml` deployment blueprint. To deploy:

1. In MongoDB Atlas, create a free cluster and a database user with a strong password. To get the first deploy running, temporarily allow `0.0.0.0/0` under **Network Access**. After Render creates the service, copy its outbound IP ranges from **Render → service → Connect → Outbound** and replace the temporary Atlas rule with those ranges. In Atlas **Connect → Drivers**, copy the Node.js connection string and replace its password placeholder.
2. In Render, choose **New → Blueprint**, connect GitHub if prompted, and select `Gaurav-120407/daybook-expense-tracker`.
3. When Render asks for environment values, paste the Atlas URI as `MONGODB_URI` and set a different strong `APP_PASSWORD`. The blueprint sets `NODE_ENV=production`; the app refuses record access if hosted password protection is missing.
4. Wait for Render to finish deploying, then open the HTTPS URL it gives you. Sign in with `APP_PASSWORD`. On Android Chrome, use **⋮ → Install app** or **Add to Home screen**.

The cloud database starts empty; local records are not copied. Localhost stays password-free when `APP_PASSWORD` is unset. Render's free web service may sleep while idle, so its first visit after inactivity can take a little while. Enter database and app passwords only in the providers' settings, never in GitHub.
