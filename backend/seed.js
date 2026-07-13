require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const House = require('./src/models/House');

const ethiopianProperties = [
  // VILLA
  {
    title: 'Luxury Villa in Bole',
    description: 'Stunning 5-bedroom villa with panoramic city views, private garden, and modern amenities. Perfect for families seeking luxury living in the heart of Addis Ababa.',
    price: 85000,
    location: 'Bole, Addis Ababa, Ethiopia',
    coordinates: { type: 'Point', coordinates: [38.7469, 8.9939] },
    bedrooms: 5,
    bathrooms: 4,
    sqft: 4500,
    propertyType: 'villa',
    amenities: ['WiFi', 'Parking', 'Swimming Pool', 'Gym', 'Garden', 'Security', 'Air Conditioning', 'Backup Generator'],
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop'],
    isPremium: true,
    tag: 'Featured',
    rating: 4.9,
    reviews: 28,
    views: 1250
  },
  // APARTMENT
  {
    title: 'Modern Apartment in Kazanchis',
    description: 'Contemporary 2-bedroom apartment with floor-to-ceiling windows, fully equipped kitchen, and proximity to international schools and shopping centers.',
    price: 25000,
    location: 'Kazanchis, Addis Ababa, Ethiopia',
    coordinates: { type: 'Point', coordinates: [38.7569, 9.0039] },
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    propertyType: 'apartment',
    amenities: ['WiFi', 'Parking', 'Security', 'Elevator', 'Air Conditioning'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'],
    isPremium: false,
    tag: 'New',
    rating: 4.5,
    reviews: 15,
    views: 890
  },
  // STUDIO
  {
    title: 'Cozy Studio in Piassa',
    description: 'Efficient studio apartment perfect for young professionals. Open floor plan, modern bathroom, and walking distance to historic Piassa district.',
    price: 12000,
    location: 'Piassa, Addis Ababa, Ethiopia',
    coordinates: { type: 'Point', coordinates: [38.7369, 9.0139] },
    bedrooms: 1,
    bathrooms: 1,
    sqft: 450,
    propertyType: 'studio',
    amenities: ['WiFi', 'Security', 'Air Conditioning'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'],
    isPremium: false,
    tag: null,
    rating: 4.2,
    reviews: 8,
    views: 520
  },
  // PENTHOUSE
  {
    title: 'Skyline Penthouse in Sar Bet',
    description: 'Exclusive penthouse with rooftop terrace, 360-degree views of Addis Ababa, private elevator access, and premium finishes throughout.',
    price: 120000,
    location: 'Sar Bet, Addis Ababa, Ethiopia',
    coordinates: { type: 'Point', coordinates: [38.7669, 8.9839] },
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3500,
    propertyType: 'penthouse',
    amenities: ['WiFi', 'Parking', 'Swimming Pool', 'Gym', 'Security', 'Rooftop Terrace', 'Air Conditioning', 'Backup Generator', 'Concierge'],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop'],
    isPremium: true,
    tag: 'Premium',
    rating: 5.0,
    reviews: 12,
    views: 2100
  },
  // BEACH HOUSE (Lake House for Ethiopia context)
  {
    title: 'Lakefront House in Hawassa',
    description: 'Beautiful lakefront property on Lake Hawassa with private dock, stunning sunset views, and direct beach access. Perfect for vacation living.',
    price: 45000,
    location: 'Hawassa, Sidama Region, Ethiopia',
    coordinates: { type: 'Point', coordinates: [38.4167, 7.0556] },
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2200,
    propertyType: 'beach house',
    amenities: ['WiFi', 'Parking', 'Private Dock', 'Garden', 'Security', 'Outdoor Kitchen'],
    images: ['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=600&fit=crop'],
    isPremium: true,
    tag: 'Waterfront',
    rating: 4.7,
    reviews: 19,
    views: 1680
  },
  // HOUSE
  {
    title: 'Family House in Megenagna',
    description: 'Spacious family home in quiet Megenagna neighborhood. Large backyard, modern kitchen, and close to schools and parks.',
    price: 35000,
    location: 'Megenagna, Addis Ababa, Ethiopia',
    coordinates: { type: 'Point', coordinates: [38.7269, 9.0239] },
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2800,
    propertyType: 'house',
    amenities: ['WiFi', 'Parking', 'Garden', 'Security', 'Air Conditioning', 'Backup Generator'],
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'],
    isPremium: false,
    tag: 'Family',
    rating: 4.6,
    reviews: 22,
    views: 980
  },
  // Additional Villa
  {
    title: 'Garden Villa in Old Airport',
    description: 'Elegant villa with mature gardens, traditional Ethiopian architecture blended with modern comforts, and guest house.',
    price: 95000,
    location: 'Old Airport, Addis Ababa, Ethiopia',
    coordinates: { type: 'Point', coordinates: [38.7869, 8.9739] },
    bedrooms: 6,
    bathrooms: 5,
    sqft: 5200,
    propertyType: 'villa',
    amenities: ['WiFi', 'Parking', 'Swimming Pool', 'Gym', 'Garden', 'Security', 'Guest House', 'Air Conditioning'],
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop'],
    isPremium: true,
    tag: 'Exclusive',
    rating: 4.8,
    reviews: 31,
    views: 1450
  },
  // Additional Apartment
  {
    title: 'Studio in CMC',
    description: 'Compact studio in bustling CMC area. Modern finishes, great natural light, and excellent public transport connections.',
    price: 10000,
    location: 'CMC, Addis Ababa, Ethiopia',
    coordinates: { type: 'Point', coordinates: [38.7169, 9.0339] },
    bedrooms: 1,
    bathrooms: 1,
    sqft: 400,
    propertyType: 'studio',
    amenities: ['WiFi', 'Security', 'Air Conditioning'],
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'],
    isPremium: false,
    tag: null,
    rating: 4.1,
    reviews: 6,
    views: 340
  }
];

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Clear existing houses
    await House.deleteMany();
    console.log('Cleared existing houses');

    // Check if test user exists
    let user = await User.findOne({ email: 'testowner@example.com' });
    
    if (!user) {
      console.log('Creating test user...');
      user = await User.create({
        name: 'Ethiopian Property Owner',
        email: 'testowner@example.com',
        phone: '+251 911 123 456',
        password: 'password123',
        role: 'owner',
        status: 'active',
        isApproved: true
      });
      console.log('Test user created:', user.email);
    } else {
      console.log('Test user already exists.');
    }

    console.log('Creating Ethiopian properties...');
    for (const property of ethiopianProperties) {
      const house = await House.create({
        ...property,
        listedBy: user._id,
        status: 'approved',
        isActive: true,
        inquiryCount: Math.floor(Math.random() * 20),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created: ${house.title} (${house.propertyType})`);
    }

    console.log(`Seed completed successfully! Created ${ethiopianProperties.length} properties.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
