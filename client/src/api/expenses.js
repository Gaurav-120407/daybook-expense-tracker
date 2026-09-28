const API = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } }); }
  catch { throw new Error('Can’t reach the server. Check that the app is running and try again.'); }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || 'Something went wrong. Please try again.');
    error.fields = body.errors || {};
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export const getSummary = () => request('/expenses/summary');
export const getSession = () => request('/session');
export const createSession = (password) => request('/session', { method: 'POST', body: JSON.stringify({ password }) });
export const deleteSession = () => request('/session', { method: 'DELETE' });
export const getExpenses = (filter) => {
  if (typeof filter === 'string') return request(`/expenses?month=${filter}`);
  if (filter.type === 'year') return request(`/expenses?year=${filter.year}`);
  if (filter.type === 'months') return filter.months.length ? request(`/expenses?months=${filter.months.join(',')}`) : Promise.resolve([]);
  return request(`/expenses?month=${filter.month}`);
};
export const saveExpense = (expense, id) => request(`/expenses${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(expense) });
export const removeExpense = (id) => request(`/expenses/${id}`, { method: 'DELETE' });
