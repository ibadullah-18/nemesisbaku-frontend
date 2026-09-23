export function cloudinaryResize(url, width) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*w_\d/.test(url)) return url; // artıq ölçülüb
  return url.replace("/upload/", `/upload/w_${width},q_auto:best,f_auto,dpr_auto/`);
}