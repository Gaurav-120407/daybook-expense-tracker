import mongoose from 'mongoose';

export const CATEGORIES = ['Food', 'Shopping', 'Travel', 'Other'];
export const PAYMENT_METHODS = ['Online', 'Offline'];

const expenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than zero'] },
  description: { type: String, required: true, trim: true, minlength: 1 },
  category: { type: String, required: true, enum: CATEGORIES },
  paymentMethod: { type: String, required: true, enum: PAYMENT_METHODS },
  expenseDate: {
    type: String,
    required: true,
    validate: { validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value, message: 'Enter a valid date' },
  },
}, { timestamps: true });

expenseSchema.index({ expenseDate: -1, createdAt: -1 });
export default mongoose.model('Expense', expenseSchema);
