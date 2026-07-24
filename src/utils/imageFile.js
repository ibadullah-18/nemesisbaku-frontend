import heic2any from "heic2any";

export const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif";

const DEFAULT_MAX_OUTPUT_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_HEIC_INPUT_BYTES = 25 * 1024 * 1024;
export const MAX_PROMO_UPLOAD_BYTES = 200 * 1024 * 1024;
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

export async function prepareImageFile(file, options = {}) {
  const maxOutputBytes =
    options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const maxHeicInputBytes =
    options.maxHeicInputBytes ?? DEFAULT_MAX_HEIC_INPUT_BYTES;

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seçilmiş şəkil boşdur və ya oxuna bilmir.");
  }

  if (!isHeic(file)) {
    assertStandardImage(file, maxOutputBytes);
    return file;
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

  assertStandardImage(jpegFile, maxOutputBytes);
  return jpegFile;
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