// =============================================================================
// Geo Data Service — Public API integrations for auto-filling farm data
// =============================================================================
// All APIs used here are free and require no API keys:
//   - Open-Meteo: climate data (temperature, precipitation, frost days)
//   - Open Elevation: altitude above sea level
//   - SoilGrids (ISRIC): soil type estimation
// =============================================================================

export interface GeoDataResult {
  elevation?: number;
  avgAnnualTempC?: number;
  annualRainfallMm?: number;
  frostFreeDays?: number;
  climateZone?: string;
  soilType?: string;
}

/**
 * Fetch elevation from Open Elevation API.
 */
async function fetchElevation(lat: number, lng: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.elevation ?? null;
  } catch {
    console.warn("Open Elevation API failed");
    return null;
  }
}

/**
 * Fetch climate data from Open-Meteo Climate API.
 * Uses historical daily data to compute annual averages.
 */
async function fetchClimate(
  lat: number,
  lng: number
): Promise<{
  avgAnnualTempC: number | null;
  annualRainfallMm: number | null;
  frostFreeDays: number | null;
}> {
  try {
    // Use Open-Meteo Historical Weather API with ERA5 reanalysis data
    // Average the last 10 complete years (2014-2023) for reliable normals
    const res = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?` +
        `latitude=${lat}&longitude=${lng}` +
        `&start_date=2014-01-01&end_date=2023-12-31` +
        `&daily=temperature_2m_mean,precipitation_sum,temperature_2m_min` +
        `&timezone=auto`
    );

    if (!res.ok) {
      console.warn("Historical Weather API failed, status:", res.status);
      return await fetchClimateFromForecastAPI(lat, lng);
    }

    const data = await res.json();
    const temps: number[] = (data.daily?.temperature_2m_mean ?? []).filter((v: any) => v !== null);
    const precips: number[] = (data.daily?.precipitation_sum ?? []).filter((v: any) => v !== null);
    const minTemps: number[] = (data.daily?.temperature_2m_min ?? []).filter((v: any) => v !== null);

    if (temps.length === 0) {
      return await fetchClimateFromForecastAPI(lat, lng);
    }

    // Average temperature across all days
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

    // Total precipitation averaged per year (sum all, divide by number of years)
    const totalPrecip = precips.reduce((a, b) => a + b, 0);
    const numYears = 10;
    const annualPrecip = totalPrecip / numYears;

    // Frost days: count days with min temp < 0, average per year
    const frostDaysTotal = minTemps.filter((t) => t < 0).length;
    const frostDaysPerYear = Math.round(frostDaysTotal / numYears);

    return {
      avgAnnualTempC: Math.round(avgTemp * 10) / 10,
      annualRainfallMm: Math.round(annualPrecip),
      frostFreeDays: 365 - frostDaysPerYear,
    };
  } catch (err) {
    console.warn("Open-Meteo Historical API failed:", err);
    return await fetchClimateFromForecastAPI(lat, lng);
  }
}

/**
 * Fallback: use Open-Meteo Forecast API with past_days for a rough estimate.
 */
async function fetchClimateFromForecastAPI(
  lat: number,
  lng: number
): Promise<{
  avgAnnualTempC: number | null;
  annualRainfallMm: number | null;
  frostFreeDays: number | null;
}> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lng}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
        `&past_days=92&forecast_days=1` +
        `&timezone=auto`
    );
    if (!res.ok) return { avgAnnualTempC: null, annualRainfallMm: null, frostFreeDays: null };

    const data = await res.json();
    const maxTemps: number[] = data.daily?.temperature_2m_max ?? [];
    const minTemps: number[] = data.daily?.temperature_2m_min ?? [];
    const precips: number[] = data.daily?.precipitation_sum ?? [];

    if (maxTemps.length === 0) {
      return { avgAnnualTempC: null, annualRainfallMm: null, frostFreeDays: null };
    }

    // Average temp from (max+min)/2
    const avgTemp =
      maxTemps.reduce((a, b, i) => a + (b + minTemps[i]) / 2, 0) / maxTemps.length;

    // Extrapolate precipitation from the sample period to annual
    const daysOfData = precips.length;
    const totalPrecip = precips.reduce((a, b) => a + b, 0);
    const annualEstimate = (totalPrecip / daysOfData) * 365;

    // Frost days estimate
    const frostDaysInSample = minTemps.filter((t) => t < 0).length;
    const frostDaysAnnual = Math.round((frostDaysInSample / daysOfData) * 365);

    return {
      avgAnnualTempC: Math.round(avgTemp * 10) / 10,
      annualRainfallMm: Math.round(annualEstimate),
      frostFreeDays: 365 - frostDaysAnnual,
    };
  } catch {
    console.warn("Open-Meteo Forecast API failed");
    return { avgAnnualTempC: null, annualRainfallMm: null, frostFreeDays: null };
  }
}

/**
 * Determine climate zone based on temperature and precipitation.
 * Simplified Köppen-Geiger classification.
 */
function classifyClimateZone(
  avgTempC: number | null,
  rainfallMm: number | null
): string | null {
  if (avgTempC === null || rainfallMm === null) return null;

  if (rainfallMm < 250) return "Árido desértico";
  if (rainfallMm < 500 && avgTempC > 15) return "Semiárido cálido";
  if (rainfallMm < 500 && avgTempC <= 15) return "Semiárido templado";
  if (rainfallMm >= 500 && rainfallMm < 1000 && avgTempC > 15)
    return "Mediterráneo";
  if (rainfallMm >= 500 && rainfallMm < 1000 && avgTempC <= 15)
    return "Mediterráneo templado";
  if (rainfallMm >= 1000 && avgTempC > 20) return "Tropical húmedo";
  if (rainfallMm >= 1000 && avgTempC > 10) return "Templado lluvioso";
  if (rainfallMm >= 1000 && avgTempC <= 10) return "Frío lluvioso";
  if (avgTempC < 5) return "Frío de montaña";
  return "Templado";
}

/**
 * Fetch soil type from SoilGrids (ISRIC).
 */
async function fetchSoilType(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://rest.isric.org/soilgrids/v2.0/classification/query?` +
        `lon=${lng}&lat=${lat}&number_classes=1`
    );
    if (!res.ok) return null;
    const data = await res.json();

    // Map WRB soil classification to Spanish
    const wrb = data.wrb_class_name;
    if (!wrb) return null;

    const soilTranslations: Record<string, string> = {
      Acrisol: "Acrisol (ácido, arcilloso)",
      Alisol: "Alisol (alto aluminio)",
      Andosol: "Andosol (volcánico)",
      Arenosol: "Arenosol (arenoso)",
      Calcisol: "Calcisol (calcáreo)",
      Cambisol: "Cambisol (moderadamente desarrollado)",
      Chernozem: "Chernozem (rico en humus)",
      Cryosol: "Criosol (permafrost)",
      Durisol: "Durisol (cementado)",
      Ferralsol: "Ferralsol (tropical profundo)",
      Fluvisol: "Fluvisol (aluvial)",
      Gleysol: "Gleysol (hidromórfico)",
      Gypsisol: "Gypsisol (yesoso)",
      Histosol: "Histosol (orgánico/turba)",
      Kastanozem: "Kastanozem (castaño)",
      Leptosol: "Leptosol (delgado/rocoso)",
      Lixisol: "Lixisol (arcilla lavada)",
      Luvisol: "Luvisol (arcilloso fértil)",
      Nitisol: "Nitisol (arcilloso profundo)",
      Phaeozem: "Phaeozem (oscuro fértil)",
      Planosol: "Planosol (horizonte impermeable)",
      Plinthosol: "Plintosol (concreciones férricas)",
      Podzol: "Podzol (ácido lixiviado)",
      Regosol: "Regosol (poco desarrollado)",
      Retisol: "Retisol (moteado)",
      Solonchak: "Solonchak (salino)",
      Solonetz: "Solonetz (sódico)",
      Stagnosol: "Stagnosol (mal drenado)",
      Technosol: "Tecnosol (antrópico)",
      Umbrisol: "Umbrisol (ácido oscuro)",
      Vertisol: "Vertisol (arcilla expansiva)",
    };

    return soilTranslations[wrb] ?? wrb;
  } catch {
    console.warn("SoilGrids API failed");
    return null;
  }
}

/**
 * Main function: fetch all geo data for given coordinates.
 * Calls all APIs in parallel for speed.
 */
export async function fetchGeoData(
  lat: number,
  lng: number
): Promise<GeoDataResult> {
  const [elevation, climate, soilType] = await Promise.all([
    fetchElevation(lat, lng),
    fetchClimate(lat, lng),
    fetchSoilType(lat, lng),
  ]);

  const climateZone = classifyClimateZone(
    climate.avgAnnualTempC,
    climate.annualRainfallMm
  );

  return {
    elevation: elevation ?? undefined,
    avgAnnualTempC: climate.avgAnnualTempC ?? undefined,
    annualRainfallMm: climate.annualRainfallMm ?? undefined,
    frostFreeDays: climate.frostFreeDays ?? undefined,
    climateZone: climateZone ?? undefined,
    soilType: soilType ?? undefined,
  };
}
