"use client";

import { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ClimateDataDisplay } from "./climate-data-display";

const defaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(defaultIcon);

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  onGeoDataFetched?: (data: any) => void;
  height?: string;
}

interface SearchResult {
  name: string;
  lat: number;
  lon: number;
}

function MapClickHandler({ onLocationChange }: { onLocationChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationChange?.(lat, lng);
    },
  });
  return null;
}

export function LocationPicker({
  latitude = -33.8688,
  longitude = -71.5387,
  onLocationChange,
  onLocationSelect,
  onGeoDataFetched,
  height = "400px",
}: LocationPickerProps) {  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showClimateData, setShowClimateData] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

const handleLocationChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange?.(lat, lng);
    onLocationSelect?.(lat, lng);
  };

  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const results = await response.json();
      setSearchResults(
        results.map((r: any) => ({
          name: r.display_name,
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
        }))
      );
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query);
    }, 500);
  };

  const selectResult = (result: SearchResult) => {
    handleLocationChange(result.lat, result.lon);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="w-full space-y-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar ubicación (ej: Santiago, Chile)..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
        {isSearching && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 text-blue-500">⌛</div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => selectResult(result)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">{result.name.split(",")[0]}</p>
                <p className="text-xs text-gray-500">{result.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border-2 border-gray-300" style={{ height: height || "400px" }}>
        <MapContainer
          center={position}
          zoom={10}
          style={{ width: "100%", height: "100%" }}
          key={`${position[0]}-${position[1]}`}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position} icon={defaultIcon}>
            <Popup>
              Lat: {position[0].toFixed(4)} <br />
              Lng: {position[1].toFixed(4)}
            </Popup>
          </Marker>
          <MapClickHandler onLocationChange={handleLocationChange} />
        </MapContainer>
      </div>

      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">📌 Coordenadas:</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">Latitud</p>
            <p className="text-sm font-mono font-bold">{position[0].toFixed(6)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Longitud</p>
            <p className="text-sm font-mono font-bold">{position[1].toFixed(6)}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowClimateData(!showClimateData)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
      >
        {showClimateData ? "🔽 Ocultar" : "🔼 Mostrar"} Datos Climáticos
      </button>

      {showClimateData && (
        <ClimateDataDisplay latitude={position[0]} longitude={position[1]} />
      )}
    </div>
  );
}