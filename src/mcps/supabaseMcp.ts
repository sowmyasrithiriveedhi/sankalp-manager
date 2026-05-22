import { supabase, mockDb, Material, Customer, Rental } from '../lib/supabaseClient';

/**
 * Model Context Protocol (MCP) Integration Layer.
 * In Antigravity architecture, the MCP layer provides high-level capability interfaces
 * wrapping external APIs, Databases, or services.
 */

// --- Authentication MCP Tools ---

export async function mcpSignIn(email: string, password: string): Promise<{ success: boolean; error: string | null }> {
  try {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } else {
      // Simple Admin Mock Credentials
      if (email === 'admin@sankalp.com' && password === 'admin123') {
        mockDb.setAdminSession(true);
        return { success: true, error: null };
      } else {
        return { success: false, error: 'Invalid email or password. Use admin@sankalp.com and admin123 for Mock admin.' };
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Authentication error' };
  }
}

export async function mcpSignOut(): Promise<{ success: boolean; error: string | null }> {
  try {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } else {
      mockDb.setAdminSession(false);
      return { success: true, error: null };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Sign out error' };
  }
}

export async function mcpGetSession(): Promise<{ active: boolean; email: string | null }> {
  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        active: !!session,
        email: session?.user?.email || null
      };
    } else {
      const active = mockDb.getAdminSession();
      return {
        active,
        email: active ? 'admin@sankalp.com' : null
      };
    }
  } catch {
    return { active: false, email: null };
  }
}

// --- Data Fetching MCP Tools ---

export async function mcpGetMaterials(): Promise<Material[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('materials').select('*');
      if (error) throw error;
      return data || [];
    } else {
      return mockDb.getMaterials();
    }
  } catch (err) {
    console.error('MCP getMaterials error, falling back to mock:', err);
    return mockDb.getMaterials();
  }
}

export async function mcpGetRentals(): Promise<Rental[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('rentals').select('*');
      if (error) throw error;
      return data || [];
    } else {
      return mockDb.getRentals();
    }
  } catch (err) {
    console.error('MCP getRentals error, falling back to mock:', err);
    return mockDb.getRentals();
  }
}

export async function mcpGetCustomers(): Promise<Customer[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data || [];
    } else {
      return mockDb.getCustomers();
    }
  } catch (err) {
    console.error('MCP getCustomers error, falling back to mock:', err);
    return mockDb.getCustomers();
  }
}

// --- Data Modification MCP Tools ---

export async function mcpAddMaterial(
  name: string,
  totalQuantity: number,
  pricePerDay: number
): Promise<Material> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('materials')
        .insert([{ name, total_quantity: totalQuantity, price_per_day: pricePerDay }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      return mockDb.addMaterial(name, totalQuantity, pricePerDay);
    }
  } catch (err) {
    console.error('MCP addMaterial error, falling back to mock:', err);
    return mockDb.addMaterial(name, totalQuantity, pricePerDay);
  }
}

export async function mcpAddCustomer(name: string, phone: string): Promise<Customer> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ name, phone }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      return mockDb.addCustomer(name, phone);
    }
  } catch (err) {
    console.error('MCP addCustomer error, falling back to mock:', err);
    return mockDb.addCustomer(name, phone);
  }
}

export async function mcpCreateRental(
  customerId: string,
  materialId: string,
  quantity: number,
  rentalDate: string
): Promise<Rental> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('rentals')
        .insert([{ customer_id: customerId, material_id: materialId, quantity, rental_date: rentalDate, status: 'Active' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      return mockDb.addRental(customerId, materialId, quantity, rentalDate);
    }
  } catch (err) {
    console.error('MCP createRental error, falling back to mock:', err);
    return mockDb.addRental(customerId, materialId, quantity, rentalDate);
  }
}

export async function mcpReturnRental(
  rentalId: string,
  returnDate: string,
  totalRent: number
): Promise<Rental> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('rentals')
        .update({ return_date: returnDate, total_rent: totalRent, status: 'Returned' })
        .eq('id', rentalId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      return mockDb.updateRental(rentalId, returnDate, totalRent);
    }
  } catch (err) {
    console.error('MCP returnRental error, falling back to mock:', err);
    return mockDb.updateRental(rentalId, returnDate, totalRent);
  }
}
