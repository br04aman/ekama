const isBrowser = typeof window !== 'undefined';

const isLocal = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.'));

const IS_PROD = process.env.NODE_ENV === 'production' && !isLocal;
const PROD_API_URL = 'https://ekama.onrender.com';
const DEV_API_URL = 'http://localhost:3001';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (IS_PROD ? PROD_API_URL : DEV_API_URL);

if (IS_PROD && isBrowser) {
  console.log('[API] Environment: Production');
  console.log(`[API] Using Base URL: ${BASE_URL}`);
}

// Helper to clear invalid auth
const clearInvalidAuth = () => {
  if (isBrowser) {
    try {
      localStorage.removeItem("ekama-auth-v1");
    } catch (e) {
      console.error('[apiFetch] Error clearing auth:', e);
    }
  }
};

export function getImageUrl(imagePath?: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('data:') || imagePath.startsWith('http')) return imagePath;

  // If it starts with /images, it is a static asset in the frontend public folder
  if (imagePath.startsWith('/images')) return imagePath;

  // Otherwise, if it starts with / or is a relative path, we assume it's a backend upload
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // In development, use relative path so Next.js proxy can handle it
  if (!IS_PROD) {
    return cleanPath;
  }
  
  // In production, use full URL
  return `${BASE_URL}${cleanPath}`;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;

  // Try to get token from localStorage for automatic authentication
  let token: string | null = null;
  if (isBrowser) {
    try {
      const raw = localStorage.getItem("ekama-auth-v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.token || null;
      }
    } catch (e) {
      console.error('[apiFetch] Error reading auth token:', e);
    }
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      cache: 'no-store', // Disable caching by default to always get fresh data
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
    });
  } catch (err: any) {
    console.error(`[apiFetch] Network error requesting ${BASE_URL}${path}:`, err?.message || err);
    throw new Error(err?.message || `Network error fetching ${path}`);
  }
  
  let data: any = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }
  
  // Handle 403 Invalid/Expired token
  if (res.status === 403 && isBrowser) {
    clearInvalidAuth();
    // Reload to reset auth state
    window.location.reload();
  }
  
  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed: ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export { BASE_URL };

