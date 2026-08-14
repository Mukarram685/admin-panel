const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
    const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API Error');
    }

    return response.json();
}
