const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSlot = async (data) => {
  const slotDateTime = new Date(data.slotDate);
  slotDateTime.setHours(
    parseInt(data.startTime.split(':')[0]),
    parseInt(data.startTime.split(':')[1])
  );
  
  return prisma.slot.create({
    data: {
      ...data,
      slotDate: slotDateTime
    }
  });
};

const getSlots = async (shopId) => {
  // If shopId is provided, filter by shop; otherwise return all
  const where = shopId ? { shopId } : {};
  
  return prisma.slot.findMany({
    where,
    orderBy: { slotDate: 'asc' }
  });
};

const getTodaySlots = async (shopId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // If shopId is provided, filter by shop
  const where = shopId ? { shopId, slotDate: { gte: today, lt: tomorrow } } : { slotDate: { gte: today, lt: tomorrow } };

  return prisma.slot.findMany({
    where,
    include: {
      assignments: {
        include: {
          user: {
            select: { name: true, rationCardNumber: true }
          }
        }
      }
    },
    orderBy: { slotDate: 'asc' }
  });
};

const generateSchedule = async (days = 7) => {
  const slots = [];
  const now = new Date();
  
  for (let day = 0; day < days; day++) {
    const date = new Date(now);
    date.setDate(now.getDate() + day);
    date.setHours(9, 0, 0, 0); // Start at 9 AM
    
    // Morning, Afternoon, Evening slots
    const slotTimes = [
      { start: '09:00', end: '11:00', max: 20 },
      { start: '14:00', end: '16:00', max: 25 },
      { start: '18:00', end: '20:00', max: 15 }
    ];
    
    for (const slotTime of slotTimes) {
      slots.push({
        slotDate: date,
        startTime: slotTime.start,
        endTime: slotTime.end,
        maxUsers: slotTime.max
      });
    }
  }
  
  return prisma.$transaction(
    slots.map(slot => prisma.slot.create({ data: slot }))
  );
};

module.exports = {
  createSlot,
  getSlots,
  getTodaySlots,
  generateSchedule
};

