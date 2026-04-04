// =============================================================================
// GET /api/geo?lat=X&lng=Y — Fetch geo data for coordinates
// =============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { fetchGeoData } from "@/lib/geo/data-service";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("No autorizado", 401);

    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lng = parseFloat(searchParams.get("lng") ?? "");

    if (isNaN(lat) || isNaN(lng)) {
      return apiError("Coordenadas inválidas", 400);
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return apiError("Coordenadas fuera de rango", 400);
    }

    const geoData = await fetchGeoData(lat, lng);

    return apiResponse({ geoData });
  } catch (error) {
    console.error("GET /api/geo error:", error);
    return apiError("Error obteniendo datos geográficos", 500);
  }
}
