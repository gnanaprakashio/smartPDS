const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple AI priority score (can be enhanced with ML)
const calculatePriorityScore = (familySize, needs = '') => {
  let score = familySize * 0.3;
  if (needs.toLowerCase().includes('medical') || needs.toLowerCase().includes('disabled')) {
    score += 0.4;
  }
  if (familySize >= 5) score += 0.2;
  return Math.min(score, 1.0);
};

const createQueue = async (req, res) => {
  try {
    const { familySize, needs } = req.body;
    const userId = req.user.id;

    const score = calculatePriorityScore(familySize, needs);

    // Get current queue length for position
    const queueCount = await prisma.queueEntry.count({
      where: { status: 'PENDING' }
    });

    const queueEntry = await prisma.queueEntry.create({
      data: {
        familySize,
        priorityScore: score,
        needs,
        position: queueCount + 1,
        userId
      }
    });

    // Reorder positions based on priority (bubble up high priority)
    await reorderQueue();

    res.status(201).json(queueEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create queue' });
  }
};

const getQueues = async (req, res) => {
  try {
    const queues = await prisma.queueEntry.findMany({
      where: { userId: req.user.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(queues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queues' });
  }
};

const getAllQueues = async (req, res) => {
  try {
    const queues = await prisma.queueEntry.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'asc' }]
    });
    res.json(queues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all queues' });
  }
};

const updateQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const queue = await prisma.queueEntry.update({
      where: { id },
      data: { status }
    });

    if (status === 'COMPLETED') {
      await reorderQueue();
    }

    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update queue' });
  }
};

const reorderQueue = async () => {
  const pendingQueues = await prisma.queueEntry.findMany({
    where: { status: 'PENDING' },
    orderBy: [{ priorityScore: 'desc' }, { createdAt: 'asc' }]
  });

  for (let i = 0; i < pendingQueues.length; i++) {
    await prisma.queueEntry.update({
      where: { id: pendingQueues[i].id },
      data: { position: i + 1 }
    });
  }
};

module.exports = {
  createQueue,
  getQueues,
  getAllQueues,
  updateQueueStatus
};

