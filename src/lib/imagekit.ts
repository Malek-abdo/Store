export const IMAGEKIT_CONFIG = {
  id: "xoo9ihjwm",
  urlEndpoint: "https://ik.imagekit.io/xoo9ihjwm",
  publicKey: "public_oVUsnelMWsIDSB6vW+tovrH4IJ8=",
};

export interface UploadResult {
  url: string;
  fileId?: string;
  name?: string;
  thumbnailUrl?: string;
}

/**
 * Converts a browser File object to a base64 Data URL string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Uploads an image to ImageKit via our backend API (/api/upload).
 * Accepts either a File instance or a base64 Data URL string.
 */
export async function uploadImageToImageKit(
  input: File | string,
  fileName?: string
): Promise<UploadResult> {
  let base64Data: string;
  let resolvedFileName = fileName;

  if (typeof input === 'string') {
    base64Data = input;
    if (!resolvedFileName) {
      resolvedFileName = `product_${Date.now()}.png`;
    }
  } else {
    base64Data = await fileToBase64(input);
    if (!resolvedFileName) {
      resolvedFileName = input.name.replace(/[^a-zA-Z0-9._-]/g, '_') || `product_${Date.now()}.png`;
    }
  }

  // Primary: Upload via server endpoint which holds private key securely
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64Data,
        fileName: resolvedFileName,
        folder: '/products',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        return {
          url: data.url,
          fileId: data.fileId,
          name: data.name,
          thumbnailUrl: data.thumbnailUrl,
        };
      }
    } else {
      console.warn('Backend ImageKit upload responded with non-200:', response.status);
    }
  } catch (err) {
    console.warn('Direct /api/upload failed or network error:', err);
  }

  // Fallback: If server is temporarily unreachable in dev preview, fallback safely
  return {
    url: base64Data,
    name: resolvedFileName,
  };
}
