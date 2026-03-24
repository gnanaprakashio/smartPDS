const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updateInventory = async (shopId, data) => {
  return prisma.inventory.upsert({
    where: { shopId },
    update: data,
    create: {
      shopId,
      riceStock: 0,
      sugarStock: 0,
      wheatStock: 0,
      oilStock: 0,
      toorDalStock: 0,  // Toor Dal - TNPDS allocation
      ...data
    }
  });
};

const getInventory = async (shopId) => {
  return prisma.inventory.findUnique({ where: { shopId } });
};

const getInventoryByShopId = async (shopId) => {
  return prisma.inventory.findUnique({ where: { shopId } });
};

const getAllInventory = async () => {
  return prisma.inventory.findMany();
};

module.exports = {
  updateInventory,
  getInventory,
  getInventoryByShopId,
  getAllInventory
};

