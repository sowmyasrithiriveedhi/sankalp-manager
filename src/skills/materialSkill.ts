import { mcpGetMaterials, mcpAddMaterial, mcpDeleteMaterial } from '../mcps/supabaseMcp';
import { Material } from '../lib/supabaseClient';

/**
 * materialSkill Module
 * In Antigravity architecture, a Skill contains localized domain logic and talks directly
 * to the MCP integration layer.
 */

export async function getMaterialsSkill(): Promise<Material[]> {
  // Directly retrieve from the MCP layer
  return await mcpGetMaterials();
}

export async function addMaterialSkill(
  name: string,
  totalQuantity: number,
  pricePerDay: number
): Promise<Material> {
  return await mcpAddMaterial(name, totalQuantity, pricePerDay);
}

export async function deleteMaterialSkill(id: string): Promise<void> {
  return await mcpDeleteMaterial(id);
}
