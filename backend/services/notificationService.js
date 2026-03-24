const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createNotification = async (title, message, type = 'INFO', link = null) => {
  return prisma.notification.create({
    data: {
      title,
      message,
      type,
      link
    }
  });
};

const getNotifications = async (limit = 20) => {
  return prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

const getUnreadCount = async () => {
  return prisma.notification.count({
    where: { read: false }
  });
};

const markAsRead = async (id) => {
  return prisma.notification.update({
    where: { id },
    data: { read: true }
  });
};

const markAllAsRead = async () => {
  return prisma.notification.updateMany({
    where: { read: false },
    data: { read: true }
  });
};

const deleteNotification = async (id) => {
  return prisma.notification.delete({
    where: { id }
  });
};

const createFraudNotification = async (fraudLog) => {
  const severityEmoji = {
    HIGH: '🚨',
    MEDIUM: '⚠️',
    LOW: 'ℹ️'
  };
  
  return createNotification(
    `${severityEmoji[fraudLog.severity]} Fraud Alert Detected`,
    fraudLog.reason,
    'FRAUD',
    `/fraud/${fraudLog.id}`
  );
};

const createBulkNotification = async (title, message, type = 'INFO') => {
  return createNotification(title, message, type);
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createFraudNotification,
  createBulkNotification
};
