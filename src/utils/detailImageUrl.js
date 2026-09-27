export function detailImageUrl(url, width=1200) {
  if (
    typeof url !== "string" ||
    !url.includes("res.cloudinary.com/") ||
    !url.includes("/upload/")
  ) return url;

  if (/\/upload\/(?:s--|[^/]*w_\d)/.test(url)) return url;

  return url.replace(
    "/upload/",
    "/upload/c_limit,w_"+width+",q_auto,f_auto/"
  );
}
