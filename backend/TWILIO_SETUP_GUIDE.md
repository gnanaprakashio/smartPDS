# Twilio Setup Guide for SmartPDS

## Current Status
⚠️ **Twilio is not properly configured.** The system will work in **console mode** - OTPs will be displayed in the backend console instead of being sent via SMS.

## Why the Error Occurred
The error `accountSid must start with AC` means the Twilio Account SID in your `.env` file is invalid. Valid Twilio Account SIDs always start with "AC".

**Current (Invalid) Value:**
```
TWILIO_ACCOUNT_SID=yAC8c2152e61236d6d1836f69380f9fd14a
```

This appears to be a placeholder or test value, not a real Twilio Account SID.

---

## How to Get Real Twilio Credentials

### Step 1: Create a Twilio Account

1. Go to https://www.twilio.com/
2. Click "Sign up" or "Try Twilio for Free"
3. Fill in your details:
   - Email address
   - Password
   - First and Last name
4. Verify your email address
5. Complete phone verification

### Step 2: Get Your Credentials

After logging in to Twilio Console:

1. **Navigate to Dashboard:**
   - Go to https://console.twilio.com/
   - You'll see your Account Info section

2. **Copy Your Credentials:**
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (starts with AC)
   Auth Token: Click "Show" to reveal, then copy
   ```

### Step 3: Get a Twilio Phone Number

1. **Navigate to Phone Numbers:**
   - In Twilio Console, go to "Phone Numbers" → "Manage" → "Buy a number"
   - Or visit: https://console.twilio.com/us1/develop/phone-numbers/manage/search

2. **Select Country:**
   - Choose "India" for Indian phone numbers
   - Or choose your target country

3. **Search and Buy:**
   - Search for available numbers
   - Select a number with SMS capability
   - Click "Buy" (Free trial accounts get one free number)

4. **Copy Your Number:**
   - Format: `+91XXXXXXXXXX` (for India)
   - Or: `+1XXXXXXXXXX` (for US)

### Step 4: Update Your .env File

Replace the placeholder values in `smartPDS/backend/.env`:

```env
# Replace these with your actual Twilio credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+91XXXXXXXXXX
```

**Example with real format:**
```env
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcd
TWILIO_AUTH_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
TWILIO_PHONE_NUMBER=+919876543210
```

### Step 5: Verify Phone Numbers (Trial Account Only)

If you're using a **free trial account**, you can only send SMS to verified phone numbers:

1. **Navigate to Verified Caller IDs:**
   - Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified

2. **Add Phone Numbers:**
   - Click "Add a new number"
   - Enter the phone number you want to test with
   - Verify via SMS or voice call

3. **Test Numbers:**
   - Add all test phone numbers from your database
   - Example: `9876543210`, `9876543211`, etc.

### Step 6: Restart Your Server

After updating `.env`:

```bash
# Stop the server (Ctrl+C)
# Restart it
npm run dev
```

You should see:
```
✅ Twilio SMS service initialized successfully
```

---

## Working Without Twilio (Console Mode)

The system is designed to work even without Twilio credentials. When Twilio is not configured:

### What Happens:
1. OTPs are generated normally
2. OTPs are stored in the database
3. **OTPs are displayed in the backend console** instead of being sent via SMS
4. You can still test the complete OTP flow

### Console Output Example:
```
============================================================
📱 OTP for Rajesh Kumar (9876543210)
   OTP Code: 123456
   Expires: 3/26/2026, 1:35:00 PM
============================================================
```

### Testing in Console Mode:

1. **Send OTP Request:**
   ```bash
   curl -X POST http://localhost:5000/api/otp/send \
     -H "Content-Type: application/json" \
     -d '{"phone": "9876543210"}'
   ```

2. **Check Backend Console:**
   - Look for the OTP code in the console output
   - Copy the 6-digit code

3. **Verify OTP:**
   ```bash
   curl -X POST http://localhost:5000/api/otp/verify \
     -H "Content-Type: application/json" \
     -d '{"phone": "9876543210", "otp": "123456"}'
   ```

---

## Twilio Trial Account Limitations

### Free Trial Includes:
- $15.50 USD trial credit
- One free phone number
- SMS to verified numbers only
- Voice calls to verified numbers only

### Limitations:
- ⚠️ Can only send SMS to **verified phone numbers**
- ⚠️ SMS includes "Sent from your Twilio trial account" prefix
- ⚠️ Limited to trial credit amount
- ⚠️ Some features restricted

### Trial SMS Format:
```
Sent from your Twilio trial account - Your Smart PDS verification OTP is 123456. Valid for 5 minutes. Do not share this code with anyone.
```

---

## Upgrading to Production

### When to Upgrade:
- Need to send SMS to any phone number (not just verified)
- Want to remove "trial account" prefix from messages
- Need higher volume of messages
- Ready for production deployment

### How to Upgrade:
1. **Add Funds:**
   - Go to Billing → Add Funds
   - Add credit card and funds

2. **Upgrade Account:**
   - Follow Twilio's upgrade process
   - Complete business verification if required

3. **Benefits:**
   - Send SMS to any phone number
   - No trial prefix in messages
   - Higher rate limits
   - Access to all features

### Pricing (India):
- **SMS (Outbound):** ~₹0.50 - ₹1.00 per message
- **Phone Number:** ~₹100 - ₹200 per month
- Check current pricing: https://www.twilio.com/pricing

---

## Troubleshooting

### Error: "accountSid must start with AC"
**Solution:** Your Account SID is invalid. Get the correct one from Twilio Console.

### Error: "Unable to create record: The number is unverified"
**Solution:** 
- You're using a trial account
- Verify the recipient phone number in Twilio Console
- Or upgrade to a paid account

### Error: "Authenticate"
**Solution:** Your Auth Token is incorrect. Copy it again from Twilio Console.

### Error: "The 'From' number is not a valid phone number"
**Solution:** Your TWILIO_PHONE_NUMBER is incorrect. Use the format `+919876543210`.

### OTP Not Received
**Check:**
1. Phone number is verified (trial accounts)
2. Phone number format is correct (+91 for India)
3. Twilio account has sufficient balance
4. Check Twilio Console → Monitor → Logs for delivery status

---

## Alternative: Using Console Mode for Development

For development and testing, you can continue using **console mode** without Twilio:

### Advantages:
- ✅ No cost
- ✅ No phone number verification needed
- ✅ Instant OTP delivery (in console)
- ✅ Easy to test and debug
- ✅ No external dependencies

### Disadvantages:
- ❌ Not suitable for production
- ❌ Users won't receive SMS
- ❌ Requires access to backend console

### Recommendation:
- **Development:** Use console mode
- **Staging/Testing:** Use Twilio trial with verified numbers
- **Production:** Use Twilio paid account

---

## Summary

### Current Setup:
- ⚠️ Twilio credentials are invalid/placeholder
- ✅ System works in console mode
- ✅ OTPs displayed in backend console
- ✅ Full OTP flow functional

### To Enable SMS:
1. Create Twilio account
2. Get Account SID (starts with AC)
3. Get Auth Token
4. Get Twilio phone number
5. Update `.env` file
6. Restart server

### For Production:
1. Upgrade Twilio account
2. Add payment method
3. Remove phone verification requirement
4. Monitor usage and costs

---

**Need Help?**
- Twilio Documentation: https://www.twilio.com/docs
- Twilio Support: https://support.twilio.com/
- SmartPDS OTP Guide: See `OTP_INTEGRATION_GUIDE.md`
