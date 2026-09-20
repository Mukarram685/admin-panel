const LIVE_BACKEND_URL = ' http://localhost:5000/api/v1';
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || LIVE_BACKEND_URL;
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    let token = '';
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken') || '';
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) || {}),
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const executeFetch = async (baseUrl: string) => {
        const normalizedBase = baseUrl.replace(/\/+$/, '');
        const normalizedEndpoint = (normalizedBase.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1'))
            ? cleanEndpoint.replace(/^\/api\/v1/, '')
            : cleanEndpoint;

        return await fetch(`${normalizedBase}${normalizedEndpoint}`, {
            ...options,
            headers,
        });
    };

    let response: Response;
    try {
        response = await executeFetch(BASE_URL);
    } catch (networkErr: any) {
        // If primary URL failed (e.g. localhost is down) and differs from live backend, retry with live backend
        if (BASE_URL !== LIVE_BACKEND_URL) {
            console.warn(`[fetchAPI] Primary API at ${BASE_URL} unreachable. Retrying with live backend: ${LIVE_BACKEND_URL}`);
            try {
                response = await executeFetch(LIVE_BACKEND_URL);
            } catch {
                throw new Error(`Unable to connect to server. Please check your network connection or local backend server.`);
            }
        } else {
            throw new Error(`Unable to connect to server at ${BASE_URL}. Please check your network connection.`);
        }
    }

    if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error (${response.status})`);
    }

    return response.json();
}
