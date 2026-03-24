const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️  Resetting database...\n');

  try {
    // Delete in correct order (respecting foreign keys)
    await prisma.adminAction.deleteMany();
    console.log('✅ Deleted admin actions');
    
    await prisma.fraudLog.deleteMany();
    console.log('✅ Deleted fraud logs');
    
    await prisma.reputationLog.deleteMany();
    console.log('✅ Deleted reputation logs');
    
    await prisma.slotAssignment.deleteMany();
    console.log('✅ Deleted slot assignments');
    
    await prisma.otpVerification.deleteMany();
    console.log('✅ Deleted OTP verifications');
    
    await prisma.slot.deleteMany();
    console.log('✅ Deleted slots');
    
    await prisma.user.deleteMany();
    console.log('✅ Deleted users');
    
    await prisma.inventory.deleteMany();
    console.log('✅ Deleted inventory');
    
    await prisma.notification.deleteMany();
    console.log('✅ Deleted notifications');
    
    await prisma.reputationResetRequest.deleteMany();
    console.log('✅ Deleted reputation reset requests');

    console.log('\n🎉 Database reset complete! All data cleared.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
