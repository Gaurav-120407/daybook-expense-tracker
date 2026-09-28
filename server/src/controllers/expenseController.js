import Expense, { CATEGORIES, PAYMENT_METHODS } from '../models/Expense.js';
import { currentWeekBounds, localDateString, monthBounds } from '../utils/dates.js';

function validateBody(body) {
  const errors = {};
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount greater than zero.';
  if (typeof body.description !== 'string' || !body.description.trim()) errors.description = 'Enter a description.';
  if (!CATEGORIES.includes(body.category)) errors.category = 'Choose a valid category.';
  if (!PAYMENT_METHODS.includes(body.paymentMethod)) errors.paymentMethod = 'Choose Online or Offline.';
  const parsedDate = typeof body.expenseDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.expenseDate) ? new Date(`${body.expenseDate}T00:00:00Z`) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== body.expenseDate) errors.expenseDate = 'Choose a valid date.';
  return { errors, value: { amount, description: body.description?.trim(), category: body.category, paymentMethod: body.paymentMethod, expenseDate: body.expenseDate } };
}

export async function listExpenses(req, res, next) {
  try {
    let dateFilter;
    if (req.query.months !== undefined) {
      const months = req.query.months.split(',').filter(Boolean);
      if (months.some((month) => !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) || months.length > 60) return res.status(400).json({ message: 'Choose valid months.' });
      if (!months.length) return res.json([]);
      dateFilter = { $or: months.map((month) => { const { start, end } = monthBounds(month); return { expenseDate: { $gte: start, $lte: end } }; }) };
    } else if (req.query.year !== undefined) {
      const year = req.query.year;
      if (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 9999) return res.status(400).json({ message: 'Choose a valid year.' });
      dateFilter = { expenseDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } };
    } else {
      const month = req.query.month || localDateString().slice(0, 7);
      const { start, end } = monthBounds(month);
      dateFilter = { expenseDate: { $gte: start, $lte: end } };
    }
    const expenses = await Expense.find(dateFilter).sort({ expenseDate: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) { next(error); }
}

export async function getExpense(req, res, next) {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json(expense);
  } catch (error) { next(error); }
}

export async function createExpense(req, res, next) {
  try {
    const { errors, value } = validateBody(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Check the highlighted fields.', errors });
    const expense = await Expense.create(value);
    res.status(201).json(expense);
  } catch (error) { next(error); }
}

export async function updateExpense(req, res, next) {
  try {
    const { errors, value } = validateBody(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Check the highlighted fields.', errors });
    const expense = await Expense.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json(expense);
  } catch (error) { next(error); }
}

export async function deleteExpense(req, res, next) {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function getSummary(req, res, next) {
  try {
    const today = localDateString();
    const month = today.slice(0, 7);
    const { start: monthStart } = monthBounds(month);
    const { start: weekStart } = currentWeekBounds(today);
    const [todayRows, weekRows, monthRows] = await Promise.all([
      Expense.find({ expenseDate: today }).select('amount'),
      Expense.find({ expenseDate: { $gte: weekStart, $lte: today } }).select('amount'),
      Expense.find({ expenseDate: { $gte: monthStart, $lte: today } }).select('amount category paymentMethod'),
    ]);
    const sum = (rows) => rows.reduce((total, item) => total + item.amount, 0);
    res.json({ month, today: sum(todayRows), week: sum(weekRows), monthTotal: sum(monthRows), payment: { Online: sum(monthRows.filter((row) => row.paymentMethod === 'Online')), Offline: sum(monthRows.filter((row) => row.paymentMethod === 'Offline')) }, categories: Object.fromEntries(CATEGORIES.map((category) => [category, sum(monthRows.filter((row) => row.category === category))])) });
  } catch (error) { next(error); }
}
