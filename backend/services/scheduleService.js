const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateAndNotifyUsers } = require('./verificationService');

/**
 * Dynamic Stock-Based Scheduling Service
 * Automatically schedules users based on available stock
 * 
 * @param {string} shopIdOverride - Optional shop ID to schedule
 * @param {number} delayDays - Days to delay collection date (default from env or 0)
 */
const autoSchedule = async (shopIdOverride = null, delayDays = null) => {
  try {
    // Get configurable delay from env or use provided value
    const configuredDelay = delayDays !== null ? delayDays : parseInt(process.env.SCHEDULE_DELAY_DAYS || '2');
    
    // Calculate collection date (today + delay)
    const collectionDate = new Date();
    collectionDate.setDate(collectionDate.getDate() + configuredDelay);
    
    // Skip Sunday if enabled
    const skipSunday = process.env.SCHEDULE_SKIP_SUNDAY === 'true';
    if (skipSunday && collectionDate.getDay() === 0) { // 0 = Sunday
      collectionDate.setDate(collectionDate.getDate() + 1); // Move to Monday
      console.log('Sunday skipped, collection date moved to Monday');
    }
    
    console.log(`Scheduling with ${configuredDelay} days delay. Collection date: ${collectionDate.toDateString()}`);
    
    // Get shopId from users if no override provided
    let targetShopId = shopIdOverride;
    
    // Fetch inventory to calculate stock
    let inventory;
    if (targetShopId) {
      inventory = await prisma.inventory.findUnique({
        where: { shopId: targetShopId }
      });
    } else {
      // Fallback to first inventory if no shop specified
      inventory = await prisma.inventory.findFirst();
    }
    
    if (!inventory) {
      console.log('No inventory found for shop, skipping scheduling');
      return { success: false, reason: 'No inventory found. Please add inventory first.' };
    }
    
    console.log(`Using inventory for shop ${inventory.shopId}: rice=${inventory.riceStock}kg, wheat=${inventory.wheatStock}kg, sugar=${inventory.sugarStock}kg, oil=${inventory.oilStock}L, toorDal=${inventory.toorDalStock || 0}kg`);

    // ==========================================
    // TNPDS CARD-TYPE SPECIFIC ALLOCATION LOGIC
    // ==========================================
    // Each card type gets ALL items with specific quantities:
    // AAY: rice=35kg, wheat=5kg, sugar=1.5kg, oil=1L, toorDal=1kg
    // PHH: rice=5kg×members, wheat=5kg, sugar=0.5kg, oil=1L, toorDal=1kg
    // NPHH: rice=12kg, wheat=5kg, sugar=0.5kg, oil=1L, toorDal=1kg
    // NPHH_S: rice=0kg, wheat=0kg, sugar=3.5kg, oil=1L, toorDal=1kg
    
    // TNPDS allocation per card type
    const tnpdsAllocations = {
      AAY:   { rice: 35, wheat: 5, sugar: 1.5, oil: 1, toorDal: 1 },
      PHH:   { rice: 5,  wheat: 5, sugar: 0.5, oil: 1, toorDal: 1 },  // × members
      NPHH:  { rice: 12, wheat: 5, sugar: 0.5, oil: 1, toorDal: 1 },
      NPHH_S:{ rice: 0,  wheat: 0, sugar: 3.5, oil: 1, toorDal: 1 }
    };

    // Fetch users who need scheduling
    const userWhere = targetShopId 
      ? { 
          shopId: targetShopId,
          status: { not: 'COMPLETED' }
        }
      : { 
          status: { not: 'COMPLETED' }
        };
    
    const allUsers = await prisma.user.findMany({
      where: userWhere
    });
    
    console.log(`Found ${allUsers.length} users to schedule for shop ${targetShopId || 'all'}`);
    
    if (allUsers.length === 0) {
      console.log('No users to schedule (all completed or collected)');
      return { success: false, reason: 'No users need scheduling' };
    }

    // ==========================================
    // STEP 1: Calculate stock needed for each item if ALL cards are served
    // ==========================================
    // FIXED ALLOCATION PER CARD (not per person)
    const WHEAT_PER_CARD = 5;      // 5kg wheat per card
    const TOORDAL_PER_CARD = 1;    // 1kg toor dal per card
    const OIL_PER_CARD = 1;        // 1L oil per card
    
    let totalRiceNeeded = 0;
    let totalWheatNeeded = 0;
    let totalSugarNeeded = 0;
    let totalOilNeeded = 0;
    let totalToorDalNeeded = 0;

    for (const user of allUsers) {
      const cardType = user.cardType || 'PHH';
      const members = user.members || 1;
      
      // Rice: varies by card type (AAY=35, PHH=5×members, NPHH=12, NPHH_S=0)
      const riceAlloc = { AAY: 35, PHH: 5, NPHH: 12, NPHH_S: 0 };
      const riceForCard = (cardType === 'PHH') ? (riceAlloc.PHH * members) : (riceAlloc[cardType] || 12);
      
      // Sugar: varies by card type (AAY=1.5, PHH/NPHH=0.5, NPHH_S=3.5)
      const sugarAlloc = { AAY: 1.5, PHH: 0.5, NPHH: 0.5, NPHH_S: 3.5 };
      const sugarForCard = sugarAlloc[cardType] || 0.5;
      
      totalRiceNeeded += riceForCard;
      totalWheatNeeded += WHEAT_PER_CARD;  // Fixed 5kg per card
      totalSugarNeeded += sugarForCard;
      totalOilNeeded += OIL_PER_CARD;       // Fixed 1L per card
      totalToorDalNeeded += TOORDAL_PER_CARD; // Fixed 1kg per card
    }

    console.log(`Stock needed for all ${allUsers.length} cards:`);
    console.log(`  Rice: ${totalRiceNeeded}kg, Wheat: ${totalWheatNeeded}kg, Sugar: ${totalSugarNeeded}kg, Oil: ${totalOilNeeded}L, ToorDal: ${totalToorDalNeeded}kg`);
    console.log(`Available stock:`);
    console.log(`  Rice: ${inventory.riceStock}kg, Wheat: ${inventory.wheatStock}kg, Sugar: ${inventory.sugarStock}kg, Oil: ${inventory.oilStock}L, ToorDal: ${inventory.toorDalStock || 0}kg`);

    // ==========================================
    // STEP 2: Calculate max cards possible for EACH item
    // ==========================================
    // Fixed amounts per card
    const aayCount = allUsers.filter(u => (u.cardType || 'PHH') === 'AAY').length;
    const phhCount = allUsers.filter(u => (u.cardType || 'PHH') === 'PHH').length;
    const nphhCount = allUsers.filter(u => (u.cardType || 'PHH') === 'NPHH').length;
    const nphhSCount = allUsers.filter(u => (u.cardType || 'PHH') === 'NPHH_S').length;
    const totalCards = allUsers.length;
    
    // Calculate average rice per card (weighted)
    const avgRicePerCard = (aayCount * 35 + phhCount * 5 + nphhCount * 12 + nphhSCount * 0) / totalCards;
    const avgWheatPerCard = WHEAT_PER_CARD;  // Fixed 5kg per card
    const avgSugarPerCard = (aayCount * 1.5 + phhCount * 0.5 + nphhCount * 0.5 + nphhSCount * 3.5) / totalCards;
    const avgOilPerCard = OIL_PER_CARD;       // Fixed 1L per card
    const avgToorDalPerCard = TOORDAL_PER_CARD; // Fixed 1kg per card

    const maxByRice = inventory.riceStock / avgRicePerCard;
    const maxByWheat = inventory.wheatStock / avgWheatPerCard;
    const maxBySugar = inventory.sugarStock / avgSugarPerCard;
    const maxByOil = inventory.oilStock / avgOilPerCard;
    const maxByToorDal = (inventory.toorDalStock || 0) / avgToorDalPerCard;

    console.log(`Card distribution: AAY=${aayCount}, PHH=${phhCount}, NPHH=${nphhCount}, NPHH_S=${nphhSCount}`);
    console.log(`Per card: Rice=${avgRicePerCard.toFixed(1)}kg (varies), Wheat=${avgWheatPerCard}kg, Sugar=${avgSugarPerCard.toFixed(1)}kg, Oil=${avgOilPerCard}L, ToorDal=${avgToorDalPerCard}kg`);
    console.log(`Max cards by: Rice=${maxByRice.toFixed(1)}, Wheat=${maxByWheat.toFixed(1)}, Sugar=${maxBySugar.toFixed(1)}, Oil=${maxByOil.toFixed(1)}, ToorDal=${maxByToorDal.toFixed(1)}`);

    // LIMITING FACTOR = lowest value determines max cards
    const maxCardsPossible = Math.floor(Math.min(maxByRice, maxByWheat, maxBySugar, maxByOil, maxByToorDal));
    
    console.log(`Total stock can serve: ${maxCardsPossible} cards (limiting factor)`);

    if (maxCardsPossible === 0) {
      console.log('Insufficient stock for scheduling');
      return { success: false, reason: 'Insufficient stock' };
    }

    // Safety Check: If limiting factor < 1 → STOP
    if (maxCardsPossible < 1) {
      console.log('Stock too low, scheduling stopped for safety');
      return { success: false, reason: 'Stock below safety threshold' };
    }

    // ==========================================
    // CARD-BASED SELECTION (TNPDS Priority)
    // ==========================================
    // Selection based on CARD COUNT (limiting factor), not member count
    
    console.log(`Total cards to schedule: ${allUsers.length}`);

    // Priority order: AAY > PHH > NPHH > NPHH_S (TNPDS standards)
    const basePriorityMap = { 'AAY': 1, 'PHH': 2, 'NPHH': 3, 'NPHH_S': 4 };
    
    // Sort all users by priority (card type first, then reputation, then ration card number)
    const sortedUsers = [...allUsers].sort((a, b) => {
      const priorityA = basePriorityMap[a.cardType] || 3;
      const priorityB = basePriorityMap[b.cardType] || 3;
      if (priorityA !== priorityB) return priorityA - priorityB;
      // Same card type → higher reputation first
      const repDiff = (b.reputationScore || 50) - (a.reputationScore || 50);
      if (repDiff !== 0) return repDiff;
      // Same reputation → lower ration card number first (alphabetical)
      return (a.rationCardNumber || '').localeCompare(b.rationCardNumber || '');
    });

    // Card-based selection: take top X cards based on limiting factor
    const selectedCards = sortedUsers.slice(0, maxCardsPossible);
    const pendingCards = sortedUsers.slice(maxCardsPossible);

    // Calculate total members in selected cards
    const totalAllocatedMembers = selectedCards.reduce((sum, u) => sum + (u.members || 1), 0);

    console.log(`Selected: ${selectedCards.length} cards (${totalAllocatedMembers} members)`);
    console.log(`Pending: ${pendingCards.length} cards`);
    
    // Log limiting factor for debugging
    const limits = { rice: maxByRice, wheat: maxByWheat, sugar: maxBySugar, oil: maxByOil, toorDal: maxByToorDal };
    const limitingItem = Object.keys(limits).reduce((a, b) => limits[a] < limits[b] ? a : b);
    console.log(`Limiting factor: ${limitingItem} (${Math.floor(limits[limitingItem])} cards max)`);
    
    // Log what each selected card will receive
    console.log(`Each scheduled card will receive:`);
    console.log(`  AAY: rice=35kg, wheat=5kg, sugar=1.5kg, oil=1L, toorDal=1kg`);
    console.log(`  PHH: rice=5kg×members, wheat=5kg, sugar=0.5kg, oil=1L, toorDal=1kg`);
    console.log(`  NPHH: rice=12kg, wheat=5kg, sugar=0.5kg, oil=1L, toorDal=1kg`);
    console.log(`  NPHH_S: rice=0kg, wheat=0kg, sugar=3.5kg, oil=1L, toorDal=1kg`);

    // Determine stock level for reporting
    let stockLevel = 'HIGH';
    const aaySelected = selectedCards.filter(u => u.cardType === 'AAY').length;
    const phhSelected = selectedCards.filter(u => u.cardType === 'PHH').length;
    const nphhSelected = selectedCards.filter(u => u.cardType === 'NPHH').length;
    
    if (nphhSelected === 0 && phhSelected === 0) stockLevel = 'LOW';
    else if (nphhSelected === 0) stockLevel = 'MEDIUM';

    const eligibleUsers = selectedCards;

    // Calculate Final Priority for slot assignment
    const usersWithPriority = eligibleUsers.map(user => {
      const basePriority = basePriorityMap[user.cardType] || 3;
      const finalPriority = basePriority - (user.reputationScore / 200);
      return { ...user, basePriority, finalPriority };
    });

    // Sort by Final Priority (ascending)
    usersWithPriority.sort((a, b) => a.finalPriority - b.finalPriority);

    // ==========================================
    // CARD-BASED SLOT ASSIGNMENT (Zero Queue System)
    // ==========================================
    // 15 cards per 2-hour slot with lunch break consideration
    // Morning: Slot 1 (9-11), Slot 2 (11-13), Lunch (13-14), Evening: Slot 3 (14-16), Slot 4 (16-18)
    const maxCardsPerSlot = 15; // 15 cards per 2-hour slot
    
    const scheduleDate = collectionDate; // Use collection date with delay
    const updates = [];

    const getTimeSlot = (slotNumber) => {
      let startHour;
      if (slotNumber === 1) {
        // Slot 1: 9:00 - 11:00
        startHour = 9;
      } else if (slotNumber === 2) {
        // Slot 2: 11:00 - 13:00 (1PM)
        startHour = 11;
      } else if (slotNumber === 3) {
        // Slot 3: 14:00 - 16:00 (skip lunch 13:00-14:00)
        startHour = 14;
      } else if (slotNumber === 4) {
        // Slot 4: 16:00 - 18:00 (6PM)
        startHour = 16;
      } else {
        // Additional slots continue from 18:00
        startHour = 16 + ((slotNumber - 4) * 2);
      }
      const endHour = startHour + 2;
      return `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`;
    };

    for (let i = 0; i < usersWithPriority.length; i++) {
      const user = usersWithPriority[i];
      
      // Card-based slot: first 15 cards → Slot 1, next 15 → Slot 2, etc.
      const slotNumber = Math.floor(i / maxCardsPerSlot) + 1;
      
      // Time slots with lunch break consideration
      // Morning: Slot 1-4 (9AM-1PM), Lunch: 1PM-2PM (no slots), Evening: Slot 5-7 (2PM-5PM)
      const timeSlot = getTimeSlot(slotNumber);

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

    // Also update pending cards to PENDING status (clear any previous schedule)
    for (const pendingUser of pendingCards) {
      updates.push(
        prisma.user.update({
          where: { id: pendingUser.id },
          data: {
            slotNumber: null,
            timeSlot: null,
            scheduleDate: null,
            status: 'PENDING'
          }
        })
      );
    }

    // Execute all updates
    await prisma.$transaction(updates);

    // Get the shopId from the first user (they should all have the same shopId)
    const shopId = usersWithPriority[0]?.shopId;
    
    // Create slots for this shop with 2-hour slots, 15 cards per slot
    if (shopId) {
      const maxSlots = Math.ceil(usersWithPriority.length / maxCardsPerSlot);
      console.log(`Creating ${maxSlots} slots for shop: ${shopId} (${maxCardsPerSlot} cards per 2-hour slot)`);
      
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
            maxUsers: maxCardsPerSlot,
            shopId: shopId
          }
        });
        console.log(`Slot created: ${slot.id} for shop: ${shopId} - ${slot.startTime} to ${slot.endTime}`);
      }
    }

    console.log(`Auto-scheduling completed: ${stockLevel} stock level, ${usersWithPriority.length} users scheduled`);

    // Auto-generate OTP and notify users after scheduling
    console.log('Generating OTPs for scheduled users...');
    const otpResult = await generateAndNotifyUsers();

    return {
      success: true,
      stockLevel,
      maxCardsPossible,
      limitingItem,
      stockByItem: {
        rice: inventory.riceStock,
        wheat: inventory.wheatStock,
        sugar: inventory.sugarStock,
        oil: inventory.oilStock,
        toorDal: inventory.toorDalStock || 0
      },
      maxByItem: {
        rice: Math.floor(maxByRice),
        wheat: Math.floor(maxByWheat),
        sugar: Math.floor(maxBySugar),
        oil: Math.floor(maxByOil),
        toorDal: Math.floor(maxByToorDal)
      },
      totalAllocatedMembers,
      scheduledCards: selectedCards.length,
      pendingCards: pendingCards.length,
      delayDays: configuredDelay,
      collectionDate: collectionDate.toISOString().split('T')[0],
      skipSunday: skipSunday,
      aayScheduled: selectedCards.filter(u => u.cardType === 'AAY').length,
      phhScheduled: selectedCards.filter(u => u.cardType === 'PHH').length,
      nphhScheduled: selectedCards.filter(u => u.cardType === 'NPHH').length,
      // New member-based info
      selectedCards: selectedCards.map(c => ({ id: c.id, name: c.name, members: c.members })),
      pendingCards: pendingCards.map(c => ({ id: c.id, name: c.name, members: c.members }))
    };
  } catch (error) {
    console.error('Auto-schedule error:', error);
    return { success: false, reason: error.message };
  }
};

