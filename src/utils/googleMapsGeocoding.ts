/* eslint-disable @typescript-eslint/no-explicit-any */
import { initGoogleMaps } from "@/utils/googleMapsDistance";

declare const google: any;

export interface ReverseGeocodeResult {
  county: string;
  country: string;
}

/**
 * Reverse geocode coordinates to county (admin area) and country via Google Maps.
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key not configured");
  }

  await initGoogleMaps(apiKey);

  const geocoder = new google.maps.Geocoder();
  const latlng = { lat: latitude, lng: longitude };

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
      if (status !== "OK" || !results?.[0]) {
        reject(new Error(`Geocoding failed: ${status}`));
        return;
      }

      const components = results[0].address_components;
      let county = "";
      let country = "";

      for (const component of components) {
        const types: string[] = component.types;
        if (types.includes("administrative_area_level_1")) {
          county = component.long_name;
        }
        if (types.includes("country")) {
          country = component.long_name;
        }
      }

      if (!county) {
        for (const component of components) {
          if (component.types.includes("administrative_area_level_2")) {
            county = component.long_name;
            break;
          }
        }
      }

      if (!county || !country) {
        reject(new Error("Could not determine county or country from location"));
        return;
      }

      resolve({ county, country });
    });
  });
};
