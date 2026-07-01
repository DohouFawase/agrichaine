import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// Géocodage texte → lat/lng via Google Geocoding API
// Cache en mémoire (session) + AsyncStorage (persistant)
// pour éviter de re-géocoder le même nom de ville à chaque refresh.
// ─────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const CACHE_PREFIX = 'geocode_cache_v1:';

type Coords = { latitude: number; longitude: number };

// Cache mémoire pour la session en cours (évite même les lectures AsyncStorage répétées)
const memoryCache = new Map<string, Coords>();

// Pour éviter de lancer 2x le même fetch en parallèle (ex: plusieurs produits "Porto-Novo")
const inFlight = new Map<string, Promise<Coords | null>>();

function normalizeKey(text: string): string {
  return text.trim().toLowerCase();
}

async function readFromStorage(key: string): Promise<Coords | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeToStorage(key: string, coords: Coords): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(coords));
  } catch {
    // silencieux : le cache est un bonus, pas une dépendance critique
  }
}

/**
 * Géocode un texte (ville, quartier, adresse) en coordonnées GPS.
 * Retourne null si le géocodage échoue (pour ne pas planter l'affichage de la carte).
 */
export async function geocodeLocation(locationText: string): Promise<Coords | null> {
  if (!locationText?.trim()) return null;

  const key = normalizeKey(locationText);

  // 1. Cache mémoire (session courante)
  if (memoryCache.has(key)) return memoryCache.get(key)!;

  // 2. Une requête déjà en cours pour la même clé → on la réutilise
  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = (async (): Promise<Coords | null> => {
    // 3. Cache persistant (AsyncStorage)
    const stored = await readFromStorage(key);
    if (stored) {
      memoryCache.set(key, stored);
      return stored;
    }

    // 4. Appel API Google Geocoding (requête ouverte, sans restriction de pays)
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('[geocode] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY manquante');
      return null;
    }

    try {
      const query = encodeURIComponent(locationText);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.length) {
        console.warn(`[geocode] Échec pour "${locationText}":`, data.status);
        return null;
      }

      const { lat, lng } = data.results[0].geometry.location;
      const coords: Coords = { latitude: lat, longitude: lng };

      memoryCache.set(key, coords);
      writeToStorage(key, coords); // fire-and-forget

      return coords;
    } catch (err) {
      console.warn(`[geocode] Erreur réseau pour "${locationText}":`, err);
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/**
 * Géocode plusieurs textes en parallèle (déduplique automatiquement via le cache).
 */
export async function geocodeMany(
  texts: string[]
): Promise<Record<string, Coords | null>> {
  const uniqueTexts = [...new Set(texts.filter(Boolean))];
  const results = await Promise.all(
    uniqueTexts.map(async (text) => [text, await geocodeLocation(text)] as const)
  );
  return Object.fromEntries(results);
}