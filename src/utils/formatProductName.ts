/**
 * Formats a product variant display string with SKU listed before name.
 * Example: "SKU123 - Widget" or just "Widget" if no SKU.
 */
export const formatProductName = (
  name: string | null | undefined,
  sku?: string | null,
  fallback = "Unknown Product"
): string => {
  const displayName = name || fallback;
  if (sku) {
    return `${sku} - ${displayName}`;
  }
  return displayName;
};

/**
 * Formats product name followed by variant name.
 * Example: "Dettol Soap 500ml" when product is "Dettol Soap" and variant is "500ml".
 */
export const formatProductWithVariant = (
  productName: string | null | undefined,
  variantName: string | null | undefined,
  fallback = "Unknown Product"
): string => {
  const product = productName?.trim() || "";
  const variant = variantName?.trim() || "";

  if (product && variant) {
    if (product.toLowerCase() === variant.toLowerCase()) {
      return product;
    }
    return `${product} ${variant}`;
  }

  return product || variant || fallback;
};
