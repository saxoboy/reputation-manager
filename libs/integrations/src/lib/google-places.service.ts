import { Injectable, Logger } from '@nestjs/common';

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  lat: number;
  lng: number;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  formattedPhoneNumber?: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
  reviewUrl: string;
}

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://places.googleapis.com/v1';

  constructor() {
    this.apiKey = process.env['GOOGLE_PLACES_API_KEY'] || '';
    if (!this.apiKey) {
      this.logger.warn(
        'GOOGLE_PLACES_API_KEY not found. Google Places features will be limited.',
      );
    }
  }

  /**
   * Headers comunes para la nueva API
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': this.apiKey,
    };
  }

  /**
   * Busca lugares usando la API de Google Places (New API v1)
   * @param query Texto de búsqueda (ej: "Dr. Juan Pérez Quito")
   * @param location Coordenadas opcionales para búsqueda geográfica
   * @returns Lista de lugares encontrados
   */
  async searchPlaces(
    query: string,
    location?: { lat: number; lng: number },
  ): Promise<PlaceSearchResult[]> {
    if (!this.apiKey) {
      this.logger.warn('Google Places API key not configured');
      return [];
    }

    try {
      const body: any = {
        textQuery: query,
      };

      if (location) {
        body.locationBias = {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng,
            },
            radius: 10000, // 10km
          },
        };
      }

      const url = `${this.baseUrl}/places:searchText`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.places) {
        this.logger.warn('No places found');
        return [];
      }

      return data.places.map((place: any) => ({
        placeId: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
      }));
    } catch (error) {
      this.logger.error('Failed to search places:', error);
      return [];
    }
  }

  /**
   * Obtiene detalles completos de un lugar por Place ID (New API v1)
   * @param placeId Google Place ID
   * @returns Detalles del lugar incluyendo URL de reviews
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) {
      this.logger.warn('Google Places API key not configured');
      return this.generateFallbackDetails(placeId);
    }

    try {
      // Extraer solo el ID si viene con prefijo "places/"
      const cleanPlaceId = placeId.replace('places/', '');

      const url = `${this.baseUrl}/places/${cleanPlaceId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.getHeaders(),
          'X-Goog-FieldMask':
            'id,displayName,formattedAddress,internationalPhoneNumber,websiteUri,rating,userRatingCount',
        },
      });

      if (!response.ok) {
        this.logger.error(
          `Google Places API error: ${response.status} ${response.statusText}`,
        );
        return this.generateFallbackDetails(placeId);
      }

      const place = await response.json();

      return {
        placeId: place.id || placeId,
        name: place.displayName?.text || 'Unknown',
        formattedAddress: place.formattedAddress || '',
        formattedPhoneNumber: place.internationalPhoneNumber,
        website: place.websiteUri,
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        reviewUrl: this.generateReviewUrl(cleanPlaceId),
      };
    } catch (error) {
      this.logger.error('Failed to get place details:', error);
      return this.generateFallbackDetails(placeId);
    }
  }

  /**
   * Genera la URL directa para dejar una reseña en Google
   * Esta es la URL que se envía a los pacientes felices
   * @param placeId Google Place ID
   * @returns URL para dejar review
   */
  generateReviewUrl(placeId: string): string {
    // Formato oficial de Google Maps para escribir una reseña
    return `https://search.google.com/local/writereview?placeid=${placeId}`;
  }

  /**
   * Genera una URL de Google Maps para ver el lugar
   * @param placeId Google Place ID
   * @returns URL de Google Maps
   */
  generateMapsUrl(placeId: string): string {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  }

  /**
   * Valida si un Place ID es válido (formato correcto)
   * @param placeId Posible Place ID
   * @returns true si tiene el formato correcto
   */
  isValidPlaceId(placeId: string): boolean {
    // Los Place IDs de Google tienen un formato específico
    // Ejemplo: ChIJN1t_tDeuEmsRUsoyG83frY4
    return /^[A-Za-z0-9_-]{20,}$/.test(placeId);
  }

  /**
   * Genera detalles básicos cuando no hay API key
   * Permite que el sistema funcione sin Google Places API
   */
  private generateFallbackDetails(placeId: string): PlaceDetails {
    this.logger.warn(
      `Using fallback details for place ${placeId} (API not configured)`,
    );
    return {
      placeId,
      name: 'Consultorio',
      formattedAddress: 'Dirección no disponible',
      reviewUrl: this.generateReviewUrl(placeId),
    };
  }

  /**
   * Autocomplete de lugares (New API v1)
   * @param input Texto parcial (ej: "Dr. Juan")
   * @param location Coordenadas opcionales
   * @returns Sugerencias de autocompletado
   */
  async autocomplete(
    input: string,
    location?: { lat: number; lng: number },
  ): Promise<Array<{ placeId: string; description: string }>> {
    if (!this.apiKey || input.length < 3) {
      return [];
    }

    try {
      const body: any = {
        input,
        includedPrimaryTypes: ['hospital', 'doctor', 'dentist', 'health'],
      };

      if (location) {
        body.locationBias = {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng,
            },
            radius: 10000, // 10km
          },
        };
      }

      const url = `${this.baseUrl}/places:autocomplete`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        this.logger.error(`Google Autocomplete API error: ${response.status}`);
        return [];
      }

      const data = await response.json();

      if (!data.suggestions) {
        return [];
      }

      return data.suggestions
        .filter((suggestion: any) => suggestion.placePrediction)
        .map((suggestion: any) => ({
          placeId: suggestion.placePrediction.placeId,
          description: suggestion.placePrediction.text?.text || '',
        }));
    } catch (error) {
      this.logger.error('Failed to autocomplete:', error);
      return [];
    }
  }

  /**
   * Geocoding: Convierte dirección a coordenadas (New API v1)
   * Útil para búsquedas geográficas
   */
  async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lng: number } | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      // La nueva API usa searchText para geocoding también
      const body = {
        textQuery: address,
      };

      const url = `${this.baseUrl}/places:searchText`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'X-Goog-FieldMask': 'places.location',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.places && data.places.length > 0) {
        const location = data.places[0].location;
        return {
          lat: location.latitude,
          lng: location.longitude,
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to geocode address:', error);
      return null;
    }
  }
}
