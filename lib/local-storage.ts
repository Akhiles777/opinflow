import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export async function saveExpertReportLocally(requestId: string, buffer: Buffer): Promise<string> {
  const dir = path.join(UPLOAD_DIR, "expert-reports");
  await mkdir(dir, { recursive: true });

  const filename = `${requestId}-${Date.now()}.pdf`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);

  return `/api/files/expert-reports/${filename}`;
}
