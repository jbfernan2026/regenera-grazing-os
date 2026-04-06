import axios from "axios";

export interface ClimateData {
  temperature: {
    avg: number;
    max: number;
    min: number;
  };
  precipitation: number;
  climateZone: string;
  elevation: number;
  monthlyData: MonthlyClimate[];
}

export interface MonthlyClimate {
  month: string;
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
}

export interface SoilData {
  soilType: string;
  organicMatter: number;
  pH?: number;
  description: string;
}

/**
 * Get climate data from Open-Meteo (free, no API key needed)
 */
export async function getClimateData(
  latitude: number,
  longitude: number
): Promise<ClimateData> {
  try {
    // Get current climate + 24 months historical
    const response = await axios.get(
      "https://archive-api.open-meteo.com/v1/archive",
      {
        params: {
          latitude,
          longitude,
          start_date: getDate24MonthsAgo(),
          end_date: getTodayDate(),
          monthly: [
            "temperature_2m_max",
            "temperature_2m_mean",
            "temperature_2m_min",
            "precipitation_sum",
          ],
          temperature_unit: "celsius",
          precipitation_unit: "mm",
          timezone: "auto",
        },
      }
    );

    const data = response.data;

    if (!data.monthly || !data.monthly.time) {
      throw new Error("No climate data available");
    }

    // Calculate averages
    const temps = data.monthly.temperature_2m_mean;
    const maxTemps = data.monthly.temperature_2m_max;
    const minTemps = data.monthly.temperature_2m_min;
    const precip = data.monthly.precipitation_sum;

    const avgTemp = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
    const avgMax = maxTemps.reduce((a: number, b: number) => a + b, 0) / maxTemps.length;
    const avgMin = minTemps.reduce((a: number, b: number) => a + b, 0) / minTemps.length;
    const totalPrecip = precip.reduce((a: number, b: number) => a + b, 0);
    const avgPrecip = totalPrecip / precip.length;

    // Monthly breakdown
    const monthlyData: MonthlyClimate[] = data.monthly.time.map(
      (dateStr: string, idx: number) => ({
        month: new Date(dateStr).toLocaleDateString("es-CL", {
          month: "short",
          year: "2-digit",
        }),
        avgTemp: Math.round(temps[idx] * 10) / 10,
        maxTemp: Math.round(maxTemps[idx] * 10) / 10,
        minTemp: Math.round(minTemps[idx] * 10) / 10,
        precipitation: Math.round(precip[idx] * 10) / 10,
      })
    );

    // Determine climate zone
    const climateZone = getClimateZone(avgTemp, totalPrecip);

    return {
      temperature: {
        avg: Math.round(avgTemp * 10) / 10,
        max: Math.round(avgMax * 10) / 10,
        min: Math.round(avgMin * 10) / 10,
      },
      precipitation: Math.round(avgPrecip * 10) / 10,
      climateZone,
      elevation: data.elevation || 0,
      monthlyData: monthlyData.slice(-24), // Last 24 months
    };
  } catch (error) {
    console.error("Climate data error:", error);
    throw error;
  }
}

/**
 * Get estimated soil type based on location (using FAO data)
 */
export async function getSoilData(
  latitude: number,
  longitude: number
): Promise<SoilData> {
  try {
    // Use a simplified soil classification based on climate
    // In production, integrate with ISRIC SoilGrids API
    
    const climateData = await getClimateData(latitude, longitude);
    
    // Estimate soil based on climate (Chilean context)
    let soilType = "Franco arcilloso";
    let organicMatter = 4;
    let description = "Suelo de textura media";

    if (climateData.precipitation > 1000) {
      soilType = "Volcánico";
      organicMatter = 6;
      description = "Suelo volcánico con alta materia orgánica, típico de zona sur";
    } else if (climateData.precipitation > 500) {
      soilType = "Franco arcilloso";
      organicMatter = 4;
      description = "Suelo de textura media, adecuado para pastura";
    } else {
      soilType = "Arenoso";
      organicMatter = 2;
      description = "Suelo arenoso, requiere manejo especial de riego";
    }

    return {
      soilType,
      organicMatter,
      pH: 6.5,
      description,
    };
  } catch (error) {
    console.error("Soil data error:", error);
    throw error;
  }
}

/**
 * Determine climate zone based on temperature and precipitation
 * Using Köppen-Geiger classification
 */
function getClimateZone(avgTemp: number, totalPrecip: number): string {
  // Simplified for Chile
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

/**
 * Helper: Get date 24 months ago
 */
function getDate24MonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 24);
  return date.toISOString().split("T")[0];
}

/**
 * Helper: Get today's date
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get reverse geocoding (lat/lng → address)
 */
export async function getReverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  address: string;
  region: string;
  commune: string;
  country: string;
}> {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          format: "json",
          zoom: 10,
          addressdetails: 1,
        },
      }
    );

    const address = response.data.address;

    return {
      address: response.data.display_name.split(",")[0],
      region: address.state || address.province || "N/A",
      commune: address.municipality || address.county || "N/A",
      country: address.country || "Chile",
    };
  } catch (error) {
    console.error("Reverse geocode error:", error);
    throw error;
  }
}