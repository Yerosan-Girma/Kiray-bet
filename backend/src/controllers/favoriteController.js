const favoriteService = require('../services/favoriteService');
const { catchAsync } = require('../utils/AppError');

exports.addFavorite = catchAsync(async (req, res) => {
  const favorite = await favoriteService.addFavorite(req.user.id, req.params.houseId);
  res.status(201).json({ success: true, data: favorite });
});

exports.removeFavorite = catchAsync(async (req, res) => {
  await favoriteService.removeFavorite(req.user.id, req.params.houseId);
  res.json({ success: true, message: 'Removed from favorites' });
});

exports.getFavorites = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await favoriteService.getFavorites(req.user.id, parseInt(page), parseInt(limit));
  res.json({ success: true, data: result.favorites, pagination: result.pagination });
});