import { useState } from 'react';
import { removeExpense } from '../api/expenses';
import { money } from '../utils/format';

export default function ExpenseRow({ expense, onEdit, onChanged, notify }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const remove = async () => { setBusy(true); try { await removeExpense(expense._id); onChanged(); notify('Expense deleted'); } catch (error) { notify(error.message, true); } finally { setBusy(false); setConfirm(false); } };
  return <>
    <article className="expense-row"><div className={`category-mark mark-${expense.category.toLowerCase()}`}>{expense.category === 'Food' ? '◉' : expense.category === 'Shopping' ? '◇' : expense.category === 'Travel' ? '↗' : '○'}</div><div className="expense-info"><strong>{expense.description}</strong><span>{expense.category}<i>·</i>{expense.paymentMethod}</span></div><strong className="expense-amount">{money(expense.amount)}</strong><div className="row-actions"><button onClick={() => onEdit(expense)} aria-label={`Edit ${expense.description}`} title="Edit">✎</button><button onClick={() => setConfirm(true)} aria-label={`Delete ${expense.description}`} title="Delete">⌫</button></div></article>
    {confirm && <div className="scrim"><section className="dialog confirm-dialog" role="alertdialog" aria-modal="true"><span className="eyebrow">REMOVE EXPENSE</span><h2>Delete this expense?</h2><p><b>{money(expense.amount)}</b> — {expense.description}</p><p className="muted">This can’t be undone.</p><div className="form-actions"><button className="button secondary" onClick={() => setConfirm(false)}>Keep it</button><button className="button danger" onClick={remove} disabled={busy}>{busy ? 'Deleting…' : 'Delete expense'}</button></div></section></div>}
  </>;
}
