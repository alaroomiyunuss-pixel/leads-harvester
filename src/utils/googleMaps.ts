import type { Lead, SearchParams } from '../types';

const BASE = 'https://places.googleapis.com/v1';

interface PlaceNew {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text: string };
  websiteUri?: string;
  googleMapsUri?: string;
  reviews?: { text?: { text: string }; rating?: number }[];
}

interface TextSearchResponse {
  places?: PlaceNew[];
  nextPageToken?: string;
  error?: { message: string; status: string };
}

const FIELDS = [
  'places.id', 'places.displayName', 'places.formattedAddress',
  'places.nationalPhoneNumber', 'places.internationalPhoneNumber',
  'places.rating', 'places.userRatingCount',
  'places.primaryTypeDisplayName', 'places.websiteUri',
  'places.googleMapsUri', 'places.reviews',
  'nextPageToken',
].join(',');

interface LocationBias {
  circle: { center: { latitude: number; longitude: number }; radius: number };
}

export function parseGoogleError(status: string, message?: string): string {
  const map: Record<string, string> = {
    REQUEST_DENIED:   `❌ تم رفض الطلب:\n• فعّل "Places API (New)" في Google Cloud Console\n• فعّل الفوترة (Billing)\n• تحقق من صلاحيات المفتاح`,
    PERMISSION_DENIED:`❌ تم رفض الطلب:\n• فعّل "Places API (New)" في Google Cloud Console\n• فعّل الفوترة (Billing)`,
    INVALID_ARGUMENT: '⚠️ طلب غير صالح — تأكد من بيانات البحث.',
    RESOURCE_EXHAUSTED:'⚠️ تجاوزت حد الطلبات — انتظر ثم حاول.',
    ZERO_RESULTS:     '🔍 لا توجد نتائج — جرب بحثاً مختلفاً.',
  };
  const base = map[status] || `خطأ (${status})`;
  return message ? `${base}\n\nتفاصيل: ${message}` : base;
}

async function fetchPage(
  textQuery: string, apiKey: string, pageSize: number,
  locationBias?: LocationBias, pageToken?: string
): Promise<TextSearchResponse> {
  const body: Record<string, unknown> = { textQuery, maxResultCount: pageSize, languageCode: 'ar' };
  if (locationBias) body.locationBias = locationBias;
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(`${BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELDS,
    },
    body: JSON.stringify(body),
  });
  const data: TextSearchResponse = await res.json();
  if (!res.ok || data.error) {
    throw new Error(parseGoogleError(data.error?.status || String(res.status), data.error?.message));
  }
  return data;
}

// Fetch all pages for a single query (up to limit)
async function fetchAllPages(
  textQuery: string, apiKey: string, limit: number, locationBias?: LocationBias
): Promise<PlaceNew[]> {
  const all: PlaceNew[] = [];
  let pageToken: string | undefined;
  let remaining = limit;
  do {
    const data = await fetchPage(textQuery, apiKey, Math.min(20, remaining), locationBias, pageToken);
    all.push(...(data.places || []));
    remaining -= data.places?.length || 0;
    pageToken = data.nextPageToken;
    if (pageToken && remaining > 0) await new Promise(r => setTimeout(r, 400));
  } while (pageToken && remaining > 0);
  return all;
}

// Deep Search: 10 query variants → 100+ unique results
export async function searchPlaces(params: SearchParams, apiKey: string): Promise<Lead[]> {
  const { query, cityEn, countryCode, cityAr, maxResults, radius, cityLat, cityLng } = params;

  /* locationBias: يُقيّد النتائج بدائرة حول المدينة */
  const locationBias: LocationBias | undefined = (cityLat && cityLng)
    ? { circle: { center: { latitude: cityLat, longitude: cityLng }, radius } }
    : undefined;

  // Build 10 query variants for maximum coverage
  const variants = [
    `${query} in ${cityEn}`,
    `best ${query} in ${cityEn}`,
    `top ${query} in ${cityEn}`,
    `new ${query} in ${cityEn}`,
    `${query} near ${cityEn} north`,
    `${query} near ${cityEn} south`,
    `${query} near ${cityEn} east`,
    `${query} near ${cityEn} west`,
    `${query} ${cityEn} center`,
    `popular ${query} ${cityEn}`,
  ];

  const seen = new Set<string>();
  const allPlaces: PlaceNew[] = [];

  // Run all variants concurrently in batches of 5
  const batchSize = 5;
  for (let i = 0; i < variants.length && allPlaces.length < maxResults; i += batchSize) {
    const batch = variants.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(q => fetchAllPages(q, apiKey, 20, locationBias))
    );
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const place of result.value) {
          if (place.id && !seen.has(place.id)) {
            seen.add(place.id);
            allPlaces.push(place);
            if (allPlaces.length >= maxResults) break;
          }
        }
      }
    }
    if (i + batchSize < variants.length) await new Promise(r => setTimeout(r, 300));
  }

  if (!allPlaces.length) throw new Error(parseGoogleError('ZERO_RESULTS'));

  return allPlaces.map(p => mapToLead(p, countryCode, cityAr));
}

function mapToLead(place: PlaceNew, country: string, city: string): Lead {
  const reviews = place.reviews
    ?.slice(0, 10)
    .map(r => r.text?.text || '')
    .filter(Boolean) || [];

  return {
    id: place.id || crypto.randomUUID(),
    name: place.displayName?.text || 'بدون اسم',
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
    address: place.formattedAddress,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    reviews,
    category: place.primaryTypeDisplayName?.text,
    website: place.websiteUri,
    googleMapsUrl: place.googleMapsUri,
    status: 'new',
    timestamp: new Date(),
    placeId: place.id,
    country,
    city,
  };
}
