'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const data = await apiClient.get<Workspace[]>('/workspaces');
        // Por ahora seleccionamos automáticamente el primer workspace
        // TODO: Implementar selector de workspace y persistencia
        if (data && data.length > 0) {
          setWorkspace(data[0]);
        }
      } catch (err) {
        console.error(err);
        setError('Error loading workspace');
      } finally {
        setLoading(false);
      }
    }

    fetchWorkspace();
  }, []);

  return { workspace, loading, error };
}
