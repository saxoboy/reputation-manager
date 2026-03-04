'use client';

import { useEffect, useState, useRef } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, MapPin, Search } from 'lucide-react';
import {
  googlePlacesService,
  GooglePlaceAutocomplete,
} from '../../services/google-places.service';
import { cn } from '../../lib/utils';

interface GooglePlacesAutocompleteProps {
  workspaceId: string;
  value: string;
  onSelect: (placeId: string, description: string) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function GooglePlacesAutocompleteInput({
  workspaceId,
  value,
  onSelect,
  onInputChange,
  placeholder = 'Buscar en Google Maps...',
  label = 'Ubicación',
  required = false,
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<GooglePlaceAutocomplete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce para el autocomplete
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (inputValue.length >= 3) {
        setIsLoading(true);
        try {
          const results = await googlePlacesService.autocomplete(
            workspaceId,
            inputValue,
          );
          setPredictions(results);
          setShowDropdown(true);
        } catch (error) {
          console.error('Error fetching predictions:', error);
          setPredictions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, workspaceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onInputChange?.(newValue);
  };

  const handleSelect = (prediction: GooglePlaceAutocomplete) => {
    setInputValue(prediction.description);
    onSelect(prediction.placeId, prediction.description);
    setShowDropdown(false);
    setPredictions([]);
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <Label htmlFor="google-places-input">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <Input
          id="google-places-input"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10"
          required={required}
          autoComplete="off"
        />

        {/* Dropdown con predicciones — dentro del div relative para posicionarse correctamente */}
        {showDropdown && predictions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-200 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover shadow-lg">
            {predictions.map((prediction) => (
              <button
                key={prediction.placeId}
                type="button"
                onClick={() => handleSelect(prediction)}
                className={cn(
                  'w-full text-left px-3 py-2 hover:bg-accent transition-colors',
                  'flex items-start gap-2 text-sm',
                )}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="flex-1">{prediction.description}</span>
              </button>
            ))}
          </div>
        )}

        {/* Mensaje si no hay resultados */}
        {showDropdown &&
          !isLoading &&
          predictions.length === 0 &&
          inputValue.length >= 3 && (
            <div className="absolute left-0 right-0 top-full z-200 mt-1 rounded-md border border-border bg-popover p-3 shadow-lg text-sm text-muted-foreground">
              No se encontraron resultados. Intenta con otro término de
              búsqueda.
            </div>
          )}
      </div>
    </div>
  );
}
