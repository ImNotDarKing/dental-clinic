const fallbackOrigin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:5000';

// В production на Railway, если frontend и backend на одном domain, API должен быть на этом же origin
// Если нет переменной окружения, используем текущий origin (т.е. backend на том же хосте)
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || fallbackOrigin;

console.log('API Base URL:', API_BASE_URL);
console.log('Frontend origin:', typeof window !== 'undefined' ? window.location.origin : 'server-side');

export default API_BASE_URL;
