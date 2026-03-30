const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_AVATARS_BUCKET = process.env.SUPABASE_AVATARS_BUCKET || "profile-images";

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
  if (nameExtension) {
    return nameExtension;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function ensureBucketExists() {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${SUPABASE_AVATARS_BUCKET}`, {
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
      id: SUPABASE_AVATARS_BUCKET,
      name: SUPABASE_AVATARS_BUCKET,
      public: true,
      file_size_limit: "5242880",
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
    }),
  });

  if (createResponse.ok || createResponse.status === 409) {
    return;
  }

  const text = await createResponse.text();
  throw new Error(`SUPABASE_BUCKET_CREATE_FAILED: ${text}`);
}

export async function uploadProfileAvatar(userId: string, file: File) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  await ensureBucketExists();

  const extension = getFileExtension(file);
  const filePath = `avatars/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const uploadResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_AVATARS_BUCKET}/${filePath}`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(file.type || "application/octet-stream"),
        "x-upsert": "true",
      },
      body: Buffer.from(arrayBuffer),
    },
  );

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`SUPABASE_UPLOAD_FAILED: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_AVATARS_BUCKET}/${filePath}`;
}
