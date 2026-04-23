# Bug Fixes - 2026-04-21

## Security Fixes (Critical)

### 1. JWT Secret from Environment Variable
**File:** `backend/auth/jwt.go`
- Moved hardcoded JWT secret to environment variable
- Falls back to default only if `JWT_SECRET` not set
- Updated `.env.example` with JWT_SECRET field

### 2. CORS Configuration
**File:** `backend/main.go`
- Replaced wildcard `Access-Control-Allow-Origin: *` with whitelist
- Reads allowed origins from `ALLOWED_ORIGINS` env variable
- Default: `http://localhost:3000,http://127.0.0.1:3000`

### 3. WebSocket Origin Validation
**File:** `backend/handlers/websocket.go`
- Added proper origin checking in WebSocket upgrader
- Only allows connections from whitelisted origins
- Prevents unauthorized WebSocket connections

## Concurrency Fixes

### 4. Race Condition in Hub
**File:** `backend/handlers/websocket.go`
- Added `sync.RWMutex` to Hub struct
- Protected all `hub.clients` map access with mutex
- Used RLock for reads, Lock for writes

## Architecture Fixes

### 5. Auth Middleware Routing
**File:** `backend/middleware/auth.go`
- Added public paths whitelist (`/api/auth/register`, `/api/auth/login`, `/ws`)
- Fixed middleware to skip auth for public routes
- Prevents accidental blocking of registration/login

### 6. Uploads Directory Initialization
**File:** `backend/main.go`
- Creates all upload directories on server startup
- Directories: `uploads/avatars`, `uploads/files/{image,video,audio}`
- Prevents "directory not found" errors on first upload

## Frontend Fixes

### 7. Hardcoded URLs Removed
**File:** `clients/web/src/App.jsx`
- Removed all `http://localhost:4000` hardcoded URLs
- Now uses relative paths (proxied by Vite)
- Works correctly in production deployments

### 8. Console Logs Cleaned
**File:** `clients/web/src/App.jsx`
- Removed debug console.log statements
- Kept only critical error logging (WebSocket errors)
- Cleaner production code

## Error Handling

### 9. Token Generation Errors
**File:** `backend/handlers/auth.go`
- Added error handling for `auth.GenerateToken()`
- Returns 500 error if token generation fails
- Prevents empty tokens being sent to client

## Build Verification

✅ Frontend builds successfully (291.24 KB)
✅ Backend compiles without errors (use-server.exe)

## Environment Variables

Updated `.env.example`:
```
JWT_SECRET=your-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Testing Recommendations

1. Test with `.env` file containing real JWT secret
2. Verify CORS works only from allowed origins
3. Test WebSocket connections from different origins
4. Upload files to verify directory creation
5. Load test concurrent WebSocket connections

## Production Checklist

- [ ] Generate strong random JWT_SECRET
- [ ] Set ALLOWED_ORIGINS to production domains
- [ ] Enable HTTPS for production
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Set up monitoring
