import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';



const hasRealCredentials =
  supabaseUrl &&
  supabaseAnonKey;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Initial materials data as requested
export interface Material {
  id: string;
  name: string;
  total_quantity: number;
  price_per_day: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Rental {
  id: string;
  customer_id: string;
  material_id: string;
  quantity: number;
  rental_date: string;
  return_date: string | null;
  total_rent: number | null;
  status: 'Active' | 'Returned';
}

const INITIAL_MATERIALS: Material[] = [
  { id: 'mat-1', name: 'Column Boxes', total_quantity: 40, price_per_day: 15 },
  { id: 'mat-2', name: 'Cutting Machine', total_quantity: 100, price_per_day: 10 },
  { id: 'mat-3', name: 'Sidewall Sheets', total_quantity: 15, price_per_day: 20 },
  { id: 'mat-4', name: 'Iron Jockeys', total_quantity: 8, price_per_day: 25 },
  { id: 'mat-5', name: 'Slab Sheets', total_quantity: 2, price_per_day: 30 },
  { id: 'mat-6', name: 'Flint Beam Sheets', total_quantity: 10, price_per_day: 18 },
  { id: 'mat-7', name: 'Acro Span', total_quantity: 20, price_per_day: 12 }
];

// Helper to check if we are in browser environment
const isBrowser = typeof window !== 'undefined';

// Local storage keys
const KEYS = {
  MATERIALS: 'sankalp_materials',
  CUSTOMERS: 'sankalp_customers',
  RENTALS: 'sankalp_rentals',
  ADMIN_SESSION: 'sankalp_admin_session'
};

// Initialize Mock LocalStorage DB
export const initMockDatabase = () => {
  if (!isBrowser) return;

  if (!localStorage.getItem(KEYS.MATERIALS)) {
    localStorage.setItem(KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
  }
  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.RENTALS)) {
    localStorage.setItem(KEYS.RENTALS, JSON.stringify([]));
  }
};

// Mock Database API for fallback
export const mockDb = {
  getMaterials: (): Material[] => {
    if (!isBrowser) return INITIAL_MATERIALS;
    initMockDatabase();
    return JSON.parse(localStorage.getItem(KEYS.MATERIALS) || '[]');
  },

  getCustomers: (): Customer[] => {
    if (!isBrowser) return [];
    initMockDatabase();
    return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]');
  },

  getRentals: (): Rental[] => {
    if (!isBrowser) return [];
    initMockDatabase();
    return JSON.parse(localStorage.getItem(KEYS.RENTALS) || '[]');
  },

  setAdminSession: (isActive: boolean) => {
    if (!isBrowser) return;
    if (isActive) {
      localStorage.setItem(KEYS.ADMIN_SESSION, 'true');
    } else {
      localStorage.removeItem(KEYS.ADMIN_SESSION);
    }
  },

  getAdminSession: (): boolean => {
    if (!isBrowser) return false;
    return localStorage.getItem(KEYS.ADMIN_SESSION) === 'true';
  },

  addMaterial: (name: string, total_quantity: number, price_per_day: number): Material => {
    const materials = mockDb.getMaterials();
    const newMaterial: Material = {
      id: `mat-${Date.now()}`,
      name,
      total_quantity,
      price_per_day
    };
    materials.push(newMaterial);
    localStorage.setItem(KEYS.MATERIALS, JSON.stringify(materials));
    return newMaterial;
  },

  addCustomer: (name: string, phone: string): Customer => {
    const customers = mockDb.getCustomers();
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name,
      phone
    };
    customers.push(newCustomer);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    return newCustomer;
  },

  addRental: (
    customer_id: string,
    material_id: string,
    quantity: number,
    rental_date: string
  ): Rental => {
    const rentals = mockDb.getRentals();
    const newRental: Rental = {
      id: `rent-${Date.now()}`,
      customer_id,
      material_id,
      quantity,
      rental_date,
      return_date: null,
      total_rent: null,
      status: 'Active'
    };
    rentals.push(newRental);
    localStorage.setItem(KEYS.RENTALS, JSON.stringify(rentals));
    return newRental;
  },

  updateRental: (
    rentalId: string,
    return_date: string,
    total_rent: number
  ): Rental => {
    const rentals = mockDb.getRentals();
    const index = rentals.findIndex(r => r.id === rentalId);
    if (index === -1) {
      throw new Error(`Rental record ${rentalId} not found.`);
    }

    rentals[index] = {
      ...rentals[index],
      return_date,
      total_rent,
      status: 'Returned'
    };

    localStorage.setItem(KEYS.RENTALS, JSON.stringify(rentals));
    return rentals[index];
  }
};
