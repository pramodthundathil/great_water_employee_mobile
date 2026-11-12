import Constants from 'expo-constants';

/**
 * Base URL of the Django REST API.
 * Priority: EXPO_PUBLIC_API_URL env var  >  app.json "extra.apiUrl".
 * On a physical phone use your computer's LAN IP (not 127.0.0.1), e.g.
 *   EXPO_PUBLIC_API_URL=http://192.168.1.10:8000/api/v1 npx expo start
 */
const rawUrl: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://127.0.0.1:8000/api/v1';

export const API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

/** Sign the user out if the app stays in the background longer than this. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
