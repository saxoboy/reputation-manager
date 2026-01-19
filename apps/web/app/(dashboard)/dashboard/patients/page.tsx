'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Search } from 'lucide-react';
import { Patient } from '../../../../types/mock-types';
import { PatientsList } from '../../../../components/patients/patients-list';
import { CreatePatientDialog } from '../../../../components/patients/create-patient-dialog';

const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    phone: '+593 99 123 4567',
    email: 'juan.perez@email.com',
    lastVisit: '2026-01-18',
    campaign: 'Pacientes Enero 2026',
    status: 'RESPONDED',
    rating: 5,
  },
  {
    id: '2',
    name: 'María García',
    phone: '+593 98 765 4321',
    email: null,
    lastVisit: '2026-01-18',
    campaign: 'Pacientes Enero 2026',
    status: 'SENT',
  },
  {
    id: '3',
    name: 'Carlos López',
    phone: '+593 99 111 2222',
    email: 'carlos.l@email.com',
    lastVisit: '2026-01-15',
    campaign: 'Pacientes Enero 2026',
    status: 'RESPONDED',
    rating: 2,
  },
  {
    id: '4',
    name: 'Ana Martinez',
    phone: '+593 97 888 9999',
    email: 'ana.m@email.com',
    lastVisit: '2025-12-20',
    campaign: 'Limpiezas Dentales Diciembre',
    status: 'OPT_OUT',
  },
  {
    id: '5',
    name: 'Roberto Torres',
    phone: '+593 96 333 4444',
    email: null,
    lastVisit: '2026-01-19',
    campaign: 'Individual',
    status: 'PENDING',
  },
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      (patient.email &&
        patient.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleCreatePatient = (newPatient: Patient) => {
    setPatients([newPatient, ...patients]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted-foreground">
            Gestiona tu base de pacientes y monitorea sus interacciones.
          </p>
        </div>

        <CreatePatientDialog onCreate={handleCreatePatient} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pacientes</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PatientsList patients={filteredPatients} />
        </CardContent>
      </Card>
    </div>
  );
}
