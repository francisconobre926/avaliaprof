/**
 * Calcula a distância em quilómetros entre duas coordenadas (fórmula de Haversine).
 */
export function haversineDistanceKm(
  lat1: number, lon1: number, lat2: number, lon2: number,
): number {
  const R = 6371; // raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Desloca uma coordenada de forma determinística (sempre igual para o mesmo listingId),
 * dentro de um raio máximo em metros — usado para esconder a localização exacta
 * antes do desbloqueio (secção 14 do DDR).
 */
export function obfuscateLocation(
  lat: number, lng: number, seed: string, radiusMeters = 500,
): { lat: number; lng: number } {
  // Gera um número "aleatório" mas fixo a partir do seed (id do anúncio)
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const distanceRatio = (Math.abs(hash) % 100) / 100; // 0 a 1
  const distanceMeters = distanceRatio * radiusMeters;

  const earthRadius = 6371000; // metros
  const deltaLat = (distanceMeters * Math.cos(angle)) / earthRadius;
  const deltaLng =
    (distanceMeters * Math.sin(angle)) /
    (earthRadius * Math.cos((lat * Math.PI) / 180));

  return {
    lat: lat + (deltaLat * 180) / Math.PI,
    lng: lng + (deltaLng * 180) / Math.PI,
  };
}