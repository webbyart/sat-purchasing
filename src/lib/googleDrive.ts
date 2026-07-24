import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase.js';

// Constant parent folder ID requested by the user
export const GOOGLE_DRIVE_FOLDER_ID = '1q8tRnAm9RsG9fAeAOilOMlcnDgAvPjGC';

// In-memory token cache (Do NOT store in localStorage or sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Initiates Google OAuth2 sign-in popup to obtain the required Google Drive scopes.
 */
export async function connectGoogleDrive(): Promise<string> {
  const provider = new GoogleAuthProvider();
  // Request scope to manage files created or opened by this app
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Auth.');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (error: any) {
    console.error('Google Drive connection failed:', error);
    throw error;
  }
}

/**
 * Converts a base64 Data URL (from FileReader) into a standard Uint8Array
 */
export function base64ToUint8Array(base64DataUrl: string): { data: Uint8Array; mimeType: string } {
  const parts = base64DataUrl.split(';base64,');
  const mimeType = parts[0].split(':')[1] || 'application/octet-stream';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return { data: uInt8Array, mimeType };
}

/**
 * Uploads a file (provided as base64 Data URL) to the user's Google Drive.
 * Stores the file in the designated parent folder if provided.
 */
export async function uploadToGoogleDrive(
  accessToken: string,
  fileName: string,
  base64Url: string,
  parentId: string = GOOGLE_DRIVE_FOLDER_ID
): Promise<{ id: string; name: string; webViewLink: string; webContentLink: string }> {
  try {
    const { data, mimeType } = base64ToUint8Array(base64Url);

    const metadata = {
      name: fileName,
      mimeType: mimeType,
      parents: parentId ? [parentId] : []
    };

    const boundary = '3d0f1a2b3c4d5e6f';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const part1Header = `Content-Type: application/json; charset=UTF-8\r\n\r\n`;
    const part1 = JSON.stringify(metadata);
    const part2Header = `Content-Type: ${mimeType}\r\n\r\n`;

    // Construct the multipart body parts as ArrayBuffers and Blobs to prevent encoding corruption of binary files
    const headerBlob = new Blob([
      delimiter,
      part1Header,
      part1,
      `\r\n--${boundary}\r\n`,
      part2Header
    ]);
    const footerBlob = new Blob([closeDelim]);

    const multipartBlob = new Blob([headerBlob, data, footerBlob], {
      type: `multipart/related; boundary=${boundary}`
    });

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBlob
      }
    );

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Google Drive Upload API error: ${response.status} - ${errorMsg}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      name: result.name,
      webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
      webContentLink: result.webContentLink || `https://drive.google.com/uc?id=${result.id}&export=download`
    };
  } catch (err: any) {
    console.error('Error in uploadToGoogleDrive:', err);
    throw err;
  }
}
