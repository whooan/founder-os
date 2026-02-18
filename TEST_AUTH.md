# Testing Authentication Locally

## Setup

1. **Set a password** in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   SITE_PASSWORD=mysecretpassword123
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   pnpm dev
   ```

## Test Flow

1. **Visit http://localhost:3000**
   - Should redirect to `/login`

2. **Try wrong password**
   - Enter incorrect password
   - Should show "Invalid password" error

3. **Login with correct password**
   - Enter `mysecretpassword123`
   - Should redirect to home page

4. **Verify session persists**
   - Refresh the page
   - Should stay logged in (cookie persists for 7 days)

5. **Test logout**
   - Click "Logout" button in header
   - Should redirect to `/login`

6. **Test without password set**
   - Remove `SITE_PASSWORD` from `.env.local`
   - Restart dev server
   - Should allow access without login (dev mode fallback)

## Production Behavior

On Railway (or any production deployment):
- **Must set** `SITE_PASSWORD` environment variable
- Without it, the login API returns 500 error
- All pages redirect to `/login` until authenticated
- Session cookie is `httpOnly`, `secure` (HTTPS only), expires in 7 days

## Security Notes

- Password is never stored or logged
- Cookie contains timestamp + hash (not the password)
- Session expires after 7 days
- `httpOnly` cookie prevents JavaScript access
- `secure` flag ensures HTTPS-only in production
