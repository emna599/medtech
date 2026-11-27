/** Réduit la photo (les photos de téléphone font plusieurs millions de pixels) pour une lecture plus rapide. */
async function shrink(file: File, maxSide = 1600): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.92));
  } catch {
    return file;
  }
}

/**
 * Lit les caractères d'une photo d'étiquette, directement dans le navigateur (Tesseract.js, langue française).
 * La bibliothèque n'est chargée qu'au premier usage ; au premier appel elle télécharge ses fichiers de langue.
 */
export async function readLabelText(file: File, onProgress?: (ratio: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('fra', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress?.(message.progress);
      }
    },
  });
  try {
    const { data } = await worker.recognize(await shrink(file));
    return data.text;
  } finally {
    await worker.terminate();
  }
}
