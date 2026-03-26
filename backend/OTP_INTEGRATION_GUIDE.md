# Twilio OTP Integration Guide

## Overview
The SmartPDS system now uses Twilio SMS to send OTP (One-Time Password) verification codes to users' registered phone numbers.

## Features Implemented

### 1. **OTP Generation**
- Generates secure 6-digit OTP codes
- OTPs expire after 5 minutes
- Stored in database with user association

### 2. **Twilio SMS Integration**
- Sends OTP via Twilio SMS API
- Automatic phone number formatting (supports Indian numbers)
- Fallback console logging for development/testing

### 3. **OTP Verification**
- Validates OTP against stored values
- Checks expiration time
- Marks OTP as verified after successful validation
- Returns JWT token for authenticated session

### 4. **Error Handling**
- Invalid phone numbers
- Expired OTPs
- Twilio API failures
- User not found errors

---

## Environment Variables

Ensure these variables are set in your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# JWT Secret for token generation
JWT_SECRET=your_jwt_secret_here
```

**Current Configuration:**
- TWILIO_ACCOUNT_SID: `yAC8c2152e61236d6d1836f69380f9fd14a`
- TWILIO_AUTH_TOKEN: `eb44034d003f6ad3a56e9689de5368f7`
- TWILIO_PHONE_NUMBER: `+13187688107`

---

## API Endpoints

### 1. Send OTP
**Endpoint:** `POST /api/otp/send`

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

**Supported Phone Formats:**
- `9876543210` (10-digit Indian number - auto-formatted to +919876543210)
- `919876543210` (12-digit with country code - auto-formatted to +919876543210)
- `+919876543210` (International format - used as-is)

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your registered phone number",
  "expiresAt": "2026-03-26T08:00:00.000Z"
}
```

**Error Responses:**
```json
// User not found
{
  "success": false,
  "error": "User not found with this phone number"
}

// Twilio SMS failure
{
  "success": false,
  "error": "Failed to send SMS. Please check phone number format or Twilio configuration.",
  "details": "Twilio error message"
}
```

---

### 2. Verify OTP
**Endpoint:** `POST /api/otp/verify`

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "phone": "9876543210",
    "rationCardNumber": "CARD123456"
  }
}
```

**Error Responses:**
```json
// Invalid or expired OTP
{
  "success": false,
  "error": "Invalid or expired OTP. Please request a new one."
}

// User not found
{
  "success": false,
  "error": "User not found with this phone number"
}
```

---

### 3. Get Latest OTP (Development Only)
**Endpoint:** `GET /api/otp/latest/:phone`

**Note:** This endpoint is only available in development mode and should be disabled in production.

**Example:** `GET /api/otp/latest/9876543210`

**Success Response (200):**
```json
{
  "success": true,
  "otp": "123456",
  "expiresAt": "2026-03-26T08:00:00.000Z",
  "verified": false
}
```

---

## Testing Instructions

### Prerequisites
1. Ensure PostgreSQL database is running
2. Run migrations: `npx prisma migrate dev`
3. Seed test data: `node scripts/seedData.js`
4. Start backend server: `npm run dev`

### Test Users
The seed script creates sample users with these phone numbers:

**SHOP001 Users:**
- `9876543210` - Rajesh Kumar (AAY)
- `9876543211` - Priya Sharma (PHH)
- `9876543212` - Amit Patel (NPHH)
- `9876543213` - Sunita Devi (AAY)
- `9876543214` - Vijay Singh (PHH)
- `9876543215` - Lakshmi Iyer (NPHH)
- `9876543216` - Mohammed Ali (AAY)
- `9876543217` - Kavita Reddy (PHH)
- `9876543218` - Ravi Verma (NPHH)
- `9876543219` - Anjali Gupta (AAY)

**SHOP002 Users:**
- `9876543220` - Suresh Babu (PHH)
- `9876543221` - Meena Kumari (NPHH)
- `9876543222` - Arjun Rao (AAY)

### Testing with cURL

#### 1. Send OTP
```bash
curl -X POST http://localhost:5000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

#### 2. Get Latest OTP (Development)
```bash
curl http://localhost:5000/api/otp/latest/9876543210
```

#### 3. Verify OTP
```bash
curl -X POST http://localhost:5000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'
```

### Testing with Postman

