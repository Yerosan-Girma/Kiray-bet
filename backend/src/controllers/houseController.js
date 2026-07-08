const houseService = require('../services/houseService');
const { catchAsync } = require('../utils/AppError');

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
  const houses = await House.find({ listedBy: req.user.id });
  res.json({ success: true, data: houses });
});