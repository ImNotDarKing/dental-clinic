const fallbackOrigin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:5000';
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || fallbackOrigin;

console.log('API Base URL:', API_BASE_URL);

export default API_BASE_URL;
