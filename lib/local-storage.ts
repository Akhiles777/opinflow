import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export async function saveExpertReportLocally(
  requestId: string,
  buffer: Buffer,
  extension: "pdf" | "docx" | "txt" = "pdf",
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, "expert-reports");
  await mkdir(dir, { recursive: true });

  const filename = `${requestId}-${Date.now()}.${extension}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);

  return `/api/files/expert-reports/${filename}`;
}

export async function saveMediaLocally(
  ownerId: string,
  buffer: Buffer,
  extension: string,
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, "survey-media");
  await mkdir(dir, { recursive: true });

  const filename = `${ownerId}-${Date.now()}.${extension}`;
  await writeFile(path.join(dir, filename), buffer);

  return `/api/files/media/${filename}`;
}

export async function saveAvatarLocally(
  userId: string,
  buffer: Buffer,
  extension: string,
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, "avatars");
  await mkdir(dir, { recursive: true });

  const filename = `${userId}-${Date.now()}.${extension}`;
  await writeFile(path.join(dir, filename), buffer);

  return `/api/files/avatars/${filename}`;
}
