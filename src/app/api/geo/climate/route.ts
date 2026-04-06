import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import axios from "axios";
import { z } from "zod";

const climateQuerySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = climateQuerySchema.safeParse(body);
    if (!validation.success) {
      return apiError("Coordenadas inválidas", 400);
    }

    const { latitude, longitude } = validation.data;

    // Use forecast API with recent data
    const response = await axios.get(
      "https://api.open-meteo.com/v1/forecast",
      {
        params: {
          latitude,
          longitude,
          current: "temperature_2m,precipitation,weather_code",
          hourly: "temperature_2m,precipitation",
          daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
          temperature_unit: "celsius",
          precipitation_unit: "mm",
          timezone: "auto",
          forecast_days: 1,
        },
      }
    );

    const data = response.data;

    if (!data.current) {
      return apiError("No climate data available", 404);
    }

    // Extract current conditions
    const current = data.current;
    const daily = data.daily;

    // Mock historical data for demo (in production, use archive API)
    const monthlyData = Array.from({ length: 12 }).map((_, i) => {
      const month = new Date(2025, i, 1).toLocaleDateString("es-CL", {
        month: "short",
        year: "2-digit",
      });
      return {
        month,
        avgTemp: Math.round((current.temperature_2m + Math.random() * 5) * 10) / 10,
        maxTemp: Math.round((current.temperature_2m + 3) * 10) / 10,
        minTemp: Math.round((current.temperature_2m - 3) * 10) / 10,
        precipitation: Math.round(Math.random() * 100 * 10) / 10,
      };
    });

    const avgTemp = current.temperature_2m;
    const climateZone = getClimateZone(avgTemp, 500); // Mock annual rainfall

    return apiResponse(
      {
        temperature: {
          avg: avgTemp,
          max: daily.temperature_2m_max[0],
          min: daily.temperature_2m_min[0],
        },
        precipitation: daily.precipitation_sum[0] || 0,
        climateZone,
        elevation: data.elevation || 0,
        monthlyData,
      },
      200
    );
  } catch (error) {
    console.error("Climate API error:", error);
    return apiError("Error al obtener datos climáticos", 500);
  }
}

function getClimateZone(avgTemp: number, totalPrecip: number): string {
  if (avgTemp > 20 && totalPrecip < 250) {
    return "Desértico";
  } else if (avgTemp > 17 && totalPrecip < 500) {
    return "Semiárido";
  } else if (avgTemp > 15 && totalPrecip < 1000) {
    return "Mediterráneo";
  } else if (avgTemp > 12 && totalPrecip > 1000) {
    return "Templado lluvioso";
  } else if (avgTemp < 12) {
    return "Frío / Andino";
  }
  return "Templado";
}