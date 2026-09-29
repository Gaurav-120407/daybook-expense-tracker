# Daybook — Personal Expense Tracker

Daybook is a responsive personal finance app for recording expenses and seeing where money goes. The dashboard summarizes spending, and History lets you review individual months, a full year, or selected months together.

## Live demo

[Open Daybook](https://daybook-expense-tracker.onrender.com)

The hosted demo uses a single-user password gate and an empty MongoDB Atlas database. Ask the project owner for access to try it. Render's free service can take a little while to wake after inactivity.

## Features

- Add, edit, and delete expenses with amount, date, category, payment type, and description.
- View daily, weekly, and monthly totals on the dashboard.
- Filter history by month, year, or a custom selection of months.
- Compare spending by category and payment type.
- Responsive layout for desktop and mobile.
- Progressive Web App manifest, icons, and service worker for Android Chrome installation.
- Password-protected hosted records; password-free local development by default.

## Tech stack

- React and Vite — frontend
- Express — REST API
- MongoDB and Mongoose — persistence
- Render — hosting; MongoDB Atlas — hosted database

## Run locally

Requirements: Node.js 18+ and a local MongoDB Community server, or your own MongoDB URI.

```bash
npm run install:all
npm run dev
```

Open the client URL printed by Vite. The API runs on port `4000`; the local database defaults to `mongodb://127.0.0.1:27017/expense_tracker`.

To use a different database, copy `server/.env.example` to `server/.env` and set `MONGODB_URI`. Local `.env` files are excluded from Git. Never commit database URIs or app passwords.

## Data and security

- Hosted expense records are stored in MongoDB Atlas and protected by the app password.
- The hosted database starts empty; local records are not copied to it.
- App and database secrets are stored in Render environment settings, not in this repository.
- Local expense data is kept outside the repository under `%LOCALAPPDATA%\\CodexExpenseTracker\\data`.
