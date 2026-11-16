const raw = import.meta.env.VITE_API_URL;

if (!raw) {
  throw new Error('VITE_API_URL is not set. Copy .env.example to .env and set it.');
}

export const env = { apiUrl: raw.replace(/\/$/, '') } as const;
