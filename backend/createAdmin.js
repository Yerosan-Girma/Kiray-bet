require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@nesthub.com' });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@nesthub.com',
      password: 'Admin@1234',
      role: 'admin',
      status: 'active',
      isApproved: true,
      emailVerified: true,
    });

    console.log('✅ Admin created successfully!');
    console.log('   Email:    admin@nesthub.com');
    console.log('   Password: Admin@1234');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

createAdmin();
