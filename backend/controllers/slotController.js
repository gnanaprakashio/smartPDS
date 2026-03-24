const slotService = require('../services/slotService');

const getSlots = async (req, res) => {
  try {
    // Get shopId from JWT token - PDS Officer sees all, Staff sees their shop
    const shopId = req.user.shopId;
    const slots = await slotService.getSlots(shopId);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

const createSlot = async (req, res) => {
  try {
    // Get shopId from JWT token for staff
    const shopId = req.user.shopId || req.body.shopId;
    
    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }
    
    const slot = await slotService.createSlot({ ...req.body, shopId });
    res.status(201).json({
      message: 'Slot created successfully',
      data: slot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Slot creation failed' });
  }
};

// Delete all slots
const deleteAllSlots = async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const shopId = req.user.shopId || req.body.shopId;
    
    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }
    
    // Delete all slots for the shop
    const result = await prisma.slot.deleteMany({
      where: { shopId }
    });
    
    res.json({
      message: `Deleted ${result.count} slots successfully`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting slots:', error);
    res.status(500).json({ error: 'Failed to delete slots' });
  }
};

module.exports = {
  getSlots,
  createSlot,
  deleteAllSlots
};

