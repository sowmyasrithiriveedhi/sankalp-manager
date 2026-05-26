import { useState, useEffect, useCallback } from 'react';
import { getMaterialsSkill, addMaterialSkill, deleteMaterialSkill, updateMaterialSkill } from '../skills/materialSkill';
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch materials.';
      console.error('Failed to load materials:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => { await fetchMaterials(); };
    void run();
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
      await fetchMaterials();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add material.';
      console.error('Failed to add material:', err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeMaterial = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteMaterialSkill(id);
      await fetchMaterials();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete material.';
      console.error('Failed to delete material:', err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMaterial = async (
    id: string,
    name: string,
    totalQuantity: number,
    pricePerDay: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await updateMaterialSkill(id, name, totalQuantity, pricePerDay);
      await fetchMaterials();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update material.';
      console.error('Failed to update material:', err);
      setError(message);
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
    removeMaterial,
    updateMaterial,
    refreshMaterials: fetchMaterials
  };
}
