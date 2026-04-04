"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  onGeoDataFetched?: (data: GeoData) => void;
  height?: string;
}

interface GeoData {
  elevation?: number;
  avgAnnualTempC?: number;
  annualRainfallMm?: number;
  frostFreeDays?: number;
  climateZone?: string;
  soilType?: string;
}

export function LocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  onGeoDataFetched,
  height = "350px",
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [fetchingGeo, setFetchingGeo] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Default center: Santiago, Chile
  const validLat = typeof latitude === "number" && !isNaN(latitude) ? latitude : null;
  const validLng = typeof longitude === "number" && !isNaN(longitude) ? longitude : null;
  const defaultLat = validLat ?? -33.45;
  const defaultLng = validLng ?? -70.65;
  const defaultZoom = validLat ? 14 : 6;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return;

    // Dynamic import of Leaflet (client-side only)
    import("leaflet").then((L) => {
      // Fix default marker icons for webpack/Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [defaultLat, defaultLng],
        zoom: defaultZoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Add initial marker if coordinates provided
      if (validLat && validLng) {
        markerRef.current = L.marker([validLat, validLng]).addTo(map);
      }

      // Click handler
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        const roundedLat = Math.round(lat * 10000) / 10000;
        const roundedLng = Math.round(lng * 10000) / 10000;

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          markerRef.current = L.marker([roundedLat, roundedLng]).addTo(map);
        }

        onLocationSelect(roundedLat, roundedLng);
        fetchGeoDataForLocation(roundedLat, roundedLng);
      });

      mapInstanceRef.current = map;

      // Cleanup
      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    });
  }, [mounted]);

  async function fetchGeoDataForLocation(lat: number, lng: number) {
    if (!onGeoDataFetched) return;
    setFetchingGeo(true);
    try {
      const res = await fetch(`/api/geo?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const { geoData } = await res.json();
        onGeoDataFetched(geoData);
      }
    } catch (err) {
      console.error("Error fetching geo data:", err);
    } finally {
      setFetchingGeo(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim() || !mapInstanceRef.current) return;
    setSearching(true);
    try {
      // Use Nominatim (OpenStreetMap) for geocoding — free, no API key
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        {
          headers: { "User-Agent": "RegeneraGrazingOS/1.0" },
        }
      );
      const results = await res.json();

      if (results.length > 0) {
        const { lat, lon } = results[0];
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lon);
        const roundedLat = Math.round(parsedLat * 10000) / 10000;
        const roundedLng = Math.round(parsedLng * 10000) / 10000;

        const L = await import("leaflet");

        mapInstanceRef.current.setView([roundedLat, roundedLng], 14);

        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          markerRef.current = L.marker([roundedLat, roundedLng]).addTo(
            mapInstanceRef.current
          );
        }

        onLocationSelect(roundedLat, roundedLng);
        fetchGeoDataForLocation(roundedLat, roundedLng);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setSearching(false);
    }
  }

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="rounded-lg border bg-muted/30 flex items-center justify-center"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ubicación... (ej: Pirque, Chile)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Buscar"
          )}
        </Button>
      </div>

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border">
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        />
        <div ref={mapRef} style={{ height, width: "100%" }} />

        {/* Loading overlay */}
        {fetchingGeo && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border shadow-sm flex items-center gap-2 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Obteniendo datos del terreno...
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Haz clic en el mapa para seleccionar la ubicación de tu predio.
        Los datos de clima, elevación y suelo se cargarán automáticamente.
      </p>
    </div>
  );
}
