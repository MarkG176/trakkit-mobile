import { mergeWithDefaults } from "@/data/mobileComponentsCatalog";

export type StockReportMode = "availability" | "count" | "both";

export type StockReportCapabilities = {
  morningAvailability: boolean;
  morningCount: boolean;
  eveningAvailability: boolean;
  eveningCount: boolean;
};

const MODE_KEYS = [
  "stock_report_mode",
  "instore_stock_report",
  "stock_report",
  "report_mode",
] as const;

const MORNING_MODE_KEYS = ["morning_report_mode", "morning_stock_report"] as const;
const EVENING_MODE_KEYS = ["evening_report_mode", "evening_stock_report"] as const;

function parseModeValue(value: unknown): StockReportMode | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "availability" || normalized === "count" || normalized === "both") {
    return normalized;
  }
  return null;
}

function capabilitiesFromMode(mode: StockReportMode): StockReportCapabilities {
  const availability = mode === "availability" || mode === "both";
  const count = mode === "count" || mode === "both";
  return {
    morningAvailability: availability,
    morningCount: count,
    eveningAvailability: availability,
    eveningCount: count,
  };
}

/** Read availability / count / both flags stored directly on active_components jsonb. */
function capabilitiesFromBooleanFlags(raw: Record<string, unknown>): StockReportCapabilities | null {
  const availability = raw.availability === true;
  const count = raw.count === true;
  const both = raw.both === true;

  if (!availability && !count && !both) return null;

  if (both || (availability && count)) {
    return capabilitiesFromMode("both");
  }
  if (availability) {
    return {
      morningAvailability: true,
      morningCount: false,
      eveningAvailability: true,
      eveningCount: false,
    };
  }
  return {
    morningAvailability: false,
    morningCount: true,
    eveningAvailability: false,
    eveningCount: true,
  };
}

function capabilitiesFromModeKeys(raw: Record<string, unknown>): StockReportCapabilities | null {
  for (const key of MODE_KEYS) {
    const mode = parseModeValue(raw[key]);
    if (mode) return capabilitiesFromMode(mode);
  }

  const morningMode =
    MORNING_MODE_KEYS.map((k) => parseModeValue(raw[k])).find(Boolean) ?? null;
  const eveningMode =
    EVENING_MODE_KEYS.map((k) => parseModeValue(raw[k])).find(Boolean) ?? null;

  if (!morningMode && !eveningMode) return null;

  const morning = morningMode ? capabilitiesFromMode(morningMode) : null;
  const evening = eveningMode ? capabilitiesFromMode(eveningMode) : null;

  return {
    morningAvailability: morning?.morningAvailability ?? evening?.morningAvailability ?? false,
    morningCount: morning?.morningCount ?? evening?.morningCount ?? false,
    eveningAvailability: evening?.eveningAvailability ?? morning?.eveningAvailability ?? false,
    eveningCount: evening?.eveningCount ?? morning?.eveningCount ?? false,
  };
}

/** Fallback when only CRM toggles exist (legacy mobile_components shape). */
function capabilitiesFromCrmCodes(raw: Record<string, boolean>): StockReportCapabilities {
  const codes = mergeWithDefaults(raw) as Record<string, boolean>;
  const stockReport = codes["CRM-0022"] ?? false;
  const morningCount = codes["CRM-0021"] ?? false;
  const eveningCount = codes["CRM-0020"] ?? false;

  return {
    morningAvailability: stockReport,
    morningCount: morningCount,
    eveningAvailability: stockReport,
    eveningCount: eveningCount,
  };
}

function applyCrmGates(
  caps: StockReportCapabilities,
  codes: Record<string, boolean>,
): StockReportCapabilities {
  const stockReport = codes["CRM-0022"] ?? true;
  const morningCount = codes["CRM-0021"] ?? true;
  const eveningCount = codes["CRM-0020"] ?? true;

  return {
    morningAvailability: caps.morningAvailability && stockReport,
    morningCount: caps.morningCount && morningCount,
    eveningAvailability: caps.eveningAvailability && stockReport,
    eveningCount: caps.eveningCount && eveningCount,
  };
}

/**
 * Resolves which stock report entry points to show on the Reports page.
 * Supports active_components keys: availability, count, both (boolean or string mode fields)
 * and falls back to CRM-0022 / CRM-0021 / CRM-0020 when those keys are absent.
 */
export function getStockReportCapabilities(
  activeComponents: Record<string, unknown> | Record<string, boolean> | null | undefined,
): StockReportCapabilities {
  const raw = (activeComponents ?? {}) as Record<string, unknown>;
  const booleanFlags = capabilitiesFromBooleanFlags(raw);
  const modeKeys = capabilitiesFromModeKeys(raw);
  const base = booleanFlags ?? modeKeys ?? capabilitiesFromCrmCodes(raw as Record<string, boolean>);

  const codes = mergeWithDefaults(raw as Record<string, boolean>) as Record<string, boolean>;
  return applyCrmGates(base, codes);
}

export function hasAnyStockReportCapability(caps: StockReportCapabilities): boolean {
  return (
    caps.morningAvailability ||
    caps.morningCount ||
    caps.eveningAvailability ||
    caps.eveningCount
  );
}
