# Rental-House Configuration Variables

## Backend Environment Variables (.env)

### Server Configuration
- `PORT=5000` - Server port number
- `NODE_ENV=production` - Environment mode (development/production)

### Database
- `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ieaf4qp.mongodb.net/renter?retryWrites=true&w=majority` - MongoDB Atlas connection string

### JWT Security
- `JWT_ACCESS_SECRET=your_jwt_access_secret_change_in_production` - Secret for access tokens
- `JWT_REFRESH_SECRET=your_jwt_refresh_secret_change_in_production` - Secret for refresh tokens
- `JWT_ACCESS_EXPIRY=15m` - Access token expiration time
- `JWT_REFRESH_EXPIRY=7d` - Refresh token expiration time

### Google OAuth (Optional)
- `GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com` - Google OAuth client ID

### Frontend URLs
- `CLIENT_URL=https://your-frontend.vercel.app` - Frontend deployment URL
- `FRONTEND_URL=https://your-frontend.vercel.app` - Alternative frontend URL

### Cloudinary (Media Storage)
- `CLOUDINARY_CLOUD_NAME=your_cloud_name` - Cloudinary cloud name
- `CLOUDINARY_API_KEY=your_api_key` - Cloudinary API key
- `CLOUDINARY_API_SECRET=your_api_secret` - Cloudinary API secret

### SMTP Email Configuration
- `SMTP_HOST=smtp.gmail.com` - SMTP server host
- `SMTP_PORT=587` - SMTP server port
- `SMTP_USER=your_email@gmail.com` - SMTP username
- `SMTP_PASS=your_app_password` - SMTP password/app password

### Payment Gateways (Optional)
- `CHAPA_SECRET_KEY=your_chapa_key` - Chapa payment gateway secret
- `TELEBIRR_API_KEY=your_telebirr_key` - Telebirr API key
- `MPESA_CONSUMER_KEY=your_consumer_key` - M-Pesa consumer key
- `MPESA_CONSUMER_SECRET=your_consumer_secret` - M-Pesa consumer secret
- `MPESA_PASSKEY=your_passkey` - M-Pesa passkey
- `MPESA_SHORTCODE=174379` - M-Pesa shortcode

---

## Frontend Environment Variables (.env)

### API Configuration
- `VITE_API_URL=https://your-backend-api.onrender.com/api` - Backend API base URL

### Google Sign-In
- `VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com` - Google OAuth client ID

---

## Deployment Platforms

### Vercel (Frontend)
Set these in Vercel Dashboard → Project Settings → Environment Variables:
- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`

### Render (Backend)
Set these in Render Dashboard → Environment:
- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRY`
- `JWT_REFRESH_EXPIRY`
- `GOOGLE_CLIENT_ID`
- `CLIENT_URL`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `CHAPA_SECRET_KEY`
- `TELEBIRR_API_KEY`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_PASSKEY`
- `MPESA_SHORTCODE`

---

## Required vs Optional Variables

### Required (Must be set for app to work)
- Backend: `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `FRONTEND_URL`
- Frontend: `VITE_API_URL`

### Optional (Optional features)
- Backend: `GOOGLE_CLIENT_ID`, Cloudinary variables, SMTP variables, Payment gateway variables
- Frontend: `VITE_GOOGLE_CLIENT_ID`

---

## Security Notes

1. Never commit actual `.env` files to version control
2. Use strong, random secrets for JWT tokens
3. Rotate secrets regularly in production
4. Use different secrets for development and production
5. Keep MongoDB URI credentials secure
6. Store API keys in environment variables, not in code
