import { createHmac } from 'crypto';
import { getLocationSecret } from '../../config/env';

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
 * Desloca uma coordenada de forma determinística (sempre igual para o mesmo seed),
 * entre um raio mínimo e um máximo, para esconder a localização exacta antes do
 * desbloqueio (secção 14 do DDR).
 *
 * O deslocamento depende de um segredo do servidor (HMAC), por isso quem conhece o
 * listingId e o algoritmo não consegue recalculá-lo. O raio mínimo garante que a
 * posição mostrada nunca coincide com a real.
 */
export function obfuscateLocation(
  lat: number, lng: number, seed: string,
  minMeters = 150, maxMeters = 500,
): { lat: number; lng: number } {
  const digest = createHmac('sha256', getLocationSecret()).update(seed).digest();

  // Dois números independentes em [0, 1), de bytes diferentes do HMAC
  const angle = (digest.readUInt32BE(0) / 0x100000000) * 2 * Math.PI;
  const ratio = digest.readUInt32BE(4) / 0x100000000;

  // A raiz quadrada espalha os pontos de forma uniforme na área da coroa
  const distanceMeters = Math.sqrt(minMeters ** 2 + ratio * (maxMeters ** 2 - minMeters ** 2));

  const earthRadius = 6371000;
  const deltaLat = (distanceMeters * Math.cos(angle)) / earthRadius;
  const deltaLng =
    (distanceMeters * Math.sin(angle)) /
    (earthRadius * Math.cos((lat * Math.PI) / 180));

  return {
    lat: lat + (deltaLat * 180) / Math.PI,
    lng: lng + (deltaLng * 180) / Math.PI,
  };
}

/**
 * Transforma um listing (com latitude/longitude reais) num objeto seguro para
 * mostrar publicamente: remove as coordenadas exactas e adiciona as aproximadas.
 * Usar sempre antes do desbloqueio (DDR secção 14).
 */
export function toPublicListing<T extends { id: string; latitude: number; longitude: number }>(
  listing: T,
): Omit<T, 'latitude' | 'longitude'> & { approxLatitude: number; approxLongitude: number } {
  const { latitude, longitude, ...rest } = listing;
  const approx = obfuscateLocation(latitude, longitude, listing.id);
  return {
    ...rest,
    approxLatitude: approx.lat,
    approxLongitude: approx.lng,
  } as Omit<T, 'latitude' | 'longitude'> & { approxLatitude: number; approxLongitude: number };
}