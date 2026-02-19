'use client';

import { useState } from 'react';
import { CalendarIcon, Clock } from 'lucide-react';
import { es } from 'date-fns/locale';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { cn, formatDateTime } from '../../lib/utils';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Selecciona fecha y hora',
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange(undefined);
      return;
    }
    const result = new Date(day);
    result.setHours(value?.getHours() ?? 0, value?.getMinutes() ?? 0, 0, 0);
    onChange(result);
  };

  const handleHourChange = (hour: string) => {
    const base = value ? new Date(value) : new Date();
    base.setHours(parseInt(hour), base.getMinutes(), 0, 0);
    onChange(base);
  };

  const handleMinuteChange = (minute: string) => {
    const base = value ? new Date(value) : new Date();
    base.setMinutes(parseInt(minute), 0, 0);
    onChange(base);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {value ? formatDateTime(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDaySelect}
          locale={es}
          initialFocus
        />
        <div className="flex items-center gap-2 border-t px-3 py-3">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Hora:</span>

          {/* Horas */}
          <Select
            value={value ? pad(value.getHours()) : '00'}
            onValueChange={handleHourChange}
          >
            <SelectTrigger className="w-18 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {HOURS.map((h) => (
                <SelectItem key={h} value={String(h)} className="text-sm">
                  {pad(h)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground font-medium">:</span>

          {/* Minutos */}
          <Select
            value={value ? pad(value.getMinutes()) : '00'}
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger className="w-18 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {MINUTES.map((m) => (
                <SelectItem key={m} value={String(m)} className="text-sm">
                  {pad(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
