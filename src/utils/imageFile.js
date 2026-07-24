import heic2any from "heic2any";

export const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif";

const MEGABYTE = 1024 * 1024;
const DEFAULT_MAX_OUTPUT_BYTES = 9 * MEGABYTE;
const DEFAULT_MAX_INPUT_BYTES = 200 * MEGABYTE;
const DEFAULT_MAX_HEIC_INPUT_BYTES = 25 * 1024 * 1024;
export const MAX_PROMO_UPLOAD_BYTES = 200 * 1024 * 1024;
export const CLOUDINARY_SAFE_IMAGE_BYTES = 9 * MEGABYTE;
const STANDARD_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);
const STANDARD_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionOf(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function isHeic(file) {
  const extension = extensionOf(file?.name);
  const type = String(file?.type || "").toLowerCase();
  return HEIC_EXTENSIONS.has(extension) || /image\/hei[cf]/.test(type);
}

function bytesToMegabytes(bytes) {
  return Math.floor(Number(bytes || 0) / 1024 / 1024);
}

function assertStandardImage(file, maxBytes = DEFAULT_MAX_OUTPUT_BYTES) {
  const extension = extensionOf(file?.name);
  const mimeType = String(file?.type || "").toLowerCase();

  if (
    !STANDARD_EXTENSIONS.has(extension) ||
    (mimeType && !STANDARD_MIME_TYPES.has(mimeType))
  ) {
    throw new Error(
      "Şəkil JPG, PNG, WEBP, HEIC və ya HEIF formatında olmalıdır.",
    );
  }

  if (file.size > maxBytes) {
    throw new Error(
      `Şəkil maksimum ${bytesToMegabytes(maxBytes)} MB ola bilər.`,
    );
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Şəkil optimallaşdırıla bilmədi."));
      },
      type,
      quality,
    );
  });
}

async function loadImage(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error("Şəkil brauzerdə oxuna bilmədi."));
      image.src = objectUrl;
    });

    return image;
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function optimizeWithoutResizing(file, maxOutputBytes) {
  if (file.size <= maxOutputBytes) return file;

  const image = await loadImage(file);
  const objectUrl = image.src;

  try {
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (!width || !height) {
      throw new Error("Şəkilin ölçüləri oxuna bilmədi.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!context) {
      throw new Error("Şəkil optimallaşdırma sistemi açıla bilmədi.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);

    const qualities = [0.98, 0.96, 0.94, 0.92, 0.9, 0.87, 0.84, 0.8];
    let smallestBlob = null;

    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, "image/webp", quality);

      if (!smallestBlob || blob.size < smallestBlob.size) {
        smallestBlob = blob;
      }

      if (blob.size <= maxOutputBytes) {
        const baseName =
          file.name.replace(/\.[^.]+$/, "") || "nemesisbaku-promo";

        return new File([blob], `${baseName}.webp`, {
          type: "image/webp",
          lastModified: file.lastModified || Date.now(),
        });
      }
    }

    const currentMb = (
      Number(smallestBlob?.size || file.size) /
      MEGABYTE
    ).toFixed(1);

    throw new Error(
      `Şəkil ölçüsü dəyişdirilmədən ${currentMb} MB-a qədər sıxıldı, amma Cloudinary limitinə sığmadı. Şəkli WebP kimi export edib yenidən seçin.`,
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareImageFile(file, options = {}) {
  const maxOutputBytes =
    options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const maxInputBytes =
    options.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES;
  const maxHeicInputBytes =
    options.maxHeicInputBytes ?? DEFAULT_MAX_HEIC_INPUT_BYTES;

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seçilmiş şəkil boşdur və ya oxuna bilmir.");
  }

  if (!isHeic(file)) {
    assertStandardImage(file, maxInputBytes);
    const optimizedFile = await optimizeWithoutResizing(
      file,
      maxOutputBytes,
    );
    assertStandardImage(optimizedFile, maxOutputBytes);
    return optimizedFile;
  }

  if (file.size > maxHeicInputBytes) {
    throw new Error(
      `HEIC/HEIF şəkli maksimum ${bytesToMegabytes(maxHeicInputBytes)} MB ola bilər.`,
    );
  }

  let converted;

  try {
    converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
  } catch {
    throw new Error(
      "HEIC/HEIF şəkli çevrilmədi. Şəkli Photos-dan JPEG kimi export edib yenidən seçin.",
    );
  }

  const blob = Array.isArray(converted) ? converted[0] : converted;
  const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "image";
  const jpegFile = new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified || Date.now(),
  });

  const optimizedFile = await optimizeWithoutResizing(
    jpegFile,
    maxOutputBytes,
  );
  assertStandardImage(optimizedFile, maxOutputBytes);
  return optimizedFile;
}

export async function prepareImageFiles(fileList) {
  const prepared = [];

  // Böyük Mac şəkillərində yaddaş sıçrayışı olmaması üçün ardıcıl çeviririk.
  for (const file of Array.from(fileList || [])) {
    prepared.push(await prepareImageFile(file));
  }

  return prepared;
}

export function revokeImagePreview(url) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
