import { useState, useEffect, useCallback } from 'react';
import { getMaterialsSkill, addMaterialSkill } from '../skills/materialSkill';
import { Material } from '../lib/supabaseClient';

/**
 * useMaterials Custom React Hook
 * Interfaces between the materials list UI and the materialSkill layer.
 */

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMaterialsSkill();
      setMaterials(data);
    } catch (err: any) {
      console.error('Failed to load materials:', err);
      setError(err.message || 'Failed to fetch materials.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const addMaterial = async (
    name: string,
    totalQuantity: number,
    pricePerDay: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await addMaterialSkill(name, totalQuantity, pricePerDay);
      await fetchMaterials(); // Refresh materials
      return true;
    } catch (err: any) {
      console.error('Failed to add material:', err);
      setError(err.message || 'Failed to add material.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    materials,
    isLoading,
    error,
    addMaterial,
    refreshMaterials: fetchMaterials
  };
}
