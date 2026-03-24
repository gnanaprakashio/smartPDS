const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Valid roles
const VALID_ROLES = ['PDS_OFFICER', 'STAFF'];

const register = async (req, res) => {
  try {
    const { email, password, name, role, shopId } = req.body;

    // Validate
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, name required' });
    }

    // Validate role
    const userRole = VALID_ROLES.includes(role) ? role : 'STAFF';

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin in Admin table
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
        shopId: shopId || null  // Staff linked to specific shop
      }
    });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, shopId: admin.shopId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin created',
      token,
      user: { id: admin.id, email, name, role: admin.role, shopId: admin.shopId }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, shopId } = req.body;

    // Demo credentials for testing
    if (email === 'admin@pds.gov.in' && password === 'admin123') {
      const token = jwt.sign(
        { id: 'demo-admin', email: 'admin@pds.gov.in', role: 'PDS_OFFICER', shopId: null },
        process.env.JWT_SECRET || 'demo-secret-key',
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: { id: 'demo-admin', email: 'admin@pds.gov.in', name: 'PDS Officer', role: 'PDS_OFFICER', shopId: null }
      });
    }

    // Demo staff login with shopId
    if (email === 'staff@pds.gov.in' && password === 'staff123') {
      const token = jwt.sign(
        { id: 'demo-staff', email: 'staff@pds.gov.in', role: 'STAFF', shopId: shopId || 'SHOP001' },
        process.env.JWT_SECRET || 'demo-secret-key',
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: { id: 'demo-staff', email: 'staff@pds.gov.in', name: 'Staff Officer', role: 'STAFF', shopId: shopId || 'SHOP001' }
      });
    }

    // Database login
    let admin;
    try {
      admin = await prisma.admin.findUnique({ where: { email } });
    } catch (dbError) {
      console.error('Database error:', dbError.message);
      return res.status(500).json({ error: 'Database not available. Use demo credentials.' });
    }
    
    if (!admin) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPass = await bcrypt.compare(password, admin.password);
    if (!validPass) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // For staff, use provided shopId or existing shopId
    const finalShopId = admin.role === 'STAFF' ? (shopId || admin.shopId) : null;

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, shopId: finalShopId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role, shopId: finalShopId }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
};

module.exports = { register, login };

