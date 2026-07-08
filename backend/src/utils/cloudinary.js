const cloudinary = require('cloudinary').v2;
const { AppError } = require('./AppError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: 'rentalwpa/houses',
          transformation: [{ width: 800, height: 600, crop: 'limit' }],
          ...options,
        },
        (error, result) => {
          if (error) reject(new AppError('Cloudinary upload failed', 500));
          else resolve(result.secure_url);
        }
      )
      .end(fileBuffer);
  });
};

const deleteFromCloudinary = async (imageUrl) => {
  const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0];
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(`rentalwpa/houses/${publicId}`, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };