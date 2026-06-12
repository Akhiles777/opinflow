import { uploadToS3, isS3Configured } from "@/lib/s3";

function getFileExtension(file: File): string {
  const nameExt = file.name.split(".").pop()?.toLowerCase();
  if (nameExt) return nameExt;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("INVALID_IMAGE_TYPE");
  if (file.size > 5 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE");

  const extension = getFileExtension(file);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isS3Configured()) {
    if (process.env.NODE_ENV !== "production") {
      const { saveAvatarLocally } = await import("@/lib/local-storage");
      return saveAvatarLocally(userId, buffer, extension);
    }
    throw new Error("S3_NOT_CONFIGURED");
  }

  const key = `avatars/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  return uploadToS3(buffer, key, file.type || "application/octet-stream");
}
