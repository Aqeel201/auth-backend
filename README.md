# MediApp Backend

Backend server for MediApp - Signup, Login, and User Management System.

## Features

- 🔐 User Authentication (Signup/Login)
- 📧 Email OTP Verification
- 🔑 Password Reset Flow
- 👤 Profile Management
- 📸 Profile Image Upload
- 🔒 JWT Token Authentication
- 📱 SMS Support (Twilio)
- 👨‍💼 Admin Panel

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas)
- **Authentication:** JWT
- **Email:** Nodemailer (Gmail)
- **SMS:** Twilio
- **File Upload:** Multer

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Gmail account with App Password

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
PORT=3000
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

### Run Locally

```bash
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `PUT /api/auth/update` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/usercount` - Get total user count
- `GET /api/debug/users` - Debug endpoint for users

### Admin
- `PUT /api/users/:id/password` - Update user password (Admin only)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Render.com.

## Project Structure

```
backend/
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env               # Environment variables (not committed)
├── .gitignore         # Git ignore rules
├── public/            # Static files
│   └── Uploads/       # Profile images
├── Uploads/           # Uploaded files
└── DEPLOYMENT.md      # Deployment guide
```

## Security

- Passwords hashed with bcrypt
- JWT token authentication
- Environment variables for sensitive data
- Email OTP verification
- Rate limiting on OTP attempts

## License

ISC

## Author

MediApp Team
