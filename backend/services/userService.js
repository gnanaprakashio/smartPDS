const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createUser = async (data) => {
  return prisma.user.create({ data });
};

const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

const getUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

const getUserByRationCard = async (rationCardNumber) => {
  return prisma.user.findUnique({ where: { rationCardNumber } });
};

const getUserByPhone = async (phone) => {
  return prisma.user.findUnique({ where: { phone } });
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByRationCard,
  getUserByPhone
};

