import { uploadToS3, S3_ENDPOINT, S3_BUCKET } from "@/lib/s3";

const REPORT_MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain; charset=utf-8",
};

export function getReportMimeType(ext: string): string {
  return REPORT_MIME_TYPES[ext.toLowerCase()] ?? "application/octet-stream";
}

function getFileExtension(file: File): string {
  const nameExt = file.name.split(".").pop()?.toLowerCase();
  if (nameExt) return nameExt;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadSurveyMedia(ownerId: string, file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("INVALID_MEDIA_TYPE");
  if (file.size > 5 * 1024 * 1024) throw new Error("MEDIA_TOO_LARGE");

  const extension = getFileExtension(file);
  const key = `survey-media/${ownerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  return uploadToS3(buffer, key, file.type || "application/octet-stream");
}

export async function uploadSurveyReport(surveyId: string, buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) throw new Error("EMPTY_REPORT_BUFFER");

  const key = `reports/${surveyId}-${Date.now()}.pdf`;
  return uploadToS3(buffer, key, "application/pdf");
}

export async function uploadExpertReviewReport(
  requestId: string,
  buffer: Buffer,
  extension: "pdf" | "docx" | "txt" = "pdf",
): Promise<string> {
  if (!buffer || buffer.length === 0) throw new Error("EMPTY_REPORT_BUFFER");

  if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
    if (process.env.NODE_ENV !== "production") {
      const { saveExpertReportLocally } = await import("@/lib/local-storage");
      return saveExpertReportLocally(requestId, buffer, extension);
    }
    throw new Error("S3_NOT_CONFIGURED: добавьте S3_ACCESS_KEY и S3_SECRET_KEY.");
  }

  const mimeType = getReportMimeType(extension);
  const key = `expert-reports/${requestId}-${Date.now()}.${extension}`;
  return uploadToS3(buffer, key, mimeType);
}

export function getPublicUrl(key: string): string {
  return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
}
