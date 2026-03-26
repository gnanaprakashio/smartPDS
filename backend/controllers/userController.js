const userService = require('../services/userService');
const scheduleService = require('../services/scheduleService');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const prisma = new PrismaClient();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

const registerUser = async (req, res) => {
  try {
    const { rationCardNumber, name, phone, cardType, shopId, members } = req.body;

    // Get shopId from JWT token for staff, or from request body
    const userShopId = req.user.shopId || shopId;
    
    if (!userShopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    const existingUser = await userService.getUserByRationCard(rationCardNumber);
    if (existingUser) {
      return res.status(400).json({ error: 'Ration card already registered' });
    }

    const user = await userService.createUser({
      rationCardNumber,
      name,
      phone,
      cardType,
      members: members || 1,
      shopId: userShopId
    });

    res.status(201).json({
      message: 'User registered successfully',
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // PDS Officer sees all users, Staff sees only their shop's users
    let where = req.user.role === 'STAFF' ? { shopId: req.user.shopId } : {};
    
    // Add shopId filter from query params if provided
    if (req.query.shopId) {
      where = { ...where, shopId: req.query.shopId };
    }
    
    // Add status filter from query params if provided
    if (req.query.status) {
      where = { ...where, status: req.query.status };
    }
    
    // Add cardType filter from query params if provided
    const cardType = req.query.cardType;
    if (cardType && typeof cardType === 'string') {
      where = { ...where, cardType: cardType.trim() };
    }
    
    // Add timeSlot filter from query params if provided
    if (req.query.timeSlot) {
      where = { ...where, timeSlot: req.query.timeSlot };
    }
    
    // Pagination parameters (default: page 1, limit 20)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination info
    const totalCount = await prisma.user.count({ where });
    
    // Fetch paginated users
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limit
    });
    
    res.json({
      users,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get all unique shops
const getAllShops = async (req, res) => {
  try {
    const shops = await prisma.user.findMany({
      select: { shopId: true },
      distinct: ['shopId'],
      orderBy: { shopId: 'asc' }
    });
    
    res.json(shops.map(s => s.shopId));
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
};

// Get card type counts
const getCardCounts = async (req, res) => {
  try {
    // Allow PDS Officer to filter by shop using query param
    const filterShopId = req.query.shopId;
    const where = req.user.role === 'STAFF' 
      ? { shopId: req.user.shopId } 
      : (filterShopId ? { shopId: filterShopId } : {});
    
    const [aayCount, phhCount, nphhCount, nphh_sCount] = await Promise.all([
      prisma.user.count({ where: { ...where, cardType: 'AAY' } }),
      prisma.user.count({ where: { ...where, cardType: 'PHH' } }),
      prisma.user.count({ where: { ...where, cardType: 'NPHH' } }),
      prisma.user.count({ where: { ...where, cardType: 'NPHH_S' } })
    ]);
    
    res.json({
      AAY: aayCount,
      PHH: phhCount,
      NPHH: nphhCount,
      NPHH_S: nphh_sCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch card counts' });
  }
};

// Delete all users (PDS Officer only)
const deleteAllUsers = async (req, res) => {
  try {
    // Only PDS Officer can delete all users
    if (req.user.role !== 'PDS_OFFICER') {
      return res.status(403).json({ error: 'Only PDS Officer can delete all users' });
    }
    
    const { shopId } = req.body;
    
    // If shopId provided, delete only that shop's users
    const where = shopId ? { shopId } : {};
    
    const result = await prisma.user.deleteMany({ where });
    
    res.json({
      message: `Deleted ${result.count} users successfully`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ error: 'Failed to delete users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Search users by ration card number or phone number (for Staff/PDS Officer)
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Build where clause based on role
    // Staff can only search within their shop, PDS Officer can search all
    let where = req.user.role === 'STAFF' 
      ? { shopId: req.user.shopId } 
      : {};
    
    // Add search conditions - search by rationCardNumber or phone
    where.OR = [
      { rationCardNumber: { contains: query.trim(), mode: 'insensitive' } },
      { phone: { contains: query.trim() } },
      { name: { contains: query.trim(), mode: 'insensitive' } }
    ];
    
    const users = await prisma.user.findMany({
      where,
      take: 50, // Limit results
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      users,
      count: users.length,
      query: query.trim()
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// CSV Upload Controller
const uploadUsersCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let skippedDuplicates = 0;

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Role-based shopId handling:
    // - PDS Officer: Can upload CSV for any shop (must specify shopId in request body)
    // - Staff: Can only upload CSV for their own shop (use JWT shopId)
    let shopId;
    if (req.user.role === 'PDS_OFFICER' || req.user.role === 'ADMIN') {
      // PDS Officer must provide shopId in request body
      shopId = req.body.shopId;
      if (!shopId) {
        return res.status(400).json({ error: 'Shop ID is required for CSV upload. Please enter a shop name.' });
      }
      // Trim and uppercase
      shopId = shopId.trim().toUpperCase();
    } else {
      // Staff can only upload for their own shop
      shopId = req.user.shopId;
      if (!shopId) {
        return res.status(400).json({ error: 'Your shop is not assigned. Please contact administrator.' });
      }
    }

    console.log('CSV Upload - Role:', req.user.role, 'ShopId:', shopId);

    // Process each row
    for (const row of results) {
      // Handle different possible column names for members
      const members = row.members || row['Members count'] || row['Members'] || row['members count'] || row['members'] || '1';
      const { card_number, name, card_type, phone_number, area, reputation } = row;

      // Validate required fields
      if (!card_number || !name || !phone_number) {
        errors.push(`Missing required fields for row: ${JSON.stringify(row)}`);
        continue;
      }

      // Check for duplicate card_number - update if exists
      const existingUser = await prisma.user.findUnique({
        where: { rationCardNumber: card_number }
      });

      // Parse members count (default to 1 if not provided)
      const membersCount = members ? parseInt(members) : 1;

      if (existingUser) {
        // Update existing user's member count and other details
        try {
          await prisma.user.update({
            where: { rationCardNumber: card_number },
            data: {
              name: name,
              phone: phone_number,
              members: membersCount,
              reputationScore: reputation ? parseFloat(reputation) : existingUser.reputationScore
            }
          });
          skippedDuplicates++; // Count as updated
        } catch (updateError) {
          errors.push(`Failed to update user ${name}: ${updateError.message}`);
        }
        continue;
      }

      // Map card_type to enum (handle APL/BPL as well, also NPHH-S with hyphen)
      let mappedCardType = 'PHH';
      if (card_type === 'AAY' || card_type === 'APL') {
        mappedCardType = 'AAY';
      } else if (card_type === 'PHH' || card_type === 'BPL') {
        mappedCardType = 'PHH';
      } else if (card_type === 'NPHH' || card_type === 'NPHH-S' || card_type === 'NPHH_S') {
        // Handle both NPHH (rice card) and NPHH-S (sugar card)
        mappedCardType = card_type === 'NPHH-S' ? 'NPHH_S' : 'NPHH';
      }

      // Insert user with shopId and default reputation = 50 if missing
      try {
        const newUser = await prisma.user.create({
          data: {
            rationCardNumber: card_number,
            name: name,
            phone: phone_number,
            cardType: mappedCardType,
            members: membersCount,
            reputationScore: reputation ? parseFloat(reputation) : 50,
            shopId: shopId
          }
        });
        console.log(`Created user: ${newUser.name} (${newUser.rationCardNumber}) - Status: ${newUser.status}, Collected: ${newUser.collected}`);
      } catch (insertError) {
        console.error(`Error inserting user ${name}:`, insertError.message);
        errors.push(`Failed to insert user ${name}: ${insertError.message}`);
      }
    }

    // Delete uploaded file after processing
    fs.unlinkSync(req.file.path);

    // Auto-trigger scheduling after user upload (pass shopId)
    const scheduleResult = await scheduleService.autoSchedule(shopId);

    res.json({
      message: 'CSV uploaded successfully',
      totalRows: results.length,
      inserted: results.length - skippedDuplicates - errors.length,
      skippedDuplicates,
      scheduling: scheduleResult,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('CSV Upload Error:', error);
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
};

// Mark user as collected (ration collected)
const markCollected = async (req, res) => {
  try {
    const { id } = req.params;
    const { collected } = req.body;

    // Verify user belongs to staff's shop (for staff users)
    const where = req.user.role === 'STAFF' ? { shopId: req.user.shopId } : {};
    
    const user = await prisma.user.findFirst({
      where: { id, ...where }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current inventory for the shop
    const inventory = await prisma.inventory.findUnique({
      where: { shopId: user.shopId }
    });

    let updatedUser;
    let updatedInventory = inventory;

    // If marking as collected, deduct stock based on card type and number of members
    if (collected && !user.collected) {
      const members = user.members || 1;
      
      // TNPDS Monthly Allocation per card type (updated to match TNPDS standards)
      // Priority: AAY > PHH > NPHH > NPHH_S
      const allocation = {
        // AAY (Antyodaya): 35kg fixed rice, 5-10kg wheat, 1-2kg sugar, 1L oil, 1kg toor dal
        AAY: { rice: 35, wheat: 5, sugar: 1.5, oil: 1, toorDal: 1 },
        // PHH (Priority): 5kg per person rice, 5-10kg wheat, 0.5kg sugar, 1L oil, 1kg toor dal
        PHH: { rice: 5, wheat: 5, sugar: 0.5, oil: 1, toorDal: 1 },
        // NPHH (Rice Card): 12kg (minimum) rice, 5kg wheat, 0.5kg sugar, 1L oil, 1kg toor dal
        NPHH: { rice: 12, wheat: 5, sugar: 0.5, oil: 1, toorDal: 1 },
        // NPHH-S (Sugar): No rice, 0.5kg/person + 3kg extra sugar, 1L oil, 1kg toor dal
        NPHH_S: { rice: 0, wheat: 0, sugar: 3.5, oil: 1, toorDal: 1 }
      };

      const perPerson = allocation[user.cardType] || allocation.PHH;
      
      // Calculate total quota based on number of members
      // For NPHH_S, sugar = 0.5 * members + 3kg fixed
      const sugarQuota = user.cardType === 'NPHH_S' 
        ? (0.5 * members + 3) 
        : perPerson.sugar * members;
      
      // Rice: AAY (35kg) & NPHH (12kg) = FIXED per card, PHH = 5kg × members
      const riceQuota = (user.cardType === 'AAY' || user.cardType === 'NPHH') 
        ? perPerson.rice  // Fixed per card
        : perPerson.rice * members;  // Per person
      
      const quota = {
        rice: riceQuota,
        wheat: user.cardType === 'NPHH_S' ? 0 : 5,  // Fixed 5kg per card (not per person)
        sugar: sugarQuota,
        oil: 1,  // Fixed 1L per card (max)
        toorDal: user.cardType === 'NPHH_S' ? 0 : 1  // Fixed 1kg per card (not per person)
      };

      // Check if sufficient stock available (including toorDal)
      if (inventory) {
        if (inventory.riceStock < quota.rice || 
            inventory.wheatStock < quota.wheat || 
            inventory.sugarStock < quota.sugar || 
            inventory.oilStock < quota.oil ||
            (inventory.toorDalStock || 0) < quota.toorDal) {
          return res.status(400).json({ 
            error: 'Insufficient stock in shop',
            available: {
              rice: inventory.riceStock,
              wheat: inventory.wheatStock,
              sugar: inventory.sugarStock,
              oil: inventory.oilStock,
              toorDal: inventory.toorDalStock || 0
            },
            required: quota
          });
        }

        // Deduct stock including toorDal
        updatedInventory = await prisma.inventory.update({
          where: { shopId: user.shopId },
          data: {
            riceStock: { decrement: quota.rice },
            wheatStock: { decrement: quota.wheat },
            sugarStock: { decrement: quota.sugar },
            oilStock: { decrement: quota.oil },
            toorDalStock: { decrement: quota.toorDal }
          }
        });
      }

      // Update user status
      updatedUser = await prisma.user.update({
        where: { id },
        data: { 
          collected: true,
          status: 'COMPLETED'
        }
      });
    } else if (collected === false && user.collected) {
      // Undo collection - restore stock based on TNPDS allocation
      const members = user.members || 1;
      const allocation = {
        AAY: { rice: 35, wheat: 5, sugar: 1.5, oil: 1, toorDal: 1 },
        PHH: { rice: 5, wheat: 5, sugar: 0.5, oil: 1, toorDal: 1 },
        NPHH: { rice: 12, wheat: 5, sugar: 0.5, oil: 1, toorDal: 1 },
        NPHH_S: { rice: 0, wheat: 0, sugar: 3.5, oil: 1, toorDal: 1 }
      };
      const perPerson = allocation[user.cardType] || allocation.PHH;
      
      // For NPHH_S, sugar = 0.5 * members + 3kg fixed
      const sugarQuota = user.cardType === 'NPHH_S' 
        ? (0.5 * members + 3) 
        : perPerson.sugar * members;
      
      // Rice: AAY (35kg) & NPHH (12kg) = FIXED per card, PHH = 5kg × members
      const riceQuota = (user.cardType === 'AAY' || user.cardType === 'NPHH') 
        ? perPerson.rice  // Fixed per card
        : perPerson.rice * members;  // Per person
      
      const quota = {
        rice: riceQuota,
        wheat: user.cardType === 'NPHH_S' ? 0 : 5,  // Fixed 5kg per card (not per person)
        sugar: sugarQuota,
        oil: 1,  // Fixed 1L per card
        toorDal: user.cardType === 'NPHH_S' ? 0 : 1  // Fixed 1kg per card (not per person)
      };

      if (inventory) {
        updatedInventory = await prisma.inventory.update({
          where: { shopId: user.shopId },
          data: {
            riceStock: { increment: quota.rice },
            wheatStock: { increment: quota.wheat },
            sugarStock: { increment: quota.sugar },
            oilStock: { increment: quota.oil },
            toorDalStock: { increment: quota.toorDal }
          }
        });
      }

      updatedUser = await prisma.user.update({
        where: { id },
        data: { 
          collected: false,
          status: 'SCHEDULED'
        }
      });
    } else {
      updatedUser = await prisma.user.update({
        where: { id },
        data: { collected: collected !== false }
      });
    }

    res.json({
      message: updatedUser.collected 
        ? 'Ration collected! Stock deducted.' 
        : 'Ration marked as not collected',
      user: updatedUser,
      inventory: updatedInventory,
      otp: user.otp,
      stockBefore: inventory,
      stockAfter: updatedInventory
    });
  } catch (error) {
    console.error('Error updating collection status:', error);
    res.status(500).json({ error: 'Failed to update collection status' });
  }
};

// Update user (edit/modify user data) - PDS Officer only
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, cardType, members, status, reputationScore, shopId } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (cardType) updateData.cardType = cardType;
    if (members) updateData.members = members;
    if (status) updateData.status = status;
    if (reputationScore !== undefined) updateData.reputationScore = reputationScore;
    if (shopId) updateData.shopId = shopId;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete single user - PDS Officer only
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: existingUser.id,
        name: existingUser.name,
        rationCardNumber: existingUser.rationCardNumber
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = {
  registerUser,
  getAllUsers,
  getUserById,
  getCardCounts,
  getAllShops,
  deleteAllUsers,
  uploadUsersCSV,
  upload,
  markCollected,
  searchUsers,
  updateUser,
  deleteUser
};

