"use client";

import { LocationPicker } from "@/components/map/location-picker";

interface FarmLocationSectionProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  onGeoDataFetched?: (data: any) => void;
}

export function FarmLocationSection({
  latitude,
  longitude,
  onLocationSelect,
  onGeoDataFetched,
}: FarmLocationSectionProps) {
  return (
    <LocationPicker
      latitude={latitude}
      longitude={longitude}
      onLocationChange={onLocationSelect}
      onLocationSelect={onLocationSelect}
      onGeoDataFetched={onGeoDataFetched}
      height="400px"
    />
  );
}