require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const House = require('./src/models/House');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Clear existing data (optional, be careful in production!)
    // await User.deleteMany();
    // await House.deleteMany();

    // Check if test user exists
    let user = await User.findOne({ email: 'testowner@example.com' });
    
    if (!user) {
      console.log('Creating test user...');
      user = await User.create({
        name: 'Test Owner',
        email: 'testowner@example.com',
        phone: '1234567890',
        password: 'password123',
        role: 'owner',
        status: 'active',
        isApproved: true
      });
      console.log('Test user created:', user.email);
    } else {
      console.log('Test user already exists.');
    }

    console.log('Creating test house...');
    const house = await House.create({
      title: 'Beautiful Cozy Apartment',
      description: 'A wonderful place to live with great views and modern amenities.',
      price: 1500,
      location: 'Downtown City Center',
      coordinates: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610] // Longitude, Latitude
      },
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'apartment',
      amenities: ['WiFi', 'Air Conditioning', 'Gym'],
      listedBy: user._id,
      status: 'approved',
      isActive: true
    });
    console.log('Test house created:', house.title);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
