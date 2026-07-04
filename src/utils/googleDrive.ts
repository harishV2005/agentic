export interface DriveBackupData {
  appName: string;
  backupDate: string;
  profile: {
    name: string;
    location: string;
    crops: string;
    farmSize: string;
    farmUnit: string;
    soilType: string;
  };
  priceAlerts: any[];
  notifications: any[];
}

/**
 * Searches for an existing backup file named 'agriseva_backup.json' in the user's Google Drive.
 * Returns the file ID if found, or null.
 */
export async function findExistingBackup(accessToken: string): Promise<string | null> {
  try {
    const q = encodeURIComponent("name = 'agriseva_backup.json' and trashed = false");
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name)`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Drive search failed:", errorText);
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error("Error searching for Google Drive backup:", error);
    return null;
  }
}

/**
 * Creates a new empty backup file in the user's Google Drive with metadata.
 * Returns the new file ID.
 */
export async function createBackupFileMetadata(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "agriseva_backup.json",
        mimeType: "application/json",
        description: "AgriSeva AI - Profile and Farming History Backup",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Drive metadata creation failed:", errorText);
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error creating Google Drive file metadata:", error);
    return null;
  }
}

/**
 * Uploads/overwrites content of an existing Google Drive file.
 */
export async function uploadBackupContent(
  accessToken: string,
  fileId: string,
  backupData: DriveBackupData
): Promise<boolean> {
  try {
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backupData, null, 2),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Drive file content upload failed:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error uploading Google Drive backup content:", error);
    return false;
  }
}

/**
 * Orchestrates the full backup sync flow.
 * Search -> Update or Create -> Upload
 */
export async function syncDataToGoogleDrive(
  accessToken: string,
  backupData: DriveBackupData
): Promise<boolean> {
  // 1. Search for existing file
  let fileId = await findExistingBackup(accessToken);

  // 2. If not found, create the metadata
  if (!fileId) {
    fileId = await createBackupFileMetadata(accessToken);
  }

  if (!fileId) {
    console.error("Unable to obtain Google Drive file ID for backup.");
    return false;
  }

  // 3. Upload the backup payload
  return await uploadBackupContent(accessToken, fileId, backupData);
}
