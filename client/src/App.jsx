import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { createSession, deleteSession, getExpenses, getSession, getSummary } from './api/expenses';
import ExpenseForm from './components/ExpenseForm';
import ExpenseRow from './components/ExpenseRow';
import { dateLabel, money, monthLabel, todayKey } from './utils/format';

const categories = ['Food', 'Shopping', 'Travel', 'Other'];
const monthNow = () => todayKey().slice(0, 7);
const yearNow = () => Number(todayKey().slice(0, 4));
const shiftMonth = (month, delta) => { const [year, number] = month.split('-').map(Number); const date = new Date(Date.UTC(year, number - 1 + delta, 1)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`; };

function App() {
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [historyFilter, setHistoryFilter] = useState({ type: 'month', month: monthNow() });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const isHistory = location.pathname === '/history';
  const notify = useCallback((message, error = false) => { setToast({ message, error }); window.setTimeout(() => setToast(null), 3000); }, []);
  const refresh = useCallback(async () => {
    if (!session || (session.passwordRequired && !session.authenticated)) return;
    setLoading(true); setLoadError('');
    try { const [nextSummary, nextExpenses] = await Promise.all([getSummary(), getExpenses(historyFilter)]); setSummary(nextSummary); setExpenses(nextExpenses); }
    catch (error) { setLoadError(error.message); }
    finally { setLoading(false); }
  }, [historyFilter, session]);
  useEffect(() => {
    getSession().then(setSession).catch((error) => setSessionError(error.message)).finally(() => setAuthLoading(false));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const grouped = useMemo(() => expenses.reduce((groups, expense) => { (groups[expense.expenseDate] ||= []).push(expense); return groups; }, {}), [expenses]);
  const closeForm = () => { setFormOpen(false); setEditing(null); };
  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (expense) => { setEditing(expense); setFormOpen(true); };
  const login = async (event) => { event.preventDefault(); setAuthBusy(true); setSessionError(''); try { setSession(await createSession(password)); setPassword(''); } catch (error) { setSessionError(error.message); } finally { setAuthBusy(false); } };
  const logout = async () => { try { await deleteSession(); setSession((current) => ({ ...current, authenticated: false })); } catch (error) { notify(error.message, true); } };
  if (authLoading) return <div className="auth-screen"><div className="auth-card"><span className="brand-icon">d.</span><p>Opening your daybook…</p></div></div>;
  if (sessionError && !session) return <div className="auth-screen"><div className="auth-card"><span className="brand-icon">d.</span><h1>Daybook is unavailable</h1><p>{sessionError}</p><button className="button secondary" onClick={() => window.location.reload()}>Try again</button></div></div>;
  if (session?.passwordRequired && !session.authenticated) return <div className="auth-screen"><form className="auth-card" onSubmit={login}><span className="brand-icon">d.</span><span className="eyebrow">PERSONAL FINANCE</span><h1>Welcome back.</h1><p>Enter your password to open your daybook.</p><label className="field-label" htmlFor="app-password">Password</label><input id="app-password" className="text-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required autoFocus />{sessionError && <span className="auth-error" role="alert">{sessionError}</span>}<button className="button primary" disabled={authBusy}>{authBusy ? 'Signing in…' : 'Sign in'}</button></form></div>;
  return <div className="app-shell"><aside className="sidebar"><Link to="/" className="brand"><span className="brand-icon">d.</span><span>daybook<small>PERSONAL FINANCE</small></span></Link><div className="nav-caption">WORKSPACE</div><nav className="side-nav"><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}><span className="nav-icon">▦</span>Dashboard</NavLink><NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}><span className="nav-icon">◷</span>History</NavLink></nav><div className="sidebar-bottom"><div className="privacy-icon">⌑</div><b>Your money, your records.</b><span>Private and just for you.</span><div className="version">SIMPLE SPENDING, CLEAR MIND</div></div></aside>
    <main className="main-area"><header className="topbar"><div className="mobile-brand"><span className="brand-icon">d.</span> daybook</div><span className="breadcrumb">MY EXPENSES <b>/</b> {isHistory ? 'HISTORY' : 'OVERVIEW'}</span><div className="topbar-actions">{session?.passwordRequired && <button className="button secondary sign-out" onClick={logout}>Sign out</button>}<button className="button primary top-add" onClick={openAdd}><span>＋</span> Add expense</button></div></header>
      <div className="page-content">
        {loadError && <div className="connection-banner" role="alert"><span className="connection-dot">!</span><div><b>Your records aren’t available yet</b><span>{loadError}</span></div><button className="button secondary" onClick={refresh}>Retry</button></div>}
        <Routes>
          <Route path="/" element={<Dashboard summary={summary} loading={loading} onAdd={openAdd} />} />
          <Route path="/history" element={<History filter={historyFilter} setFilter={setHistoryFilter} expenses={expenses} grouped={grouped} loading={loading} loadError={loadError} onEdit={openEdit} onChanged={refresh} notify={notify} />} />
          <Route path="*" element={<Dashboard summary={summary} loading={loading} onAdd={openAdd} />} />
        </Routes>
      </div>
    </main>
    {formOpen && <ExpenseForm expense={editing} onClose={closeForm} onSaved={refresh} notify={notify} />}
    {toast && <div className={`toast ${toast.error ? 'toast-error' : ''}`} role="status"><span>{toast.error ? '!' : '✓'}</span>{toast.message}</div>}
  </div>;
}

function Dashboard({ summary, loading, onAdd }) {
  const month = summary?.month || monthNow();
  return <><div className="page-heading"><div><span className="eyebrow">YOUR SPENDING AT A GLANCE</span><h1>Good to see you.</h1><p>Here’s where your money went.</p></div><div className="current-month"><span>VIEWING MONTH</span><b>{monthLabel(month)}</b></div></div>
    <section className="summary-grid"><SummaryCard label="Spent today" value={summary?.today} note="TODAY SO FAR" icon="◷" loading={loading} /><SummaryCard label="This week" value={summary?.week} note="MONDAY — SUNDAY" icon="⌁" loading={loading} /><SummaryCard label="This month" value={summary?.monthTotal} note={monthLabel(month).toUpperCase()} icon="▤" featured loading={loading} /></section>
    <div className="section-header"><div><span className="eyebrow">A CLOSER LOOK</span><h2>Where it went</h2></div><span className="period-pill">{monthLabel(month)}</span></div>
    <div className="breakdown-grid"><section className="panel payment-panel"><div className="panel-title"><div className="panel-icon">↗</div><div><h3>By payment type</h3><p>How you paid this month</p></div></div>{['Online', 'Offline'].map((method) => <div className="metric-line" key={method}><span><i className={`dot ${method.toLowerCase()}`} />{method}</span><b>{money(summary?.payment?.[method])}</b></div>)}</section>
      <section className="panel category-panel"><div className="panel-title"><div className="panel-icon warm">◈</div><div><h3>By category</h3><p>What you spent on this month</p></div></div><div className="category-list">{categories.map((category, index) => <div className="category-metric" key={category}><div><span className={`category-mark mark-${category.toLowerCase()}`}>{['◉', '◇', '↗', '○'][index]}</span><span>{category}</span></div><b>{money(summary?.categories?.[category])}</b></div>)}</div></section></div>
    <section className="quick-entry"><div className="quick-symbol">＋</div><div><b>Made a purchase?</b><span>Keep your records up to date while it’s fresh.</span></div><button className="button secondary" onClick={onAdd}>Add an expense <span>↗</span></button></section>
  </>;
}

function SummaryCard({ label, value, note, icon, featured, loading }) { return <article className={`summary-card ${featured ? 'featured' : ''}`}><div className="summary-top"><span>{label}</span><span className="summary-icon">{icon}</span></div><strong>{loading || value === undefined ? '—' : money(value)}</strong><span className="summary-note"><i />{note}</span></article>; }

function History({ filter, setFilter, expenses, grouped, loading, loadError, onEdit, onChanged, notify }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const initialYear = filter.type === 'month' ? Number(filter.month.slice(0, 4)) : yearNow();
  const [pickerYear, setPickerYear] = useState(initialYear);
  const [draftMonths, setDraftMonths] = useState([]);
  const month = filter.type === 'month' ? filter.month : monthNow();
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const selectedMonthsLabel = filter.type === 'months' ? filter.months.length ? `${filter.months.length} ${filter.months.length === 1 ? 'month' : 'months'} selected` : 'Select months' : '';
  const periodLabel = filter.type === 'month' ? monthLabel(filter.month) : filter.type === 'year' ? `Calendar year ${yearNow()}` : selectedMonthsLabel;
  const openPicker = () => {
    setPickerYear(filter.type === 'month' ? Number(filter.month.slice(0, 4)) : yearNow());
    setDraftMonths(filter.type === 'months' ? [...filter.months] : [filter.type === 'month' ? filter.month : monthNow()]);
    setPickerOpen(true);
  };
  const toggleDraftMonth = (key) => setDraftMonths((selected) => selected.includes(key) ? selected.filter((monthKey) => monthKey !== key) : [...selected, key].sort());
  const applyMonths = () => { setFilter({ type: 'months', months: [...draftMonths].sort() }); setPickerOpen(false); };
  return <><div className="page-heading history-heading"><div><span className="eyebrow">EVERY LITTLE THING, ACCOUNTED FOR</span><h1>Your history.</h1><p>A clear record of where it all went.</p></div></div>
    <div className="history-filter-area"><div className="history-filter-row"><div className="filter-tabs" aria-label="History period"><button className={filter.type === 'month' ? 'active' : ''} onClick={() => setFilter({ type: 'month', month: monthNow() })}>Month</button><button className={filter.type === 'year' ? 'active' : ''} onClick={() => setFilter({ type: 'year', year: yearNow() })}>This year</button><button className={filter.type === 'months' ? 'active' : ''} onClick={openPicker}>Choose months</button></div>
      {filter.type === 'month' && <div className="month-switcher"><button onClick={() => setFilter({ type: 'month', month: shiftMonth(filter.month, -1) })} aria-label="Previous month">‹</button><b>{monthLabel(filter.month)}</b><button onClick={() => setFilter({ type: 'month', month: shiftMonth(filter.month, 1) })} aria-label="Next month">›</button></div>}
      {filter.type === 'year' && <span className="period-pill">{yearNow()}</span>}
      {filter.type === 'months' && <button className="select-months-button" onClick={openPicker}>▦ &nbsp;{selectedMonthsLabel}</button>}
    </div>
    {pickerOpen && <div className="month-picker"><div className="picker-heading"><b>Choose months</b><button className="icon-button" onClick={() => setPickerOpen(false)} aria-label="Close month picker">×</button></div><div className="picker-year"><button onClick={() => setPickerYear((year) => year - 1)} aria-label="Previous year">‹</button><b>{pickerYear}</b><button onClick={() => setPickerYear((year) => year + 1)} aria-label="Next year">›</button></div><div className="month-options">{Array.from({ length: 12 }, (_, index) => { const key = `${pickerYear}-${String(index + 1).padStart(2, '0')}`; const name = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(`${key}-01T00:00:00Z`)); return <label key={key} className={draftMonths.includes(key) ? 'checked' : ''}><input type="checkbox" checked={draftMonths.includes(key)} onChange={() => toggleDraftMonth(key)} /><span>{name}</span></label>; })}</div><div className="picker-footer"><span>{draftMonths.length} selected</span><button className="button primary" onClick={applyMonths} disabled={!draftMonths.length}>Apply</button></div></div>}</div>
    <section className="history-total"><div><span className="eyebrow">TOTAL SPENT · {periodLabel.toUpperCase()}</span><strong>{money(total)}</strong><span>{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} recorded</span></div><div className="total-decoration">₹</div></section>
    <div className="history-toolbar"><div><span className="eyebrow">YOUR RECORD</span><h2>Expenses by day</h2></div><span className="period-pill">{periodLabel}</span></div>
    {loading && <div className="empty-state">Loading your history…</div>}
    {!loading && !loadError && filter.type === 'months' && filter.months.length === 0 && <div className="empty-state"><div className="empty-art">▦</div><h3>Choose the months to view.</h3><p>Select one or more months to see their combined total and history.</p><button className="button secondary" onClick={openPicker}>Select months</button></div>}
    {!loading && !loadError && filter.type !== 'months' && Object.keys(grouped).length === 0 && <div className="empty-state"><div className="empty-art">◷</div><h3>A fresh page.</h3><p>No expenses in {periodLabel} yet.</p></div>}
    {!loading && !loadError && Object.keys(grouped).length === 0 && filter.type === 'months' && filter.months.length > 0 && <div className="empty-state"><div className="empty-art">◷</div><h3>No expenses in those months.</h3><p>Choose a different month selection to see its history.</p></div>}
    {!loading && !loadError && Object.entries(grouped).map(([date, items]) => <section className="day-group" key={date}><div className="day-heading"><div><b>{dateLabel(date)}</b><span>{new Intl.DateTimeFormat('en-IN', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}</span></div><span className="daily-total">DAY TOTAL <b>{money(items.reduce((sum, item) => sum + item.amount, 0))}</b></span></div><div className="day-items">{items.map((expense) => <ExpenseRow key={expense._id} expense={expense} onEdit={onEdit} onChanged={onChanged} notify={notify} />)}</div></section>)}
    </>;
}

export default App;
