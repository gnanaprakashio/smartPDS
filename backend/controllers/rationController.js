const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const allocateRation = async (req, res) => {
  try {
    const { queueId, item, quantity } = req.body;

    // Check inventory
    const inventory = await prisma.inventory.upsert({
      where: { item },
      update: {},
      create: { item, stock: 0, unit: 'kg', minStock: 10 }
    });

    if (inventory.stock < quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${item}` });
    }

    // Update inventory
    await prisma.inventory.update({
      where: { item },
      data: { stock: inventory.stock - quantity }
    });

    // Create distribution
    const ration = await prisma.rationDistribution.create({
      data: {
        item,
        quantity,
        queueId,
        userId: req.user.id
      }
    });

    // Mark queue completed
    await prisma.queueEntry.update({
      where: { id: queueId },
      data: { status: 'COMPLETED' }
    });

    res.status(201).json(ration);
  } catch (error) {
    res.status(500).json({ error: 'Allocation failed' });
  }
};

const getDistributions = async (req, res) => {
  try {
    const distributions = await prisma.rationDistribution.findMany({
      where: { userId: req.user.id },
      include: { queue: true, user: true },
      orderBy: { issueDate: 'desc' }
    });
    res.json(distributions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch distributions' });
  }
};

const getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      orderBy: { stock: 'asc' }
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

const updateInventory = async (req, res) => {
  try {
    const { item, stock } = req.body;
    const inventory = await prisma.inventory.upsert({
      where: { item },
      update: { stock },
      create: { item, stock: 0, unit: 'kg', minStock: 10 }
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Inventory update failed' });
  }
};

module.exports = {
  allocateRation,
  getDistributions,
  getInventory,
  updateInventory
};

