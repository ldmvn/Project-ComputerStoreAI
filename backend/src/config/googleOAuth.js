export function getGoogleOAuthConfig() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, JWT_SECRET } = process.env;
  const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
  if (!['http:', 'https:'].includes(frontendUrl.protocol) || frontendUrl.username || frontendUrl.password || frontendUrl.pathname !== '/' || frontendUrl.search || frontendUrl.hash) {
    throw new Error('FRONTEND_URL must be a frontend origin.');
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL || !JWT_SECRET) {
    throw new Error('Google OAuth is not configured.');
  }
  const callback = new URL(GOOGLE_CALLBACK_URL);
  if (!['http:', 'https:'].includes(callback.protocol) || callback.pathname !== '/api/auth/google/callback' || callback.search || callback.hash || callback.username || callback.password) {
    throw new Error('GOOGLE_CALLBACK_URL must point to /api/auth/google/callback.');
  }
  if (process.env.NODE_ENV === 'production' && (callback.protocol !== 'https:' || frontendUrl.protocol !== 'https:')) {
    throw new Error('Google OAuth requires HTTPS in production.');
  }
  return { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, callbackUrl: callback.href, frontendOrigin: frontendUrl.origin, stateSecret: JWT_SECRET, secure: callback.protocol === 'https:' };
}

export function googleFrontendCallback() {
  return new URL('/auth/google/callback', process.env.FRONTEND_URL || 'http://localhost:3000');
}
