import { API_BASE_URL } from "../consts";
import { auth } from "../firebase";

interface UploadResult {
  downloadUrl: string;
  filePath: string;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function uploadBackgroundMedia(
  file: File,
  userId: string,
  collectionId: string,
  isTemplate?: boolean
): Promise<UploadResult> {
  // Validate file type (client-side check)
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type. Supported formats: ${VALID_IMAGE_TYPES.map(
        (t) => t.split("/")[1]
      ).join(", ")}`
    );
  }

  // Validate file size (client-side check)
  if (file.size > MAX_IMAGE_SIZE) {
    const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    throw new Error(`File size exceeds maximum of ${maxSizeMB}MB`);
  }

  // Get Firebase ID token for authentication
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  let idToken: string;
  try {
    idToken = await user.getIdToken();
  } catch {
    throw new Error("Failed to get authentication token");
  }

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  formData.append("collectionId", collectionId);
  if (isTemplate) {
    formData.append("isTemplate", "true");
  }

  // Upload file to server (server validates and uploads to storage)
  const uploadResponse = await fetch(
    `${API_BASE_URL}/api/upload-background-image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        // Note: Don't set Content-Type header - browser will set it automatically with boundary
      },
      body: formData,
    }
  );

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to upload image");
  }

  const { downloadUrl, filePath } = await uploadResponse.json();

  return {
    downloadUrl,
    filePath,
  };
}

export async function deleteBackgroundMedia(
  userId: string,
  collectionId: string | undefined,
  fileUrl: string
): Promise<void> {
  // Get Firebase ID token for authentication
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  let idToken: string;
  try {
    idToken = await user.getIdToken();
  } catch {
    throw new Error("Failed to get authentication token");
  }

  const deleteResponse = await fetch(`${API_BASE_URL}/api/background-media`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      userId,
      collectionId,
      fileUrl,
    }),
  });

  if (!deleteResponse.ok) {
    const errorData = await deleteResponse
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to delete file");
  }
}
