import { apiClient } from '../lib/api-client';

export interface GooglePlaceAutocomplete {
  placeId: string;
  description: string;
}

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  formattedPhoneNumber?: string;
  rating?: number;
  userRatingsTotal?: number;
  website?: string;
}

export interface GooglePlaceSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating?: number;
  userRatingsTotal?: number;
}

/**
 * Servicio para interactuar con Google Places API a través del backend
 */
class GooglePlacesService {
  /**
   * Buscar lugares en Google Maps
   */
  async searchPlaces(
    workspaceId: string,
    query: string,
  ): Promise<GooglePlaceSearchResult[]> {
    if (!query || query.length < 3) {
      return [];
    }

    const params = new URLSearchParams({ query });
    return apiClient.get<GooglePlaceSearchResult[]>(
      `/workspaces/${workspaceId}/practices/search/google-places?${params}`,
    );
  }

  /**
   * Autocomplete de lugares de Google
   */
  async autocomplete(
    workspaceId: string,
    input: string,
  ): Promise<GooglePlaceAutocomplete[]> {
    if (!input || input.length < 3) {
      return [];
    }

    const params = new URLSearchParams({ input });
    return apiClient.get<GooglePlaceAutocomplete[]>(
      `/workspaces/${workspaceId}/practices/autocomplete/google-places?${params}`,
    );
  }

  /**
   * Obtener detalles de un lugar específico
   */
  async getPlaceDetails(
    workspaceId: string,
    placeId: string,
  ): Promise<GooglePlaceDetails> {
    return apiClient.get<GooglePlaceDetails>(
      `/workspaces/${workspaceId}/practices/google-places/${placeId}`,
    );
  }
}

export const googlePlacesService = new GooglePlacesService();
