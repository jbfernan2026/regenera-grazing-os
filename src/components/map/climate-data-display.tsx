"use client";

import { useState, useEffect } from "react";

interface ClimateData {
  temperature: {
    avg: number;
    max: number;
    min: number;
  };
  precipitation: number;
  climateZone: string;
  elevation: number;
  monthlyData: Array<{
    month: string;
    avgTemp: number;
    maxTemp: number;
    minTemp: number;
    precipitation: number;
  }>;
}

interface ClimateDataDisplayProps {
  latitude: number;
  longitude: number;
}

export function ClimateDataDisplay({ latitude, longitude }: ClimateDataDisplayProps) {
  const [data, setData] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClimate = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/geo/climate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude }),
        });

        if (!res.ok) {
          throw new Error("Error fetching climate data");
        }

        const result = await res.json();
        console.log("Climate data received:", result);
        setData(result.data);
      } catch (err) {
        console.error("Climate fetch error:", err);
        setError("Error al cargar datos climáticos");
      } finally {
        setLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchClimate();
    }
  }, [latitude, longitude]);

  if (loading) {
    return <div className="p-4 bg-blue-50 text-blue-700 rounded">⏳ Cargando datos climáticos...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded">❌ {error}</div>;
  }

  if (!data) {
    return <div className="p-4 bg-gray-50 text-gray-700 rounded">Selecciona una ubicación en el mapa</div>;
  }

  return (
    <div className="space-y-4 p-4 bg-white border border-gray-300 rounded-lg">
      <h3 className="font-bold text-lg">🌡️ Datos Climáticos</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 p-3 rounded">
          <p className="text-xs text-gray-600">Temp. Promedio</p>
          <p className="text-xl font-bold text-orange-600">{data.temperature.avg}°C</p>
        </div>
        <div className="bg-red-50 p-3 rounded">
          <p className="text-xs text-gray-600">Temp. Máxima</p>
          <p className="text-xl font-bold text-red-600">{data.temperature.max}°C</p>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-gray-600">Temp. Mínima</p>
          <p className="text-xl font-bold text-blue-600">{data.temperature.min}°C</p>
        </div>
        <div className="bg-cyan-50 p-3 rounded">
          <p className="text-xs text-gray-600">Precipitación</p>
          <p className="text-xl font-bold text-cyan-600">{data.precipitation}mm</p>
        </div>
      </div>

      <div className="bg-green-50 p-3 rounded">
        <p className="text-sm"><strong>Zona Climática:</strong> {data.climateZone}</p>
        <p className="text-sm"><strong>Elevación:</strong> {data.elevation}m</p>
      </div>
    </div>
  );
}