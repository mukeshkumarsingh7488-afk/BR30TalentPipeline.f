const { cloudinary, configureCloudinary } = require("../config/cloudinary");

const uploadBuffer = ({ buffer, folder, resourceType, format }) =>
  new Promise((resolve, reject) => {
    configureCloudinary();

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...(resourceType === "raw" ? { type: "authenticated" } : {}),
        ...(format ? { format } : {}),
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary returned no upload result."));
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });

const uploadResume = async (file) => {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new Error("Resume PDF is required.");
  }

  return uploadBuffer({
    buffer: file.buffer,
    folder: "br30-talent-pipeline/resumes",
    resourceType: "raw",
    format: "pdf",
  });
};

const createResumeDownloadUrl = (publicId, expiresInSeconds = 300) => {
  if (typeof publicId !== "string" || !publicId.trim()) {
    throw new Error("Resume asset identifier is missing.");
  }
  configureCloudinary();
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.utils.private_download_url(publicId, "pdf", {
    resource_type: "raw",
    type: "authenticated",
    attachment: true,
    expires_at: expiresAt,
  });
};

const deleteResume = async (publicId) => {
  if (!publicId) return;
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
    type: "authenticated",
    invalidate: true,
  });
};

const uploadProfileImage = async (file) => {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    return null;
  }

  return uploadBuffer({
    buffer: file.buffer,
    folder: "br30-talent-pipeline/profile-images",
    resourceType: "image",
  });
};

module.exports = {
  uploadResume,
  uploadProfileImage,
  createResumeDownloadUrl,
  deleteResume,
};
