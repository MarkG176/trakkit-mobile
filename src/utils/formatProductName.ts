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

const trimValue = (value: string | null | undefined) => value?.trim() || null;

/** True when a label looks like a pack size rather than a product name. */
export const isVariantSizeToken = (value: string) =>
  /^\d+(\.\d+)?\s*(ml|g|kg|l|oz|ltr|pack|pcs?|pc)$/i.test(value.trim()) ||
  /^\d+(\.\d+)?$/.test(value.trim());

/**
 * Resolves catalog product name and variant label from mixed inventory fields.
 * Ensures the product name is never a size token when a real product name exists.
 */
export const resolveProductVariantLabels = ({
  catalogProductName,
  inventoryName,
  variantName,
  sku,
}: {
  catalogProductName?: string | null;
  inventoryName?: string | null;
  variantName?: string | null;
  sku?: string | null;
}): { productName: string | null; variantLabel: string | null } => {
  const catalog = trimValue(catalogProductName);
  const inventory = trimValue(inventoryName);
  const rawVariant = trimValue(variantName);
  const rawSku = trimValue(sku);

  const productCandidates = [catalog, inventory, rawVariant].filter(Boolean) as string[];
  let productName =
    productCandidates.find((candidate) => !isVariantSizeToken(candidate)) ||
    productCandidates[0] ||
    null;

  const productKey = (productName || "").toLowerCase();
  let variantLabel: string | null = null;

  if (rawSku && rawSku.toLowerCase() !== productKey) {
    variantLabel = rawSku;
  } else if (rawVariant && rawVariant.toLowerCase() !== productKey) {
    variantLabel = rawVariant;
  }

  if (
    productName &&
    variantLabel &&
    isVariantSizeToken(productName) &&
    !isVariantSizeToken(variantLabel)
  ) {
    return { productName: variantLabel, variantLabel: productName };
  }

  return { productName, variantLabel };
};

/**
 * Formats product name followed by variant name.
 * Example: "Hair food 250ml" when product is "Hair food" and variant is "250ml".
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
