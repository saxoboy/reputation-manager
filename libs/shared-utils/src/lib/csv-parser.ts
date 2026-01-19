import { parse } from 'csv-parse/sync';

export interface CsvPatientRow {
  name: string;
  phone: string;
  email?: string;
  appointmentTime: string;
  appointmentType?: string;
  hasConsent: string | boolean;
}

export interface ParsedPatient {
  name: string;
  phone: string;
  email?: string;
  appointmentTime: Date;
  appointmentType?: string;
  hasConsent: boolean;
}

export interface CsvValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface CsvParseResult {
  patients: ParsedPatient[];
  errors: CsvValidationError[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

const ECUADOR_PHONE_REGEX = /^\+593\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida que el teléfono tenga formato ecuatoriano: +593XXXXXXXXX
 */
export function validateEcuadorPhone(phone: string): boolean {
  return ECUADOR_PHONE_REGEX.test(phone.trim());
}

/**
 * Normaliza el teléfono ecuatoriano
 * Ejemplos:
 *   0999999999 -> +593999999999
 *   593999999999 -> +593999999999
 *   +593999999999 -> +593999999999
 */
export function normalizeEcuadorPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');

  // Ya tiene formato correcto
  if (cleaned.startsWith('+593') && cleaned.length === 13) {
    return cleaned;
  }

  // Formato: 593XXXXXXXXX
  if (cleaned.startsWith('593') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // Formato: 0XXXXXXXXX (local)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+593${cleaned.substring(1)}`;
  }

  // Formato: XXXXXXXXX (sin código)
  if (cleaned.length === 9) {
    return `+593${cleaned}`;
  }

  return phone; // Devolver original si no se puede normalizar
}

/**
 * Valida email básico
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Parsea CSV de pacientes y retorna pacientes válidos + errores
 */
export function parsePatientsCSV(
  csvContent: string,
  options: {
    skipHeader?: boolean;
    delimiter?: string;
  } = {},
): CsvParseResult {
  const { skipHeader = true, delimiter = ',' } = options;

  const errors: CsvValidationError[] = [];
  const patients: ParsedPatient[] = [];

  try {
    // Parse CSV
    const records = parse(csvContent, {
      columns: true, // Importante: convierte a objetos con las columnas como keys
      skip_empty_lines: true,
      delimiter,
      trim: true,
      relaxColumnCount: true,
    }) as CsvPatientRow[];

    // Validar cada fila
    records.forEach((record, index) => {
      const rowNumber = skipHeader ? index + 2 : index + 1; // +2 porque header es 1
      const rowErrors: CsvValidationError[] = [];

      // Validar nombre (requerido)
      if (!record.name || record.name.trim().length === 0) {
        rowErrors.push({
          row: rowNumber,
          field: 'name',
          value: record.name || '',
          message: 'El nombre es requerido',
        });
      }

      // Validar teléfono (requerido)
      if (!record.phone || record.phone.trim().length === 0) {
        rowErrors.push({
          row: rowNumber,
          field: 'phone',
          value: record.phone || '',
          message: 'El teléfono es requerido',
        });
      } else {
        const normalizedPhone = normalizeEcuadorPhone(record.phone);
        if (!validateEcuadorPhone(normalizedPhone)) {
          rowErrors.push({
            row: rowNumber,
            field: 'phone',
            value: record.phone,
            message: `Teléfono inválido. Formato esperado: +593XXXXXXXXX o 0XXXXXXXXX. Recibido: ${record.phone}`,
          });
        }
      }

      // Validar email (opcional pero si existe debe ser válido)
      if (record.email && record.email.trim().length > 0) {
        if (!validateEmail(record.email)) {
          rowErrors.push({
            row: rowNumber,
            field: 'email',
            value: record.email,
            message: 'Email inválido',
          });
        }
      }

      // Validar appointmentTime (requerido)
      if (
        !record.appointmentTime ||
        record.appointmentTime.trim().length === 0
      ) {
        rowErrors.push({
          row: rowNumber,
          field: 'appointmentTime',
          value: record.appointmentTime || '',
          message: 'La fecha/hora de la cita es requerida',
        });
      } else {
        const appointmentDate = new Date(record.appointmentTime);
        if (isNaN(appointmentDate.getTime())) {
          rowErrors.push({
            row: rowNumber,
            field: 'appointmentTime',
            value: record.appointmentTime,
            message: `Fecha/hora inválida. Formato esperado: ISO 8601 (YYYY-MM-DDTHH:mm:ss). Recibido: ${record.appointmentTime}`,
          });
        }
      }

      // Validar hasConsent (requerido, debe ser true)
      let hasConsent = false;
      if (typeof record.hasConsent === 'boolean') {
        hasConsent = record.hasConsent;
      } else if (typeof record.hasConsent === 'string') {
        const consentStr = record.hasConsent.toLowerCase().trim();
        hasConsent =
          consentStr === 'true' ||
          consentStr === '1' ||
          consentStr === 'yes' ||
          consentStr === 'si' ||
          consentStr === 'sí';
      }

      if (!hasConsent) {
        rowErrors.push({
          row: rowNumber,
          field: 'hasConsent',
          value: String(record.hasConsent || ''),
          message:
            'El paciente debe dar consentimiento (hasConsent debe ser true)',
        });
      }

      // Si hay errores en esta fila, agregar a la lista de errores
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        // Fila válida, agregar paciente
        patients.push({
          name: record.name.trim(),
          phone: normalizeEcuadorPhone(record.phone),
          email: record.email?.trim() || undefined,
          appointmentTime: new Date(record.appointmentTime),
          appointmentType: record.appointmentType?.trim() || undefined,
          hasConsent,
        });
      }
    });

    return {
      patients,
      errors,
      totalRows: records.length,
      validRows: patients.length,
      invalidRows: errors.length > 0 ? records.length - patients.length : 0,
    };
  } catch (error) {
    // Error al parsear CSV
    return {
      patients: [],
      errors: [
        {
          row: 0,
          field: 'file',
          value: '',
          message:
            error instanceof Error
              ? `Error al parsear CSV: ${error.message}`
              : 'Error desconocido al parsear CSV',
        },
      ],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    };
  }
}