1. **Send OTP:**
   - Method: POST
   - URL: `http://localhost:5000/api/otp/send`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "phone": "9876543210"
     }
     ```

2. **Check Console/SMS:**
   - If Twilio is configured correctly, you'll receive an SMS
   - Otherwise, check the backend console for the OTP

3. **Verify OTP:**
   - Method: POST
   - URL: `http://localhost:5000/api/otp/verify`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "phone": "9876543210",
       "otp": "123456"
     }
     ```

4. **Use the JWT Token:**
   - Copy the `token` from the verify response
   - Use it in subsequent API calls:
     ```
     Authorization: Bearer <token>
     ```

---

## Twilio Configuration

### Setting Up Twilio

1. **Create Twilio Account:**
   - Go to https://www.twilio.com/
   - Sign up for a free trial account

2. **Get Credentials:**
   - Navigate to Console Dashboard
   - Copy your Account SID and Auth Token
   - Get a Twilio phone number

3. **Verify Phone Numbers (Trial Account):**
   - In trial mode, you can only send SMS to verified phone numbers
   - Go to Phone Numbers → Verified Caller IDs
   - Add and verify the phone numbers you want to test with

4. **Update .env File:**
   ```env
   TWILIO_ACCOUNT_SID=your_actual_account_sid
   TWILIO_AUTH_TOKEN=your_actual_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

### Twilio Trial Limitations

- Can only send SMS to verified phone numbers
- Messages include "Sent from your Twilio trial account" prefix
- Limited number of messages per day

### Upgrading to Production

1. Add funds to your Twilio account
2. Upgrade from trial to paid account
3. Remove phone number verification requirement
4. Messages will no longer include trial prefix

---

## Phone Number Formatting

The system automatically formats phone numbers:

| Input Format | Output Format | Notes |
|--------------|---------------|-------|
| `9876543210` | `+919876543210` | 10-digit Indian number |
| `919876543210` | `+919876543210` | 12-digit with country code |
| `+919876543210` | `+919876543210` | Already formatted |

**Important:** Ensure phone numbers in the database are stored in a consistent format (preferably without country code for Indian numbers).

---

## Security Considerations

1. **OTP Expiration:** OTPs expire after 5 minutes
2. **One-Time Use:** OTPs are marked as verified after successful validation
3. **Rate Limiting:** Consider implementing rate limiting to prevent OTP spam
4. **JWT Tokens:** Tokens expire after 7 days
5. **Environment Variables:** Never commit `.env` file to version control

---

## Troubleshooting

### Issue: "User not found with this phone number"
**Solution:** Ensure the phone number exists in the `users` table. Check with:
```sql
SELECT * FROM users WHERE phone = '9876543210';
```

### Issue: "Failed to send SMS"
**Possible Causes:**
1. Invalid Twilio credentials
2. Phone number not verified (trial account)
3. Insufficient Twilio balance
4. Invalid phone number format

**Solution:**
- Verify Twilio credentials in `.env`
- Check Twilio console for error logs
- Verify phone numbers in Twilio dashboard (trial accounts)
- Check backend console for detailed error messages

### Issue: "Invalid or expired OTP"
**Possible Causes:**
1. OTP has expired (>5 minutes old)
2. Wrong OTP entered
3. OTP already used

**Solution:**
- Request a new OTP
- Check the latest OTP using the debug endpoint (development only)

### Issue: OTP not received via SMS
**Solution:**
1. Check backend console - OTP is logged as fallback
2. Verify Twilio phone number is correct
3. Check if recipient number is verified (trial accounts)
4. Check Twilio console for delivery status

---

## Code Structure

### Files Modified/Created

1. **`services/otpService.js`**
   - Twilio client initialization
   - OTP generation and sending
   - OTP verification logic
   - Phone number formatting

2. **`controllers/otpController.js`**
   - API endpoint handlers
   - Input validation
   - JWT token generation
   - Error handling

3. **`routes/otp.js`**
   - Route definitions
   - Middleware integration

4. **`prisma/schema.prisma`**
   - Added `expiresAt` field to `OtpVerification` model

---

## Next Steps

1. **Implement Rate Limiting:**
   ```javascript
   // Example using express-rate-limit
   const rateLimit = require('express-rate-limit');
   
   const otpLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 3, // 3 requests per window
     message: 'Too many OTP requests, please try again later'
   });
   
   router.post('/send', otpLimiter, sendOTP);
   ```

2. **Add OTP Cleanup Job:**
   ```javascript
   // Run every hour to clean expired OTPs
   setInterval(async () => {
     await otpService.cleanupExpiredOTPs();
   }, 60 * 60 * 1000);
   ```

3. **Implement Resend OTP:**
   - Add cooldown period (e.g., 30 seconds between requests)
   - Track number of resend attempts

4. **Add Logging:**
   - Log all OTP requests and verifications
   - Monitor for suspicious activity

---

## Support

For issues or questions:
1. Check backend console logs
2. Review Twilio console for SMS delivery status
3. Verify environment variables are correctly set
4. Ensure database migrations are up to date

---

**Last Updated:** March 26, 2026
**Version:** 1.0.0
