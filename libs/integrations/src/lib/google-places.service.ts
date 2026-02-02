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
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    this.apiKey = process.env['GOOGLE_PLACES_API_KEY'] || '';
    if (!this.apiKey) {
      this.logger.warn(
        'GOOGLE_PLACES_API_KEY not found. Google Places features will be limited.',
      );
    }
  }

  /**
   * Busca lugares usando la API de Google Places
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
      const params = new URLSearchParams({
        query,
        key: this.apiKey,
        fields:
          'place_id,name,formatted_address,rating,user_ratings_total,geometry',
      });

      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '5000'); // 5km radius
      }

      const url = `${this.baseUrl}/place/textsearch/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        this.logger.error(
          `Google Places API error: ${data.status} - ${data.error_message}`,
        );
        return [];
      }

      return data.results.map((result: any) => ({
        placeId: result.place_id,
        name: result.name,
        address: result.formatted_address,
        rating: result.rating,
        userRatingsTotal: result.user_ratings_total,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      }));
    } catch (error) {
      this.logger.error('Failed to search places:', error);
      return [];
    }
  }

  /**
   * Obtiene detalles completos de un lugar por Place ID
   * @param placeId Google Place ID
   * @returns Detalles del lugar incluyendo URL de reviews
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) {
      this.logger.warn('Google Places API key not configured');
      return this.generateFallbackDetails(placeId);
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        fields:
          'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,url',
      });

      const url = `${this.baseUrl}/place/details/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        this.logger.error(
          `Google Places API error: ${data.status} - ${data.error_message}`,
        );
        return this.generateFallbackDetails(placeId);
      }

      const result = data.result;
      return {
        placeId: result.place_id,
        name: result.name,
        formattedAddress: result.formatted_address,
        formattedPhoneNumber: result.formatted_phone_number,
        website: result.website,
        rating: result.rating,
        userRatingsTotal: result.user_ratings_total,
        reviewUrl: this.generateReviewUrl(result.place_id),
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
   * Autocomplete de lugares (para formularios)
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
      const params = new URLSearchParams({
        input,
        key: this.apiKey,
        types: 'establishment',
      });

      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '10000'); // 10km
      }

      const url = `${this.baseUrl}/place/autocomplete/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        this.logger.error(`Google Autocomplete API error: ${data.status}`);
        return [];
      }

      return data.predictions.map((pred: any) => ({
        placeId: pred.place_id,
        description: pred.description,
      }));
    } catch (error) {
      this.logger.error('Failed to autocomplete:', error);
      return [];
    }
  }

  /**
   * Geocoding: Convierte dirección a coordenadas
   * Útil para búsquedas geográficas
   */
  async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lng: number } | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        address,
        key: this.apiKey,
      });

      const url = `${this.baseUrl}/geocode/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || data.results.length === 0) {
        this.logger.warn(`Geocoding failed for address: ${address}`);
        return null;
      }

      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } catch (error) {
      this.logger.error('Failed to geocode address:', error);
      return null;
    }
  }
}
