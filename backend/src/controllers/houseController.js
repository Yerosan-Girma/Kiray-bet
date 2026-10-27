const path = require('path');
const fs = require('fs');
const houseService = require('../services/houseService');
const { catchAsync } = require('../utils/AppError');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.uploadImages = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No images uploaded' });
  }

  const uploadDir = path.join(__dirname, '../../uploads/houses');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const urls = [];
  const useCloudinary =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key';

  for (const file of req.files) {
    let uploaded = false;
    if (useCloudinary) {
      try {
        const cloudUrl = await uploadToCloudinary(file.buffer);
        urls.push(cloudUrl);
        uploaded = true;
      } catch (err) {
        // Fall back to local disk storage
      }
    }

    if (!uploaded) {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, file.buffer);

      const protocol = req.protocol;
      const host = req.get('host');
      urls.push(`${protocol}://${host}/uploads/houses/${filename}`);
    }
  }

  res.status(200).json({ success: true, urls });
});

exports.createHouse = catchAsync(async (req, res) => {
  const house = await houseService.createHouse(req.body, req.user.id);
  res.status(201).json({ success: true, data: house });
});

exports.getHouse = catchAsync(async (req, res) => {
  const house = await houseService.getHouseById(req.params.id);
  res.json({ success: true, data: house });
});

exports.updateHouse = catchAsync(async (req, res) => {
  const house = await houseService.updateHouse(req.params.id, req.body, req.user.id, req.user.role);
  res.json({ success: true, data: house });
});

exports.deleteHouse = catchAsync(async (req, res) => {
  await houseService.deleteHouse(req.params.id, req.user.id, req.user.role);
  res.json({ success: true, message: 'House deleted' });
});

exports.getHouses = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const result = await houseService.getHouses(filters, parseInt(page), parseInt(limit));
  res.json({ success: true, data: result.houses, pagination: result.pagination });
});

exports.getNearbyHouses = catchAsync(async (req, res) => {
  const { longitude, latitude, radius = 10, page = 1, limit = 10 } = req.query;
  const result = await houseService.getNearbyHouses(
    parseFloat(longitude),
    parseFloat(latitude),
    parseFloat(radius),
    parseInt(page),
    parseInt(limit)
  );
  res.json({ success: true, data: result.houses, pagination: result.pagination });
});

exports.getMyListings = catchAsync(async (req, res) => {
  const houses = await houseService.getMyListings(req.user.id);
  res.json({ success: true, data: houses });
});

exports.getOwnerSubmissions = catchAsync(async (req, res) => {
  const houses = await houseService.getOwnerSubmissions(req.user.id);
  res.json({ success: true, data: houses });
});
