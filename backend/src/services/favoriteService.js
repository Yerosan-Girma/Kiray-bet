const Favorite = require('../models/Favorite');
const House = require('../models/House');
const { AppError } = require('../utils/AppError');

const addFavorite = async (userId, houseId) => {
  const house = await House.findById(houseId);
  if (!house) throw new AppError('House not found', 404);

  const existing = await Favorite.findOne({ userId, houseId });
  if (existing) throw new AppError('Already favorited', 400);

  const favorite = await Favorite.create({ userId, houseId });
  return favorite;
};

const removeFavorite = async (userId, houseId) => {
  const result = await Favorite.findOneAndDelete({ userId, houseId });
  if (!result) throw new AppError('Favorite not found', 404);
  return result;
};

const getFavorites = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const favorites = await Favorite.find({ userId })
    .populate({
      path: 'houseId',
      populate: { path: 'listedBy', select: 'name email phone profileImage' },
    })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Favorite.countDocuments({ userId });

  return {
    favorites,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = { addFavorite, removeFavorite, getFavorites };
