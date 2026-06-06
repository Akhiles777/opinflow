const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SURVEY_MEDIA_BUCKET = process.env.SUPABASE_SURVEY_MEDIA_BUCKET || "survey-media";
const SUPABASE_REPORTS_BUCKET = process.env.SUPABASE_REPORTS_BUCKET || "opinflow-media";

const REPORT_MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain; charset=utf-8",
};

export function getReportMimeType(ext: string): string {
  return REPORT_MIME_TYPES[ext.toLowerCase()] ?? "application/octet-stream";
}

function getAuthHeaders(contentType?: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_STORAGE_NOT_CONFIGURED");
  }
  return {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

function getFileExtension(file: File) {
  const nameExtension = file.name.split(".").pop()?.toLowerCase();
  if (nameExtension) return nameExtension;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Supabase free tier "wakes up" its internal DB on first request after idle.
// Uploads that hit the DB metadata layer can return 544 DatabaseTimeout on the first attempt.
// Retrying after a short pause succeeds once the DB is awake.
async function supabaseUploadWithRetry(
  url: string,
  headers: Record<string, string>,
  body: Buffer,
  maxAttempts = 3,
): Promise<Response> {
  let lastResponse: Response | null = null;
  // Cast needed because TS @types/node Buffer generic doesn't satisfy BodyInit in strict mode
  const fetchBody = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as unknown as BodyInit;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url, { method: "POST", headers: { ...headers, "x-upsert": "true" }, body: fetchBody });

    if (response.ok) return response;

    // 544 = DatabaseTimeout — Supabase DB is waking up; retry after backoff
    const isTimeout = response.status === 544 || response.status === 503;
    if (!isTimeout || attempt === maxAttempts) {
      lastResponse = response;
      break;
    }

    console.warn(`[storage] Supabase upload attempt ${attempt} returned ${response.status}. Retrying in ${attempt * 2}s…`);
    await sleep(attempt * 2000);
  }

  return lastResponse!;
}

async function ensureBucketExists(params: {
  bucket: string;
  fileSizeLimit: string;
  mimeTypes: string[];
}) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${params.bucket}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (response.ok) return;

  const createResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: getAuthHeaders("application/json"),
    body: JSON.stringify({
      id: params.bucket,
      name: params.bucket,
      public: true,
      file_size_limit: params.fileSizeLimit,
      allowed_mime_types: params.mimeTypes,
    }),
  });

  if (createResponse.ok || createResponse.status === 409) return;

  const text = await createResponse.text();
  throw new Error(`SUPABASE_BUCKET_CREATE_FAILED: ${text}`);
}

export async function uploadSurveyMedia(ownerId: string, file: File) {
  if (!file || file.size === 0) return null;

  if (!file.type.startsWith("image/")) throw new Error("INVALID_MEDIA_TYPE");
  if (file.size > 5 * 1024 * 1024) throw new Error("MEDIA_TOO_LARGE");

  await ensureBucketExists({
    bucket: SUPABASE_SURVEY_MEDIA_BUCKET,
    fileSizeLimit: "5242880",
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  const extension = getFileExtension(file);
  const filePath = `survey-media/${ownerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const response = await supabaseUploadWithRetry(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_SURVEY_MEDIA_BUCKET}/${filePath}`,
    getAuthHeaders(file.type || "application/octet-stream"),
    buffer,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SUPABASE_UPLOAD_FAILED: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_SURVEY_MEDIA_BUCKET}/${filePath}`;
}

export async function uploadSurveyReport(surveyId: string, buffer: Buffer) {
  if (!buffer || buffer.length === 0) throw new Error("EMPTY_REPORT_BUFFER");

  await ensureBucketExists({
    bucket: SUPABASE_REPORTS_BUCKET,
    fileSizeLimit: "52428800",
    mimeTypes: ["application/pdf"],
  });

  const filePath = `reports/${surveyId}-${Date.now()}.pdf`;

  const response = await supabaseUploadWithRetry(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_REPORTS_BUCKET}/${filePath}`,
    getAuthHeaders("application/pdf"),
    buffer,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SUPABASE_REPORT_UPLOAD_FAILED: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_REPORTS_BUCKET}/${filePath}`;
}

export async function uploadExpertReviewReport(
  requestId: string,
  buffer: Buffer,
  extension: "pdf" | "docx" | "txt" = "pdf",
) {
  if (!buffer || buffer.length === 0) throw new Error("EMPTY_REPORT_BUFFER");

  // No Supabase configured → use local FS (dev only)
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const { saveExpertReportLocally } = await import("@/lib/local-storage");
    return saveExpertReportLocally(requestId, buffer, extension);
  }

  const mimeType = getReportMimeType(extension);
  const filePath = `expert-reports/${requestId}-${Date.now()}.${extension}`;

  // Don't call ensureBucketExists — the bucket already exists and we don't need to
  // re-validate mime types on every upload (service role bypasses enforcement anyway).
  // Calling ensureBucketExists adds an extra round-trip that can also timeout.
  const response = await supabaseUploadWithRetry(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_REPORTS_BUCKET}/${filePath}`,
    getAuthHeaders(mimeType),
    buffer,
  );

  if (!response.ok) {
    const text = await response.text();

    // Supabase still failing after retries → fall back to local storage in dev,
    // or surface a clean message in production
    if (process.env.NODE_ENV !== "production") {
      console.warn("[storage] Supabase upload failed, falling back to local storage:", text);
      const { saveExpertReportLocally } = await import("@/lib/local-storage");
      return saveExpertReportLocally(requestId, buffer, extension);
    }

    throw new Error(`UPLOAD_FAILED: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_REPORTS_BUCKET}/${filePath}`;
}
