import { Router } from 'express';
import { createExpense, deleteExpense, getExpense, getSummary, listExpenses, updateExpense } from '../controllers/expenseController.js';

const router = Router();
router.get('/summary', getSummary);
router.get('/', listExpenses);
router.post('/', createExpense);
router.get('/:id', getExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
export default router;
