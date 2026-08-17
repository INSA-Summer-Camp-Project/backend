import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary globally
cloudinary.config({});

export const generateUploadSignature = (folder = "servicehub") => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    cloudinary.config().api_secret as string,
  );

  return {
    signature,
    timestamp,
    apiKey: cloudinary.config().api_key as string,
    cloudName: cloudinary.config().cloud_name as string,
  };
};
