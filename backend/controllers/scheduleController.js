const slotService = require('../services/slotService');
const schedulerService = require('../services/schedulerService');
const otpService = require('../services/otpService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateDailyScheduleAI = async (req, res) => {
  try {
    const { date, slotsPerDay = 6, usersPerSlot = 20 } = req.body;
    const schedule = await schedulerService.generateDailySchedule(
      date ? new Date(date) : new Date(),
      slotsPerDay,
      usersPerSlot
    );
    
    res.status(201).json({
      message: 'AI schedule generated',
      data: schedule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI Schedule generation failed' });
  }
};

const getTodaySchedule = async (req, res) => {
  try {
    // Get shopId from JWT token - PDS Officer sees all, Staff sees their shop
    const shopId = req.user.shopId;
    const slots = await slotService.getTodaySlots(shopId);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today schedule' });
  }
};

const assignSlotsAI = async (req, res) => {
  try {
    const scheduleData = req.body; // From generateDailyScheduleAI
    const assignments = await schedulerService.assignSlots(scheduleData);
    
    res.json({
      message: 'Slots assigned by AI priority',
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Slot assignment failed' });
  }
};

// New Schedule Generation with Dynamic Stock-Based Prioritization
const generateSchedule = async (req, res) => {
  try {
    // Get shopId from JWT token (for staff) or request body (for PDS officer)
    const shopId = req.user.shopId || req.body.shopId;
    
    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Step 1: Fetch inventory for SPECIFIC SHOP
    const inventory = await prisma.inventory.findFirst({
      where: { shopId: shopId }
    });
    
    if (!inventory) {
      return res.status(400).json({ error: `No inventory found for shop: ${shopId}` });
    }

    // Calculate total stock
    const totalStock = inventory.riceStock + inventory.sugarStock + inventory.wheatStock + inventory.oilStock;
    
    // Step 2: Calculate max users based on stock (5kg per user)
    const totalUsersPossible = Math.floor(totalStock / 5);
    
    if (totalUsersPossible === 0) {
      return res.status(400).json({ error: 'Insufficient stock for scheduling' });
    }

    // Safety Check: If stock < 10% → STOP
    // Assume initial stock was higher - use 10% threshold
    const stockPercentage = (totalStock / 100) * 100; // Simplified
    if (totalStock < 10) {
      return res.status(400).json({ error: 'Stock below 10%, scheduling stopped for safety' });
    }

    // Step 3: Fetch ONLY pending users for THIS SHOP
    const allUsers = await prisma.user.findMany({
      where: { 
        status: 'PENDING',
        shopId: shopId  // Filter by shop
      }
    });
    
    if (allUsers.length === 0) {
      return res.status(400).json({ error: 'No pending users to schedule' });
    }

    // Step 4: Count users by card type
    const aayCount = allUsers.filter(u => u.cardType === 'AAY').length;
    const phhCount = allUsers.filter(u => u.cardType === 'PHH').length;
    const nphhCount = allUsers.filter(u => u.cardType === 'NPHH').length;

    // Step 5: Determine which users to include based on stock
    let eligibleUsers = [];
    let stockLevel = '';

    if (totalUsersPossible <= aayCount) {
      // LOW stock → only AAY
      stockLevel = 'LOW';
      eligibleUsers = allUsers.filter(u => u.cardType === 'AAY');
    } else if (totalUsersPossible <= aayCount + phhCount) {
      // MEDIUM stock → AAY + PHH
      stockLevel = 'MEDIUM';
      eligibleUsers = allUsers.filter(u => u.cardType === 'AAY' || u.cardType === 'PHH');
    } else {
      // HIGH stock → AAY + PHH + NPHH
      stockLevel = 'HIGH';
      eligibleUsers = allUsers;
    }

    // Limit to totalUsersPossible
    eligibleUsers = eligibleUsers.slice(0, totalUsersPossible);

    // Step 6: Calculate Final Priority for eligible users
    // Final Priority = Base Priority - (reputation / 200)
    const basePriorityMap = { 'AAY': 1, 'PHH': 2, 'NPHH': 3 };

    const usersWithPriority = eligibleUsers.map(user => {
      const basePriority = basePriorityMap[user.cardType] || 3;
      const finalPriority = basePriority - (user.reputationScore / 200);
      return { ...user, basePriority, finalPriority };
    });

    // Sort by Final Priority (ascending - lower is higher priority)
    usersWithPriority.sort((a, b) => a.finalPriority - b.finalPriority);

    // Step 7: Assign slots with 2-hour slots, 15 cards per slot
    const scheduleDate = new Date();
    const updates = [];
    const cardsPerSlot = 15; // 15 cards per 2-hour slot

    // Helper function to get 2-hour time slot considering lunch break
    const getTimeSlotWithLunchBreak = (slotNumber) => {
      let startHour;
      if (slotNumber === 1) {
        startHour = 9;   // 9:00 - 11:00
      } else if (slotNumber === 2) {
        startHour = 11;  // 11:00 - 13:00 (1PM)
      } else if (slotNumber === 3) {
        startHour = 14;  // 14:00 - 16:00 (skip lunch)
      } else if (slotNumber === 4) {
        startHour = 16;  // 16:00 - 18:00
      } else {
        startHour = 16 + ((slotNumber - 4) * 2);
      }
      const endHour = startHour + 2;
      return `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`;
    };

    for (let i = 0; i < usersWithPriority.length; i++) {
      const user = usersWithPriority[i];
      
      // Each slot = 15 users (2-hour slot)
      const slotNumber = Math.floor(i / cardsPerSlot) + 1;
      
      // Time slots with lunch break: Morning 9AM-1PM, Lunch 1PM-2PM (no slots), Evening 2PM-5PM
      const timeSlot = getTimeSlotWithLunchBreak(slotNumber);

      // Update user with slot info and status
      updates.push(
        prisma.user.update({
          where: { id: user.id },
          data: {
            slotNumber,
            timeSlot,
            scheduleDate,
            status: 'SCHEDULED'
          }
        })
      );
    }

    // Execute all updates
    await prisma.$transaction(updates);

    // Step 8: Create slots for this shop with 2-hour slots, 15 cards per slot
    console.log(`Creating slots for shop: ${shopId}, maxSlots: ${Math.ceil(usersWithPriority.length / cardsPerSlot)}`);
    const maxSlots = Math.ceil(usersWithPriority.length / cardsPerSlot);
    for (let slotNum = 1; slotNum <= maxSlots; slotNum++) {
      let startHour;
      if (slotNum === 1) {
        startHour = 9;   // 9:00 - 11:00
      } else if (slotNum === 2) {
        startHour = 11;  // 11:00 - 13:00 (1PM)
      } else if (slotNum === 3) {
        startHour = 14;  // 14:00 - 16:00 (skip lunch)
      } else if (slotNum === 4) {
        startHour = 16;  // 16:00 - 18:00
      } else {
        startHour = 16 + ((slotNum - 4) * 2);
      }
      
      const slot = await prisma.slot.create({
        data: {
          slotDate: scheduleDate,
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${(startHour + 2).toString().padStart(2, '0')}:00`,
          maxUsers: cardsPerSlot,
          shopId: shopId
        }
      });
      console.log(`Slot created: ${slot.id} for shop: ${shopId} - ${slot.startTime} to ${slot.endTime}`);
    }

    // Step 9: Auto-send OTP to all scheduled users
    const otpResults = [];
    for (const user of usersWithPriority) {
      try {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with OTP
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otp: otp,
            otpExpiry: otpExpiry
          }
        });

        // Send OTP notification
        await otpService.sendOTP(user.phone);

        otpResults.push({ userId: user.id, phone: user.phone, sent: true });
      } catch (otpError) {
        console.error(`Failed to send OTP to ${user.phone}:`, otpError);
        otpResults.push({ userId: user.id, phone: user.phone, sent: false });
      }
    }

    res.json({
      message: 'Dynamic Scheduling Completed',
      shopId,
      stockLevel,
      totalStock,
      totalUsersPossible,
      scheduledUsers: usersWithPriority.length,
      aayScheduled: usersWithPriority.filter(u => u.cardType === 'AAY').length,
      phhScheduled: usersWithPriority.filter(u => u.cardType === 'PHH').length,
      nphhScheduled: usersWithPriority.filter(u => u.cardType === 'NPHH').length,
      maxSlots: maxSlots,
      otpSent: otpResults.filter(r => r.sent).length,
      otpFailed: otpResults.filter(r => !r.sent).length
    });
  } catch (error) {
    console.error('Generate Schedule Error:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
};

module.exports = {
  generateDailyScheduleAI,
  getTodaySchedule,
  assignSlotsAI,
  generateSchedule
};

