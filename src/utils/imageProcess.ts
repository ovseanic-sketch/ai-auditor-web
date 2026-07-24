export interface Adjustments {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -50 to 50
  sharpness: number; // 0 to 10
  shadowIntensity: number; // 0 to 100
  bgColor: string; // e.g. 'transparent', '#ffffff', '#f1f5f9', '#000000'
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  shadowIntensity: 20,
  bgColor: "transparent",
};

/**
 * Apply canvas post-processing filters & adjustments to an image data URL
 */
export async function processCanvasAdjustments(
  imageUrl: string,
  adjustments: Adjustments
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(imageUrl);

      // Handle custom solid background if background isn't transparent
      if (adjustments.bgColor && adjustments.bgColor !== "transparent") {
        ctx.fillStyle = adjustments.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw contact shadow if specified
      if (adjustments.shadowIntensity > 0) {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, " + (adjustments.shadowIntensity / 100) * 0.6 + ")";
        ctx.shadowBlur = 30 + adjustments.shadowIntensity * 0.5;
        ctx.shadowOffsetY = 15 + adjustments.shadowIntensity * 0.3;
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      }

      // Apply filter string
      const brightnessVal = 100 + adjustments.brightness;
      const contrastVal = 100 + adjustments.contrast;
      const saturateVal = 100 + adjustments.saturation;

      ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%)`;
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image for canvas processing"));
    img.src = imageUrl;
  });
}

/**
 * Download data URL as a file
 */
export function downloadImage(dataUrl: string, filename = "studio-product-photo.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy data URL image to Clipboard
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    return true;
  } catch (err) {
    console.error("Clipboard write error:", err);
    return false;
  }
}
