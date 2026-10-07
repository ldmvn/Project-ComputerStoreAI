# Google Login

Uses the existing User table, token.service JWTs, Bearer authentication and frontend auth store. Email/password registration and password recovery keep their existing validation and routes.

## Local configuration

Google Cloud Web Client:

- Authorized JavaScript origin: `http://localhost:3000`. This server redirect implementation does not use Google's browser SDK and does not require this field for the OAuth exchange.
- Authorized redirect URI: `http://localhost:5000/api/auth/google/callback` (exact match).

Fill in `backend/.env` yourself:

```dotenv
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
PORT=5000
CORS_ORIGIN=http://localhost:3000
# Keep existing DATABASE_URL, JWT_SECRET and JWT_EXPIRES_IN.
```

Frontend `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

No `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is needed. Never expose the Google client secret through frontend env. SMTP App Passwords are separate from OAuth credentials.

Apply migration and generate the client, then restart backend/frontend:

```sh
cd backend
npm install
npx prisma migrate deploy
npm run prisma:generate
npm run dev
# In another terminal:
cd frontend
npm run dev
```

On Windows, stop the existing backend before regenerating Prisma if its query-engine DLL is locked. Production must use HTTPS for both URLs. `FRONTEND_URL` is one trusted origin; include it in `CORS_ORIGIN`.

## Routes and flow

1. The browser saves a random verifier and the remember-login choice in sessionStorage, then navigates to `GET /api/auth/google?challenge=...`.
2. Backend sets a signed ten-minute HttpOnly, SameSite=Lax state cookie and redirects to Google with `openid email profile`, a nonce and S256 PKCE. HTTPS deployments use a Secure cookie.
3. `GET /api/auth/google/callback` validates the cookie/state, exchanges the Google code and verifies the ID token signature, issuer, audience, expiry and nonce using `google-auth-library`.
4. A verified email links an existing local User. Existing ID, password, name, role and phone remain intact. A linked Google subject cannot be replaced by a different subject. A new account receives role USER, Google name/avatar, a null phone and an unknown random hashed password. A disabled account cannot sign in.
5. Backend returns to `/auth/google/callback#code=...` with a random one-minute handoff code. Only its hash and the browser challenge are stored in MySQL. No Google token or application JWT is placed in the redirect URL.
6. Frontend immediately removes the fragment and exchanges the code and verifier via `POST /api/auth/google/exchange`. An atomic database delete makes this code single-use, including across concurrent backend processes. The configured frontend Origin is required; cookies are not needed for this POST.
7. Frontend calls the existing store's `login(user, token, rememberMe)` and returns to the originating page (or `/` for standalone auth pages). Header hydration uses the existing `/api/auth/me`.

Callback errors return only fixed public error codes, including cancellation, missing/unverified email, bad state/token, disabled account and missing configuration. API request logging omits OAuth query parameters. Expired exchange rows are removed when issuing the next ticket.

## Validation

```sh
cd backend
npm run test:google-auth
cd ../frontend
npm run build
npm run start -- --port 3100
# Another terminal, frontend directory:
npm run test:google-auth
```

Backend tests use real local MySQL, Express, the existing JWT service and Google's RSA signature verifier with generated test keys. Google authorization/token responses are simulated; no real client secret is required or stored. Browser tests cover success, header updates, persistence/remember-login, failure states, missing initiation and mobile/desktop.

Live Google verification requires your populated backend env and Google Cloud configuration: open `http://localhost:3000/login`, select Google and choose an account; verify the header, reload, then repeat with an existing email and with cancellation. This final consent flow cannot be verified without configured credentials and a user's Google interaction.

Reference: https://developers.google.com/identity/openid-connect/openid-connect
