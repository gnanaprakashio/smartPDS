const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedFreshData() {
  console.log('🌱 Seeding fresh data...\n');

  try {
    // 1. Create Admin users
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // PDS Officer
    await prisma.admin.upsert({
      where: { email: 'admin@pds.gov.in' },
      update: {},
      create: {
        email: 'admin@pds.gov.in',
        password: hashedPassword,
        name: 'PDS Officer',
        role: 'PDS_OFFICER',
        shopId: null
      }
    });
    console.log('✅ Created PDS Officer: admin@pds.gov.in / admin123');

    // Staff for SHOP001
    await prisma.admin.upsert({
      where: { email: 'staff001@pds.gov.in' },
      update: {},
      create: {
        email: 'staff001@pds.gov.in',
        password: hashedPassword,
        name: 'Staff Officer 001',
        role: 'STAFF',
        shopId: 'SHOP001'
      }
    });
    console.log('✅ Created Staff: staff001@pds.gov.in / admin123 (SHOP001)');

    // 2. Create Inventory for shops
    await prisma.inventory.upsert({
      where: { shopId: 'SHOP001' },
      update: {},
      create: {
        shopId: 'SHOP001',
        riceStock: 500,
        wheatStock: 200,
        sugarStock: 100,
        oilStock: 50,
        toorDalStock: 50
      }
    });
    console.log('✅ Created Inventory for SHOP001');

    await prisma.inventory.upsert({
      where: { shopId: 'SHOP002' },
      update: {},
      create: {
        shopId: 'SHOP002',
        riceStock: 300,
        wheatStock: 150,
        sugarStock: 75,
        oilStock: 30,
        toorDalStock: 30
      }
    });
    console.log('✅ Created Inventory for SHOP002');

    // 3. Create sample users for SHOP001
    const sampleUsers = [
      { rationCardNumber: 'AAY001', name: 'Karthik Raja', phone: '9876543210', members: 4, cardType: 'AAY', reputationScore: 50, shopId: 'SHOP001' },
      { rationCardNumber: 'AAY002', name: 'Muthu Kumar', phone: '9876543211', members: 3, cardType: 'AAY', reputationScore: 50, shopId: 'SHOP001' },
      { rationCardNumber: 'AAY003', name: 'Arun Vijay', phone: '9876543212', members: 5, cardType: 'AAY', reputationScore: 50, shopId: 'SHOP001' },
      { rationCardNumber: 'PHH001', name: 'Prabhu Raj', phone: '9876543213', members: 2, cardType: 'PHH', reputationScore: 50, shopId: 'SHOP001' },
      { rationCardNumber: 'PHH002', name: 'Vijay Kumar', phone: '9876543214', members: 4, cardType: 'PHH', reputationScore: 50, shopId: 'SHOP001' },
      { rationCardNumber: 'PHH003', name: 'Suriya Prakash', phone: '9876543215', members: 3, cardType: 'PHH', reputationScore: 50, shopId: 'SHOP001' },
      { rationCardNumber: 'NPHH001', name: 'Dhanush Mohan', phone: '9876543216', members: 1, cardType: 'NPHH', reputationScore: 50, shopId: 'SHOP001' },
      { rationCardNumber: 'NPHH002', name: 'Kamal Haasan', phone: '9876543217', members: 2, cardType: 'NPHH', reputationScore: 50, shopId: 'SHOP001' },
      { rationCardNumber: 'NPHH_S01', name: 'Rajinikanth', phone: '9876543218', members: 1, cardType: 'NPHH_S', reputationScore: 50, shopId: 'SHOP001' },
      { rationCardNumber: 'NPHH_S02', name: 'Ajith Kumar', phone: '9876543219', members: 1, cardType: 'NPHH_S', reputationScore: 50, shopId: 'SHOP001' },
    ];

    for (const user of sampleUsers) {
      await prisma.user.upsert({
        where: { rationCardNumber: user.rationCardNumber },
        update: {},
        create: user
      });
    }
    console.log(`✅ Created ${sampleUsers.length} sample users for SHOP001`);

    // 4. Create sample users for SHOP002
    const sampleUsers2 = [
      { rationCardNumber: 'AAY101', name: 'Siva Kumar', phone: '9876543220', members: 4, cardType: 'AAY', reputationScore: 50, shopId: 'SHOP002' },
      { rationCardNumber: 'AAY102', name: 'Ravi Mohan', phone: '9876543221', members: 3, cardType: 'AAY', reputationScore: 50, shopId: 'SHOP002' },
      { rationCardNumber: 'PHH101', name: 'Ganesh Kumar', phone: '9876543222', members: 2, cardType: 'PHH', reputationScore: 50, shopId: 'SHOP002' },
    ];

    for (const user of sampleUsers2) {
      await prisma.user.upsert({
        where: { rationCardNumber: user.rationCardNumber },
        update: {},
        create: user
      });
    }
    console.log(`✅ Created ${sampleUsers2.length} sample users for SHOP002`);

    // 5. Create sample slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await prisma.slot.create({
      data: {
        shopId: 'SHOP001',
        slotDate: tomorrow,
        startTime: '09:00',
        endTime: '11:00',
        maxUsers: 50
      }
    });
    console.log('✅ Created slot for SHOP001 (09:00-11:00)');

    await prisma.slot.create({
      data: {
        shopId: 'SHOP001',
        slotDate: tomorrow,
        startTime: '11:00',
        endTime: '13:00',
        maxUsers: 50
      }
    });
    console.log('✅ Created slot for SHOP001 (11:00-13:00)');

    await prisma.slot.create({
      data: {
        shopId: 'SHOP001',
        slotDate: tomorrow,
        startTime: '14:00',
        endTime: '16:00',
        maxUsers: 50
      }
    });
    console.log('✅ Created slot for SHOP001 (14:00-16:00)');

    console.log('\n🎉 Fresh data seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   PDS Officer: admin@pds.gov.in / admin123');
    console.log('   Staff: staff001@pds.gov.in / admin123 (SHOP001)');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFreshData();