// Auto-mark users as MISSED if their scheduled date has passed
const markMissedUsers = async (shopId = null) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find users with SCHEDULED status and past scheduleDate
    const where = shopId 
      ? { shopId, status: 'SCHEDULED', scheduleDate: { lt: today } }
      : { status: 'SCHEDULED', scheduleDate: { lt: today } };
    
    const missedUsers = await prisma.user.findMany({ where });
    
    if (missedUsers.length === 0) {
      return { success: true, message: 'No missed users found', count: 0 };
    }
    
    // Update status to MISSED
    const updates = missedUsers.map(user =>
      prisma.user.update({
        where: { id: user.id },
        data: { status: 'MISSED' }
      })
    );
    
    await prisma.$transaction(updates);
    
    console.log(`Marked ${missedUsers.length} users as MISSED`);
    
    return {
      success: true,
      message: `Marked ${missedUsers.length} users as MISSED`,
      count: missedUsers.length,
      users: missedUsers.map(u => ({ id: u.id, name: u.name, rationCardNumber: u.rationCardNumber }))
    };
  } catch (error) {
    console.error('Error marking missed users:', error);
    return { success: false, error: error.message };
  }
};

// Auto-reschedule MISSED users to next available slot
const rescheduleMissedUsers = async (shopId = null, delayDays = null) => {
  try {
    // Get delay from config
    const configuredDelay = delayDays !== null ? delayDays : parseInt(process.env.SCHEDULE_DELAY_DAYS || '2');
    
    // Calculate new collection date
    const newCollectionDate = new Date();
    newCollectionDate.setDate(newCollectionDate.getDate() + configuredDelay);
    
    // Skip Sunday
    const skipSunday = process.env.SCHEDULE_SKIP_SUNDAY === 'true';
    if (skipSunday && newCollectionDate.getDay() === 0) {
      newCollectionDate.setDate(newCollectionDate.getDate() + 1);
    }
    
    // Find MISSED users
    const where = shopId 
      ? { shopId, status: 'MISSED' }
      : { status: 'MISSED' };
    
    const missedUsers = await prisma.user.findMany({ where });
    
    if (missedUsers.length === 0) {
      return { success: true, message: 'No missed users to reschedule', count: 0 };
    }
    
    // Get inventory for stock check
    const inventory = shopId 
      ? await prisma.inventory.findUnique({ where: { shopId } })
      : await prisma.inventory.findFirst();
    
    if (!inventory) {
      return { success: false, error: 'No inventory found' };
    }
    
    // FIXED ALLOCATION PER CARD (not per person)
    const WHEAT_PER_CARD = 5;      // 5kg wheat per card
    const TOORDAL_PER_CARD = 1;    // 1kg toor dal per card
    const OIL_PER_CARD = 1;        // 1L oil per card
    
    // Calculate average per card for limiting factor
    const avgRicePerCard = 12; // Average rice (simplified)
    const avgSugarPerCard = 0.5; // Average sugar
    
    const maxByRice = inventory.riceStock / avgRicePerCard;
    const maxByWheat = inventory.wheatStock / WHEAT_PER_CARD;
    const maxBySugar = inventory.sugarStock / avgSugarPerCard;
    const maxByOil = inventory.oilStock / OIL_PER_CARD;
    const maxByToorDal = (inventory.toorDalStock || 0) / TOORDAL_PER_CARD;
    
    // Card-based limit (not member-based)
    const maxCardsPossible = Math.floor(Math.min(maxByRice, maxByWheat, maxBySugar, maxByOil, maxByToorDal));
    
    // Sort by priority (AAY > PHH > NPHH > NPHH_S)
    const priorityMap = { 'AAY': 1, 'PHH': 2, 'NPHH': 3, 'NPHH_S': 4 };
    const sortedUsers = [...missedUsers].sort((a, b) => {
      const pA = priorityMap[a.cardType] || 3;
      const pB = priorityMap[b.cardType] || 3;
      return pA - pB;
    });
    
    // Select top X cards based on limiting factor
    const toReschedule = sortedUsers.slice(0, maxCardsPossible);
    
    // Assign new slots with 2-hour slots, 15 cards per slot
    const maxCardsPerSlot = 15;
    const getRescheduleTimeSlot = (slotNumber) => {
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
    
    const updates = toReschedule.map((user, index) => {
      const slotNumber = Math.floor(index / maxCardsPerSlot) + 1;
      const timeSlot = getRescheduleTimeSlot(slotNumber);
      
      return prisma.user.update({
        where: { id: user.id },
        data: {
          slotNumber,
          timeSlot,
          scheduleDate: newCollectionDate,
          status: 'SCHEDULED'
        }
      });
    });
    
    await prisma.$transaction(updates);
    
    console.log(`Rescheduled ${toReschedule.length} missed users for ${newCollectionDate.toDateString()}`);
    
    // Send OTP notifications to newly rescheduled users
    let otpResults = null;
    if (toReschedule.length > 0) {
      try {
        console.log(`Sending OTP notifications to ${toReschedule.length} rescheduled users...`);
        otpResults = await generateAndNotifyUsers();
        console.log(`OTP notification complete: ${otpResults?.count || 0} users notified`);
      } catch (otpError) {
        console.error('Error sending OTP to rescheduled users:', otpError);
        // Don't fail the whole operation if OTP fails
      }
    }
    
    return {
      success: true,
      message: `Rescheduled ${toReschedule.length} missed users`,
      rescheduled: toReschedule.length,
      stillPending: missedUsers.length - toReschedule.length,
      newCollectionDate: newCollectionDate.toISOString().split('T')[0],
      otpNotified: otpResults?.count || 0
    };
  } catch (error) {
    console.error('Error rescheduling missed users:', error);
    return { success: false, error: error.message };
  }
};

const getTodaySummary = async (shopId = null) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = shopId 
      ? { shopId, scheduleDate: { gte: today, lt: tomorrow } }
      : { scheduleDate: { gte: today, lt: tomorrow } };

    const todayUsers = await prisma.user.findMany({
      where,
      select: { status: true }
    });

    const totalScheduled = todayUsers.length;
    const collected = todayUsers.filter(u => u.status === 'COMPLETED').length;
    const pending = todayUsers.filter(u => u.status === 'SCHEDULED').length;
    const missed = todayUsers.filter(u => u.status === 'MISSED').length;
    
    const completionRate = totalScheduled > 0 
      ? Math.round((collected / totalScheduled) * 100) 
      : 0;

    return {
      totalScheduled,
      collected,
      pending,
      missed,
      completionRate
    };
  } catch (error) {
    console.error('Error getting today summary:', error);
    return { totalScheduled: 0, collected: 0, pending: 0, missed: 0, completionRate: 0 };
  }
};

module.exports = {
  autoSchedule,
  markMissedUsers,
  rescheduleMissedUsers,
  getTodaySummary
};
