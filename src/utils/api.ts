const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    let token = '';
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken') || '';
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const normalizedEndpoint = (BASE_URL.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1'))
        ? cleanEndpoint.replace(/^\/api\/v1/, '')
        : cleanEndpoint;

    const response = await fetch(`${BASE_URL}${normalizedEndpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API Error');
    }

    return response.json();
}
