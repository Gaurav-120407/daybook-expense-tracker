import { useEffect, useState } from 'react';
import { saveExpense } from '../api/expenses';
import { todayKey } from '../utils/format';

const empty = () => ({ amount: '', description: '', category: 'Food', paymentMethod: 'Online', expenseDate: todayKey() });
const categories = ['Food', 'Shopping', 'Travel', 'Other'];

export default function ExpenseForm({ expense, onClose, onSaved, notify }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { setForm(expense ? { ...expense, amount: String(expense.amount) } : empty()); setErrors({}); }, [expense]);
  const change = (event) => { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); setErrors((current) => ({ ...current, [event.target.name]: '' })); };
  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!Number(form.amount) || Number(form.amount) <= 0) next.amount = 'Enter an amount greater than zero.';
    if (!form.description.trim()) next.description = 'Add a short description.';
    if (!form.expenseDate) next.expenseDate = 'Choose an expense date.';
    if (Object.keys(next).length) return setErrors(next);
    setBusy(true);
    try { await saveExpense({ ...form, amount: Number(form.amount) }, expense?._id); onSaved(); onClose(); notify(expense ? 'Expense updated' : 'Expense added'); }
    catch (error) { setErrors(error.fields || {}); notify(error.message, true); }
    finally { setBusy(false); }
  };
  return <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="form-title">
    <div className="dialog-head"><div><span className="eyebrow">EXPENSE DETAILS</span><h2 id="form-title">{expense ? 'Edit expense' : 'Add expense'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
    <form onSubmit={submit} noValidate>
      <label className="field-label" htmlFor="amount">Amount</label><div className={`amount-input ${errors.amount ? 'invalid' : ''}`}><span>₹</span><input id="amount" name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={change} autoFocus /></div>{errors.amount && <small className="field-error">{errors.amount}</small>}
      <label className="field-label" htmlFor="description">What was it for?</label><input className="text-input" id="description" name="description" placeholder="e.g. Chicken biryani" value={form.description} onChange={change} />{errors.description && <small className="field-error">{errors.description}</small>}
      <div className="form-grid"><div><label className="field-label" htmlFor="category">Category</label><select className="text-input" id="category" name="category" value={form.category} onChange={change}>{categories.map((category) => <option key={category}>{category}</option>)}</select></div><div><label className="field-label" htmlFor="expenseDate">Date</label><input className="text-input" id="expenseDate" type="date" name="expenseDate" value={form.expenseDate} onChange={change} />{errors.expenseDate && <small className="field-error">{errors.expenseDate}</small>}</div></div>
      <span className="field-label payment-label">Paid using</span><div className="segmented">{['Online', 'Offline'].map((method) => <button type="button" key={method} className={form.paymentMethod === method ? 'selected' : ''} onClick={() => setForm({ ...form, paymentMethod: method })}>{method === 'Online' ? '↗' : '◌'}&nbsp; {method}</button>)}</div>
      <div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : expense ? 'Save changes' : 'Add expense'} <span>↗</span></button></div>
    </form>
  </section></div>;
}
