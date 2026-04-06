"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getClimateData, getSoilData, getReverseGeocode, ClimateData, SoilData } from "@/lib/geo/climate-service";

interface ClimateDataDisplayProps {
  latitude: number;
  longitude: number;
}

export function ClimateDataDisplay({ latitude, longitude }: ClimateDataDisplayProps) {
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [climate, soil, geo] = await Promise.all([
          getClimateData(latitude, longitude),
          getSoilData(latitude, longitude),
          getReverseGeocode(latitude, longitude),
        ]);

        setClimateData(climate);
        setSoilData(soil);
        setGeoData(geo);
      } catch (err) {
        console.error("Data fetch error:", err);
        setError("Error al cargar datos climáticos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 text-center">
        <p className="text-blue-700 font-medium">⏳ Cargando datos climáticos y del suelo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-6">
        <p className="text-red-700 font-medium">❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ubicación */}
      {geoData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">📍 Ubicación</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Dirección</p>
              <p className="font-medium text-gray-900">{geoData.address}</p>
            </div>
            <div>
              <p className="text-gray-600">Región</p>
              <p className="font-medium text-gray-900">{geoData.region}</p>
            </div>
            <div>
              <p className="text-gray-600">Comuna</p>
              <p className="font-medium text-gray-900">{geoData.commune}</p>
            </div>
            <div>
              <p className="text-gray-600">Altitud</p>
              <p className="font-medium text-gray-900">{climateData?.elevation || 0}m</p>
            </div>
          </div>
        </div>
      )}

      {/* Clima */}
      {climateData && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-3">🌡️ Datos Climáticos (Promedio últimos 24 meses)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">Temp. Media</p>
              <p className="text-lg font-bold text-orange-600">{climateData.temperature.avg}°C</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">Temp. Máxima</p>
              <p className="text-lg font-bold text-red-600">{climateData.temperature.max}°C</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">Temp. Mínima</p>
              <p className="text-lg font-bold text-blue-600">{climateData.temperature.min}°C</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">Precipitación</p>
              <p className="text-lg font-bold text-blue-500">{climateData.precipitation}mm</p>
            </div>
          </div>
          <div className="mt-3 bg-white rounded p-2">
            <p className="text-sm">
              <span className="font-semibold">Zona Climática:</span> {climateData.climateZone}
            </p>
          </div>
        </div>
      )}

      {/* Gráfico de Temperaturas */}
      {climateData && climateData.monthlyData.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-4">📊 Temperaturas - Últimos 24 meses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={climateData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                angle={-45}
                height={80}
              />
              <YAxis label={{ value: "Temperatura (°C)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                formatter={(value) => `${value}°C`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="maxTemp"
                stroke="#ef4444"
                dot={false}
                strokeWidth={2}
                name="Máxima"
              />
              <Line
                type="monotone"
                dataKey="avgTemp"
                stroke="#f59e0b"
                dot={false}
                strokeWidth={2}
                name="Media"
              />
              <Line
                type="monotone"
                dataKey="minTemp"
                stroke="#3b82f6"
                dot={false}
                strokeWidth={2}
                name="Mínima"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de Precipitación */}
      {climateData && climateData.monthlyData.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-4">💧 Precipitación - Últimos 24 meses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={climateData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                angle={-45}
                height={80}
              />
              <YAxis label={{ value: "Precipitación (mm)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                formatter={(value) => `${value}mm`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="precipitation"
                stroke="#06b6d4"
                dot={false}
                strokeWidth={2}
                name="Precipitación"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Suelo */}
      {soilData && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-3">🌍 Datos del Suelo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">Tipo de Suelo</p>
              <p className="text-lg font-bold text-amber-700">{soilData.soilType}</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">Materia Orgánica</p>
              <p className="text-lg font-bold text-amber-700">{soilData.organicMatter}%</p>
            </div>
          </div>
          <div className="mt-3 bg-white rounded p-2">
            <p className="text-sm text-gray-700">{soilData.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}