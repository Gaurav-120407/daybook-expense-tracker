import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Expense API listening on port ${port}`));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB is unavailable. Start MongoDB or update MONGODB_URI.', error.message));
