const inventoryService = require('../services/inventoryService');
const scheduleService = require('../services/scheduleService');
const verificationService = require('../services/verificationService');

const updateInventory = async (req, res) => {
  try {
    const { shopId, reschedule } = req.body;
    const updateData = {
      riceStock: req.body.riceStock,
      sugarStock: req.body.sugarStock,
      wheatStock: req.body.wheatStock,
      oilStock: req.body.oilStock,
      toorDalStock: req.body.toorDalStock || 0
    };

    const inventory = await inventoryService.updateInventory(shopId, updateData);

    // If reschedule is true, trigger rescheduling and OTP sending
    let scheduleResult = null;
    if (reschedule) {
      try {
        scheduleResult = await scheduleService.autoSchedule(shopId);
        
        // If scheduling succeeded and there are users scheduled, send OTPs
        if (scheduleResult && scheduleResult.success && scheduleResult.scheduledCount > 0) {
          const otpResult = await verificationService.generateAndNotifyUsers();
          scheduleResult.otpNotification = otpResult;
        }
      } catch (scheduleError) {
        console.error('Error during rescheduling:', scheduleError);
        scheduleResult = { success: false, error: scheduleError.message };
      }
    }

    res.json({
      message: 'Inventory updated successfully',
      data: inventory,
      rescheduled: reschedule || false,
      scheduleResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Inventory update failed' });
  }
};

const getInventory = async (req, res) => {
  try {
    // Get shopId from JWT token - PDS Officer sees all, Staff sees their shop
    const shopId = req.user.shopId;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    if (shopId) {
      // Staff - only see their shop's inventory
      let inventory = await inventoryService.getInventoryByShopId(shopId);
      
      // If no inventory exists, create default one
      if (!inventory) {
        console.log(`Creating default inventory for shop: ${shopId}`);
        inventory = await prisma.inventory.upsert({
          where: { shopId },
          update: {},
          create: {
            shopId,
            riceStock: 0,
            wheatStock: 0,
            sugarStock: 0,
            oilStock: 0,
            toorDalStock: 0
          }
        });
      }
      return res.json([inventory]);
    }
    
    // PDS Officer - see all inventory
    const inventory = await inventoryService.getAllInventory();
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

// Reset inventory to zero
const resetInventory = async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { shopId, reschedule } = req.body;
    const targetShopId = shopId || req.user.shopId;
    
    if (!targetShopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }
    
    // Reset inventory to zero
    const inventory = await prisma.inventory.upsert({
      where: { shopId: targetShopId },
      update: {
        riceStock: 0,
        wheatStock: 0,
        sugarStock: 0,
        oilStock: 0,
        toorDalStock: 0
      },
      create: {
        shopId: targetShopId,
        riceStock: 0,
        wheatStock: 0,
        sugarStock: 0,
        oilStock: 0,
        toorDalStock: 0
      }
    });

    // If reschedule is true, trigger rescheduling and OTP sending
    let scheduleResult = null;
    if (reschedule) {
      try {
        scheduleResult = await scheduleService.autoSchedule(targetShopId);
        
        // If scheduling succeeded and there are users scheduled, send OTPs
        if (scheduleResult && scheduleResult.success && scheduleResult.scheduledCount > 0) {
          const otpResult = await verificationService.generateAndNotifyUsers();
          scheduleResult.otpNotification = otpResult;
        }
      } catch (scheduleError) {
        console.error('Error during rescheduling:', scheduleError);
        scheduleResult = { success: false, error: scheduleError.message };
      }
    }
    
    res.json({
      message: 'Inventory reset to zero successfully',
      data: inventory,
      rescheduled: reschedule || false,
      scheduleResult
    });
  } catch (error) {
    console.error('Error resetting inventory:', error);
    res.status(500).json({ error: 'Failed to reset inventory' });
  }
};

module.exports = {
  updateInventory,
  getInventory,
  resetInventory
};

