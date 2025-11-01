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
  collectionId: string
): Promise<UploadResult> {
  // Validate file type
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type. Supported formats: ${VALID_IMAGE_TYPES.map(
        (t) => t.split("/")[1]
      ).join(", ")}`
    );
  }

  // Validate file size
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

  // Get signed upload URL from backend
  const getUrlResponse = await fetch(`${API_BASE_URL}/api/get-upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      userId,
      collectionId,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  if (!getUrlResponse.ok) {
    const errorData = await getUrlResponse
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to get upload URL");
  }

  const { uploadUrl, filePath, downloadUrl } = await getUrlResponse.json();

  // Upload file directly to Firebase Storage using signed URL
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to storage");
  }

  // Make the file public after upload
  const makePublicResponse = await fetch(
    `${API_BASE_URL}/api/make-file-public`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        userId,
        filePath,
      }),
    }
  );

  if (!makePublicResponse.ok) {
    const errorData = await makePublicResponse
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to make file public");
  }

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
