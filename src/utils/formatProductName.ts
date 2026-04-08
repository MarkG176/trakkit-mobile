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
