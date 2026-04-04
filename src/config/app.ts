// =============================================================================
// Application Configuration
// =============================================================================

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Regenera Grazing OS",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  description:
    "Plataforma SaaS para pastoreo holístico planificado y manejo ganadero regenerativo",

  // Feature flags
  features: {
    googleAuth: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true",
    registration: process.env.NEXT_PUBLIC_ENABLE_REGISTRATION !== "false",
  },

  // Default trial period
  trialDays: 30,

  // Supported locales
  locales: ["es", "en"] as const,
  defaultLocale: "es" as const,

  // Supported countries for tenant creation
  countries: [
    { code: "CL", name: "Chile" },
    { code: "AR", name: "Argentina" },
    { code: "UY", name: "Uruguay" },
    { code: "BR", name: "Brasil" },
    { code: "CO", name: "Colombia" },
    { code: "MX", name: "México" },
    { code: "PE", name: "Perú" },
    { code: "US", name: "Estados Unidos" },
    { code: "AU", name: "Australia" },
    { code: "NZ", name: "Nueva Zelanda" },
    { code: "ZA", name: "Sudáfrica" },
    { code: "KE", name: "Kenia" },
  ],

  timezones: [
    { value: "America/Santiago", label: "Chile (Santiago)" },
    { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
    { value: "America/Montevideo", label: "Uruguay (Montevideo)" },
    { value: "America/Sao_Paulo", label: "Brasil (São Paulo)" },
    { value: "America/Bogota", label: "Colombia (Bogotá)" },
    { value: "America/Mexico_City", label: "México (CDMX)" },
    { value: "America/Lima", label: "Perú (Lima)" },
    { value: "America/New_York", label: "US Eastern" },
    { value: "America/Chicago", label: "US Central" },
    { value: "America/Denver", label: "US Mountain" },
    { value: "America/Los_Angeles", label: "US Pacific" },
    { value: "Australia/Sydney", label: "Australia (Sydney)" },
    { value: "Pacific/Auckland", label: "Nueva Zelanda" },
    { value: "Africa/Johannesburg", label: "Sudáfrica" },
    { value: "Africa/Nairobi", label: "Kenia" },
  ],
} as const;
