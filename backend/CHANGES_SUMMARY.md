# OTP Integration Changes Summary

## Overview
Successfully integrated Twilio SMS for OTP verification in the SmartPDS system.

---

## Files Modified

### 1. **`prisma/schema.prisma`**
**Changes:**
- Added `expiresAt DateTime` field to `OtpVerification` model

**Before:**
```prisma
model OtpVerification {
  id        String   @id @default(cuid())
  userId    String
  otp       String
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())
  ...
}
```

**After:**
```prisma
model OtpVerification {
  id        String   @id @default(cuid())
  userId    String
  otp       String
  verified  Boolean  @default(false)
  expiresAt DateTime  // NEW FIELD
  createdAt DateTime @default(now())
  ...
}
```

---

### 2. **`services/otpService.js`**
**Changes:**
- Integrated Twilio SDK
- Implemented secure 6-digit OTP generation
- Added phone number formatting (supports Indian numbers)
- Implemented SMS sending via Twilio
- Added fallback console logging for development
- Enhanced error handling
- Added cleanup function for expired OTPs

**Key Functions:**
- `generateOTP()` - Generates 6-digit OTP
- `formatPhoneNumber()` - Formats phone to international format
- `sendOTP(phone)` - Sends OTP via Twilio SMS
- `verifyOTP(phone, otp)` - Verifies OTP and returns user data
- `cleanupExpiredOTPs()` - Removes expired OTPs from database

**Features:**
- OTP expires after 5 minutes
- Automatic phone number formatting (+91 for India)
- Twilio error handling with fallback logging
- User lookup by phone number

---

### 3. **`controllers/otpController.js`**
**Changes:**
- Enhanced input validation
- Improved error handling
- Added JWT token generation on successful verification
- Added debug endpoint for development

**Endpoints:**
1. `POST /api/otp/send` - Send OTP to user's phone
2. `POST /api/otp/verify` - Verify OTP and get JWT token
3. `GET /api/otp/latest/:phone` - Get latest OTP (dev only)

**JWT Token:**
- Generated on successful OTP verification
- Expires in 7 days
- Contains userId, phone, and rationCardNumber

---

### 4. **`routes/otp.js`**
**Changes:**
- Added new route for getting latest OTP (development only)

**Routes:**
```javascript
POST   /api/otp/send          // Send OTP
POST   /api/otp/verify        // Verify OTP
GET    /api/otp/latest/:phone // Get latest OTP (dev only)
```

---

## Database Changes

### Migration Created
**Migration Name:** `add_otp_expires_at`

**SQL Changes:**
```sql
ALTER TABLE "otp_verifications" 
ADD COLUMN "expiresAt" TIMESTAMP(3) NOT NULL;
```

---

## Environment Variables Used

```env
TWILIO_ACCOUNT_SID=yAC8c2152e61236d6d1836f69380f9fd14a
TWILIO_AUTH_TOKEN=eb44034d003f6ad3a56e9689de5368f7
TWILIO_PHONE_NUMBER=+13187688107
JWT_SECRET=79457c31b672a4646d3e11d34ee1b030317324d4eab803ac0211c56f195787ec2944782f2426ec79f15017957fc261c16a18ee28a1446564c7518bf68a6d0c57
```

---

## Testing

### Test Users Available
Sample users created by seed script with phone numbers:
- `9876543210` to `9876543219` (SHOP001)
- `9876543220` to `9876543222` (SHOP002)

### Quick Test Commands

**1. Send OTP:**
```bash
curl -X POST http://localhost:5000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

**2. Get OTP (Dev Mode):**
```bash
curl http://localhost:5000/api/otp/latest/9876543210
```

**3. Verify OTP:**
```bash
curl -X POST http://localhost:5000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'
```

---

## Flow Diagram

```
User Request OTP
      ↓
POST /api/otp/send
      ↓
Validate phone number
      ↓
Find user in database
      ↓
Generate 6-digit OTP
      ↓
Store OTP with 5-min expiry
      ↓
Format phone number (+91)
      ↓
Send SMS via Twilio
      ↓
Return success/error
      ↓
User receives SMS
      ↓
POST /api/otp/verify
      ↓
Validate OTP & expiry
      ↓
Mark OTP as verified
      ↓
Generate JWT token
      ↓
Return token & user data
```

---

## Security Features

1. **OTP Expiration:** 5 minutes
2. **One-Time Use:** OTPs marked as verified after use
3. **JWT Authentication:** 7-day token expiry
4. **Phone Validation:** User must exist in database
5. **Error Handling:** No sensitive data in error messages

---

## Next Steps to Deploy

1. **Restart Backend Server:**
   ```bash
   cd smartPDS/backend
   npm run dev
   ```

2. **Verify Twilio Credentials:**
   - Check `.env` file has correct Twilio credentials
   - For trial accounts, verify test phone numbers in Twilio console

3. **Test OTP Flow:**
   - Send OTP to a test user
   - Check SMS delivery or console logs
   - Verify OTP
   - Confirm JWT token is returned

4. **Production Considerations:**
   - Implement rate limiting on OTP endpoints
   - Add OTP cleanup cron job
   - Disable debug endpoint (`/api/otp/latest/:phone`)
   - Monitor Twilio usage and costs
   - Set up proper logging and monitoring

---

## Troubleshooting

### Common Issues:

1. **"User not found"**
   - Ensure phone number exists in users table
   - Check phone number format matches database

2. **"Failed to send SMS"**
   - Verify Twilio credentials
   - Check phone number is verified (trial accounts)
   - Check Twilio balance

3. **"Invalid or expired OTP"**
   - OTP expires after 5 minutes
   - Request new OTP
   - Check system time is correct

---

## Documentation

Comprehensive guide available at:
- **[OTP_INTEGRATION_GUIDE.md](./OTP_INTEGRATION_GUIDE.md)** - Complete testing and usage guide

---

**Implementation Date:** March 26, 2026
**Status:** ✅ Complete and Ready for Testing
