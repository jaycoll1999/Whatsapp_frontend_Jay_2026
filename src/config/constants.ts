// Base URLs for backend APIs and Engine
// Base URLs for backend APIs and Engine
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// 🔥 ROBUST FIX: Ensure API_BASE_URL always ends with /api
export const API_BASE_URL = rawApiUrl.endsWith("/api") 
  ? rawApiUrl 
  : `${rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl}/api`;

export const WHATSAPP_ENGINE_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_ENGINE_URL || "http://127.0.0.1:3002";
