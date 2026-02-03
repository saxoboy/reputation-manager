'use client';

import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '../ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { Practice } from '../../services/practice.service';

interface AnalyticsFiltersProps {
  practices: Practice[];
  selectedPracticeId?: string;
  dateRange?: DateRange;
  onPracticeChange: (practiceId: string | undefined) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onClearFilters: () => void;
}

export function AnalyticsFilters({
  practices,
  selectedPracticeId,
  dateRange,
  onPracticeChange,
  onDateRangeChange,
  onClearFilters,
}: AnalyticsFiltersProps) {
  const hasFilters = selectedPracticeId || dateRange?.from;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
      />

      <Select value={selectedPracticeId} onValueChange={onPracticeChange}>
        <SelectTrigger className="w-62.5">
          <SelectValue placeholder="Todos los consultorios" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los consultorios</SelectItem>
          {practices.map((practice) => (
            <SelectItem key={practice.id} value={practice.id}>
              {practice.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
