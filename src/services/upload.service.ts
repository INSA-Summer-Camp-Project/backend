import { v2 as cloudinary } from "cloudinary";

import { BadRequestError, ForbiddenError } from "@/errors";

// Cloudinary SDK auto-detects CLOUDINARY_URL from environment
cloudinary.config();

const ALLOWED_UPLOAD_TYPES = ["profile", "portfolio", "certificate"] as const;
type UploadType = (typeof ALLOWED_UPLOAD_TYPES)[number];

export const generateUploadSignature = (
  userId: string,
  uploadType: UploadType,
) => {
  if (!ALLOWED_UPLOAD_TYPES.includes(uploadType)) {
    throw new BadRequestError(
      `Invalid upload type: ${uploadType}. Must be one of: ${ALLOWED_UPLOAD_TYPES.join(", ")}`,
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `servicehub/${userId}/${uploadType}`;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    cloudinary.config().api_secret as string,
  );

  return {
    signature,
    timestamp,
    apiKey: cloudinary.config().api_key as string,
    cloudName: cloudinary.config().cloud_name as string,
    folder,
  };
};

export const deleteFile = async (publicId: string, userId: string) => {
  if (!publicId.startsWith(`servicehub/${userId}/`)) {
    throw new ForbiddenError("Cannot delete files belonging to other users");
  }

  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};
