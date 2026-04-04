// =============================================================================
// NextAuth.js API Route — /api/auth/[...nextauth]
// =============================================================================

import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;
