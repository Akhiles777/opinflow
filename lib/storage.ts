const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SURVEY_MEDIA_BUCKET = process.env.SUPABASE_SURVEY_MEDIA_BUCKET || "survey-media";
const SUPABASE_REPORTS_BUCKET = process.env.SUPABASE_REPORTS_BUCKET || "opinflow-media";

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

  if (response.ok) {
    return;
  }

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

  if (createResponse.ok || createResponse.status === 409) {
    return;
  }

  const text = await createResponse.text();
  throw new Error(`SUPABASE_BUCKET_CREATE_FAILED: ${text}`);
}

export async function uploadSurveyMedia(ownerId: string, file: File) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("INVALID_MEDIA_TYPE");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("MEDIA_TOO_LARGE");
  }

  await ensureBucketExists({
    bucket: SUPABASE_SURVEY_MEDIA_BUCKET,
    fileSizeLimit: "5242880",
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  const extension = getFileExtension(file);
  const filePath = `survey-media/${ownerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_SURVEY_MEDIA_BUCKET}/${filePath}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(file.type || "application/octet-stream"),
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SUPABASE_UPLOAD_FAILED: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_SURVEY_MEDIA_BUCKET}/${filePath}`;
}

export async function uploadSurveyReport(surveyId: string, buffer: Buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("EMPTY_REPORT_BUFFER");
  }

  await ensureBucketExists({
    bucket: SUPABASE_REPORTS_BUCKET,
    fileSizeLimit: "52428800",
    mimeTypes: ["application/pdf"],
  });

  const filePath = `reports/${surveyId}-${Date.now()}.pdf`;

  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_REPORTS_BUCKET}/${filePath}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders("application/pdf"),
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SUPABASE_REPORT_UPLOAD_FAILED: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_REPORTS_BUCKET}/${filePath}`;
}
