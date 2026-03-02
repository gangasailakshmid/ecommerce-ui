export function getStyleInitials(styleName) {
  if (!styleName) {
    return "PR";
  }

  return styleName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getFirstImageFromArray(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const firstItem = images[0];
  if (typeof firstItem === "string") {
    return firstItem;
  }

  if (firstItem && typeof firstItem === "object") {
    return firstItem.url || firstItem.imageUrl || firstItem.src || null;
  }

  return null;
}

export function getProductImageUrl(product) {
  if (!product || typeof product !== "object") {
    return null;
  }

  return (
    product.imageUrl ||
    product.image ||
    product.thumbnailUrl ||
    getFirstImageFromArray(product.images) ||
    getFirstImageFromArray(product.media) ||
    null
  );
}
