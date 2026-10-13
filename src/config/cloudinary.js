const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const getCloudinaryConfig = () => ({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const isCloudinaryConfigured = () => {
  const config = getCloudinaryConfig();

  return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

const configureCloudinary = () => {
  const config = getCloudinaryConfig();

  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary credentials are missing. Configure CLOUD_NAME, CLOUD_API_KEY and CLOUD_API_SECRET in .env.");
  }

  cloudinary.config({
    ...config,
    secure: true,
  });

  return cloudinary;
};

const createCloudinaryStorage = ({ folder, allowedFormats = ["pdf"], resourceType = "raw" }) => {
  if (!folder) {
    throw new Error("A Cloudinary folder name is required.");
  }

  configureCloudinary();

  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      resource_type: resourceType,
      allowed_formats: allowedFormats,
    },
  });
};

module.exports = {
  cloudinary,
  configureCloudinary,
  createCloudinaryStorage,
  isCloudinaryConfigured,
};
