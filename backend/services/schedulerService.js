const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CARD_TYPE_WEIGHTS = {
  AAY: 100,
  PHH: 70,
  NPHH: 40
};

const calculatePriorityScore = (user) => {
  const cardWeight = CARD_TYPE_WEIGHTS[user.cardType] || 40;
  const reputationNormalized = user.reputationScore / 100; // 0-1 scale
  
  // Attendance history (completed slots / total slots)
  const attendanceWeight = 0.2; // Default for now

  const score = (cardWeight * 0.5) +
                (reputationNormalized * 0.3) +
                (attendanceWeight * 0.2);

  return score;
};

const getEligibleUsers = async () => {
  return prisma.user.findMany({
    include: {
      slotAssignments: {
        where: {
          status: 'COMPLETED'
        }
      }
    }
  });
};

const generateDailySchedule = async (date = new Date(), slotsPerDay = 6, usersPerSlot = 20) => {
  const users = await getEligibleUsers();
  
  // Calculate priority scores
  const usersWithScore = users.map(user => ({
    ...user,
    priorityScore: calculatePriorityScore(user),
    attendanceHistory: user.slotAssignments.length / 10 // Simplified
  })).sort((a, b) => b.priorityScore - a.priorityScore);

  const schedule = [];
  let userIndex = 0;

  for (let slotIndex = 0; slotIndex < slotsPerDay; slotIndex++) {
    const startHour = 9 + (slotIndex * 2); // 9-11, 11-13, 13-15, etc.
    const endHour = startHour + 2;
    
    const slotUsers = [];
    for (let i = 0; i < usersPerSlot && userIndex < usersWithScore.length; i++, userIndex++) {
      slotUsers.push(usersWithScore[userIndex]);
    }

    schedule.push({
      slotNumber: slotIndex + 1,
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${endHour.toString().padStart(2, '0')}:00`,
      maxUsers: usersPerSlot,
      assignedUsers: slotUsers,
      totalPriority: slotUsers.reduce((sum, u) => sum + u.priorityScore, 0)
    });
  }

  return {
    date: date.toISOString().split('T')[0],
    totalUsersScheduled: usersWithScore.slice(0, slotsPerDay * 20).length,
    averagePriorityScore: usersWithScore.slice(0, 120).reduce((sum, u) => sum + u.priorityScore, 0) / 120,
    schedule
  };
};

const assignSlots = async (scheduleData) => {
  // Create slots first
  const slots = [];
  for (const slot of scheduleData.schedule) {
    const slotRecord = await prisma.slot.create({
      data: {
        slotDate: new Date(`${scheduleData.date}T${slot.startTime}`),
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxUsers: slot.maxUsers
      }
    });
    slots.push(slotRecord);
  }

  // Assign users to slots
  const assignments = [];
  let slotIndex = 0;
  
  for (let i = 0; i < scheduleData.totalUsersScheduled; i++) {
    const user = await prisma.user.findFirst({
      skip: i,
      take: 1,
      orderBy: { reputationScore: 'desc' }
    });

    if (user && slotIndex < slots.length) {
      const assignment = await prisma.slotAssignment.create({
        data: {
          userId: user.id,
          slotId: slots[slotIndex].id,
          status: 'SCHEDULED'
        }
      });
      assignments.push(assignment);
      
      // Rotate slots
      slotIndex = (slotIndex + 1) % slots.length;
    }
  }

  return assignments;
};

module.exports = {
  calculatePriorityScore,
  generateDailySchedule,
  assignSlots,
  getEligibleUsers
};

