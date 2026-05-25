'use client';

import React, { useState } from 'react';
import { DashboardStatsData } from '../hooks/useDashboardStats';
import { useMaterials } from '../hooks/useMaterials';
import { useCustomers } from '../hooks/useCustomers';
import { useRentals } from '../hooks/useRentals';
import { Rental, Material, Customer } from '../lib/supabaseClient';

interface DashboardProps {
  stats: DashboardStatsData;
  isLoading: boolean;
  error: string | null;
  userEmail: string | null;
  onLogout: () => Promise<boolean>;
  onRefresh: () => void;
}

type TabType = 'overview' | 'materials' | 'customers' | 'rentals';

// A single row in the multi-material rental form
interface RentalRow {
  id: number;
  matId: string;
  qty: string;
}

export default function Dashboard({
  stats,
  isLoading,
  error,
  userEmail,
  onLogout,
  onRefresh
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Today's date formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Load hooks
  const {
    materials,
    isLoading: isMaterialsLoading,
    error: materialsError,
    addMaterial,
    removeMaterial,
    updateMaterial,
    refreshMaterials
  } = useMaterials();

  const {
    customers,
    isLoading: isCustomersLoading,
    error: customersError,
    addCustomer,
    removeCustomer,
    updateCustomer,
    refreshCustomers
  } = useCustomers();

  const {
    rentals,
    isLoading: isRentalsLoading,
    error: rentalsError,
    allocateRental,
    returnRental,
    refreshRentals
  } = useRentals();

  // --- FORM STATES ---

  // Material Form
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('');
  const [matPrice, setMatPrice] = useState('');
  const [matFormError, setMatFormError] = useState<string | null>(null);
  const [matSuccess, setMatSuccess] = useState(false);

  // Edit Material Modal
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [editMatName, setEditMatName] = useState('');
  const [editMatQty, setEditMatQty] = useState('');
  const [editMatPrice, setEditMatPrice] = useState('');
  const [editMatError, setEditMatError] = useState<string | null>(null);

  // Customer Form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custFormError, setCustFormError] = useState<string | null>(null);
  const [custSuccess, setCustSuccess] = useState(false);

  // Edit Customer Modal
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustError, setEditCustError] = useState<string | null>(null);

  // Rental Allocation Form — supports multiple material rows
  const [rentCustId, setRentCustId] = useState('');
  const [rentDate, setRentDate] = useState(todayStr);
  const [rentalRows, setRentalRows] = useState<RentalRow[]>([{ id: Date.now(), matId: '', qty: '1' }]);
  const [rentFormError, setRentFormError] = useState<string | null>(null);
  const [rentSuccess, setRentSuccess] = useState(false);

  // Return Rental Form Modal State
  const [activeReturnRental, setActiveReturnRental] = useState<Rental | null>(null);
  const [returnDate, setReturnDate] = useState(todayStr);
  const [returnFormError, setReturnFormError] = useState<string | null>(null);

  // --- ACTIONS ---

  const handleGlobalRefresh = () => {
    onRefresh();
    refreshMaterials();
    refreshCustomers();
    refreshRentals();
  };

  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatFormError(null);
    setMatSuccess(false);

    if (!matName.trim() || !matQty.trim() || !matPrice.trim()) {
      setMatFormError('All fields are required.');
      return;
    }

    const qty = parseInt(matQty);
    const price = parseFloat(matPrice);

    if (isNaN(qty) || qty <= 0) {
      setMatFormError('Quantity must be a positive integer.');
      return;
    }

    if (isNaN(price) || price <= 0) {
      setMatFormError('Price must be a positive number.');
      return;
    }

    const success = await addMaterial(matName.trim(), qty, price);
    if (success) {
      setMatName('');
      setMatQty('');
      setMatPrice('');
      setMatSuccess(true);
      handleGlobalRefresh();
      setTimeout(() => setMatSuccess(false), 3000);
    }
  };

  const handleOpenEditMaterial = (mat: Material) => {
    setEditMaterial(mat);
    setEditMatName(mat.name);
    setEditMatQty(String(mat.total_quantity));
    setEditMatPrice(String(mat.price_per_day));
    setEditMatError(null);
  };

  const handleEditMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMaterial) return;
    setEditMatError(null);

    if (!editMatName.trim() || !editMatQty.trim() || !editMatPrice.trim()) {
      setEditMatError('All fields are required.');
      return;
    }
    const qty = parseInt(editMatQty);
    const price = parseFloat(editMatPrice);
    if (isNaN(qty) || qty <= 0) { setEditMatError('Quantity must be a positive integer.'); return; }
    if (isNaN(price) || price <= 0) { setEditMatError('Price must be a positive number.'); return; }

    const success = await updateMaterial(editMaterial.id, editMatName.trim(), qty, price);
    if (success) {
      setEditMaterial(null);
      handleGlobalRefresh();
    } else {
      setEditMatError('Failed to update material. Please try again.');
    }
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustFormError(null);
    setCustSuccess(false);

    if (!custName.trim() || !custPhone.trim()) {
      setCustFormError('All fields are required.');
      return;
    }

    const success = await addCustomer(custName.trim(), custPhone.trim());
    if (success) {
      setCustName('');
      setCustPhone('');
      setCustSuccess(true);
      handleGlobalRefresh();
      setTimeout(() => setCustSuccess(false), 3000);
    }
  };

  const handleOpenEditCustomer = (cust: Customer) => {
    setEditCustomer(cust);
    setEditCustName(cust.name);
    setEditCustPhone(cust.phone);
    setEditCustError(null);
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    setEditCustError(null);

    if (!editCustName.trim() || !editCustPhone.trim()) {
      setEditCustError('All fields are required.');
      return;
    }

    const success = await updateCustomer(editCustomer.id, editCustName.trim(), editCustPhone.trim());
    if (success) {
      setEditCustomer(null);
      handleGlobalRefresh();
    } else {
      setEditCustError('Failed to update customer. Please try again.');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material? This may cause issues if there are active rentals.')) {
      const success = await removeMaterial(id);
      if (success) {
        handleGlobalRefresh();
      } else {
        alert('Failed to delete material.');
      }
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This may cause issues if they have active rentals.')) {
      const success = await removeCustomer(id);
      if (success) {
        handleGlobalRefresh();
      } else {
        alert('Failed to delete customer.');
      }
    }
  };

  // --- Rental Row Helpers ---
  const addRentalRow = () => {
    setRentalRows(rows => [...rows, { id: Date.now(), matId: '', qty: '1' }]);
  };

  const removeRentalRow = (rowId: number) => {
    setRentalRows(rows => rows.filter(r => r.id !== rowId));
  };

  const updateRentalRow = (rowId: number, field: 'matId' | 'qty', value: string) => {
    setRentalRows(rows => rows.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  const handleAllocateRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRentFormError(null);
    setRentSuccess(false);

    if (!rentCustId || !rentDate) {
      setRentFormError('Please select a customer and a rental date.');
      return;
    }

    const validRows = rentalRows.filter(r => r.matId);
    if (validRows.length === 0) {
      setRentFormError('Please select at least one material.');
      return;
    }

    for (const row of validRows) {
      const qty = parseInt(row.qty);
      if (isNaN(qty) || qty <= 0) {
        setRentFormError('All quantities must be positive integers.');
        return;
      }
      const mat = materials.find(m => m.id === row.matId);
      if (!mat) { setRentFormError('Invalid material selected.'); return; }
      const avail = getDynamicAvailableStock(mat.id, mat.total_quantity);
      if (qty > avail) {
        setRentFormError(`Insufficient stock for "${mat.name}". Available: ${avail}, requested: ${qty}.`);
        return;
      }
    }

    // Allocate each row as a separate rental record
    let allSuccess = true;
    let lastError = '';
    for (const row of validRows) {
      const qty = parseInt(row.qty);
      const result = await allocateRental(rentCustId, row.matId, qty, rentDate, materials);
      if (!result.success) {
        allSuccess = false;
        lastError = result.error || 'Failed to allocate rental.';
        break;
      }
    }

    if (allSuccess) {
      setRentCustId('');
      setRentDate(todayStr);
      setRentalRows([{ id: Date.now(), matId: '', qty: '1' }]);
      setRentSuccess(true);
      handleGlobalRefresh();
      setTimeout(() => setRentSuccess(false), 3000);
    } else {
      setRentFormError(lastError);
    }
  };

  const handleReturnRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnFormError(null);

    if (!activeReturnRental) return;
    if (!returnDate) {
      setReturnFormError('Please select a return date.');
      return;
    }

    // Validate return date is not before rental date
    if (new Date(returnDate) < new Date(activeReturnRental.rental_date)) {
      setReturnFormError('Return date cannot be before the rental allocation date.');
      return;
    }

    const result = await returnRental(activeReturnRental.id, returnDate, materials);

    if (result.success) {
      setActiveReturnRental(null);
      setReturnDate(todayStr);
      handleGlobalRefresh();
    } else {
      setReturnFormError(result.error || 'Failed to process return.');
    }
  };

  // --- DYNAMIC STOCK CALCULATION HELPER ---
  const getDynamicAvailableStock = (materialId: string, totalQty: number) => {
    const activeRentedQty = rentals
      .filter(r => r.material_id === materialId && r.status === 'Active')
      .reduce((sum, r) => sum + r.quantity, 0);
    return Math.max(0, totalQty - activeRentedQty);
  };

  const activeTabClass = "whitespace-nowrap border-b-2 border-indigo-600 py-4 px-1 text-sm font-medium text-indigo-600";
  const inactiveTabClass = "whitespace-nowrap border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700";

  const displayError = error || materialsError || customersError || rentalsError;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Navbar */}
      <header className="border-b border-gray-200 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SankalpManager</h1>
            <p className="text-xs text-gray-500">Construction Material Rentals</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full truncate max-w-[150px] sm:max-w-none">
              Admin: <strong className="text-gray-800 font-semibold">{userEmail}</strong>
            </span>
            <button
              onClick={onLogout}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error notification */}
        {displayError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="text-sm text-red-700">{displayError}</div>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8 overflow-x-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-2 sm:pb-0">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto w-full" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={activeTab === 'overview' ? activeTabClass : inactiveTabClass}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={activeTab === 'materials' ? activeTabClass : inactiveTabClass}
              >
                Materials
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={activeTab === 'customers' ? activeTabClass : inactiveTabClass}
              >
                Customers
              </button>
              <button
                onClick={() => setActiveTab('rentals')}
                className={activeTab === 'rentals' ? activeTabClass : inactiveTabClass}
              >
                Rentals
              </button>
            </nav>
            <button
              onClick={handleGlobalRefresh}
              disabled={isLoading || isMaterialsLoading || isCustomersLoading || isRentalsLoading}
              className="w-full sm:w-auto rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs disabled:bg-indigo-400 whitespace-nowrap mb-2 sm:mb-0"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* --- OVERVIEW TAB CONTENT --- */}
        {activeTab === 'overview' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Rental Performance Overview</h2>
            </div>

            {isLoading || isRentalsLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-xs">
                    <div className="h-4 bg-gray-200 rounded-sm w-2/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded-sm w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Materials */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Total Materials
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-gray-900">
                      {stats.totalMaterials}
                    </span>
                    <span className="text-xs text-gray-400">Unique cataloged</span>
                  </div>
                </div>

                {/* Active Rentals */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Active Rentals
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-indigo-600">
                      {stats.activeRentals}
                    </span>
                    <span className="text-xs text-gray-400">Ongoing hires out</span>
                  </div>
                </div>

                {/* Returned Rentals */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Returned Rentals
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-emerald-600">
                      {stats.returnedRentals}
                    </span>
                    <span className="text-xs text-gray-400">Completed cycles</span>
                  </div>
                </div>

                {/* Available Stock */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Available Stock
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-amber-600">
                      {stats.availableStock}
                    </span>
                    <span className="text-xs text-gray-400">Ready to hire</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick summary status info */}
            <div className="mt-12 rounded-lg border border-indigo-100 bg-indigo-50 p-6">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">
                SankalpManager System Operational
              </h3>
              <p className="text-sm text-indigo-700 leading-relaxed">
                Fully operational! Customers can take one or multiple materials in a single rental. The system checks stock automatically when allocating new rentals and reduces the Available Stock metric immediately. When rentals are marked as returned, the system dynamically calculates total rent based on pricing and duration, increments the stock level back, and registers the returned log.
              </p>
            </div>
          </div>
        )}

        {/* --- MATERIALS TAB CONTENT --- */}
        {activeTab === 'materials' && (
          <div className="flex flex-col gap-8">
            {/* Add Material Form */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs h-fit space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
                Register New Material
              </h3>

              {matFormError && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 text-xs text-red-700">
                  {matFormError}
                </div>
              )}
              {matSuccess && (
                <div className="rounded-md bg-green-50 p-3 border border-green-200 text-xs text-green-700">
                  Material added successfully!
                </div>
              )}

              <form onSubmit={handleAddMaterialSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label htmlFor="mat-name" className="block text-xs font-medium text-gray-700 mb-1">
                    Material Name
                  </label>
                  <input
                    id="mat-name"
                    type="text"
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. Iron Scaffolds"
                    value={matName}
                    onChange={(e) => setMatName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="mat-qty" className="block text-xs font-medium text-gray-700 mb-1">
                    Total Stock Quantity
                  </label>
                  <input
                    id="mat-qty"
                    type="number"
                    required
                    min="1"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. 50"
                    value={matQty}
                    onChange={(e) => setMatQty(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="mat-price" className="block text-xs font-medium text-gray-700 mb-1">
                    Price Per Day (₹)
                  </label>
                  <input
                    id="mat-price"
                    type="number"
                    required
                    min="1"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. 15"
                    value={matPrice}
                    onChange={(e) => setMatPrice(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
                  >
                    Add Material
                  </button>
                </div>
              </form>
            </div>

            {/* Materials List Table */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Construction Materials Catalog</h2>
              {isMaterialsLoading ? (
                <div className="text-sm text-gray-500">Loading catalog items...</div>
              ) : materials.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed border-gray-300 p-6 rounded-md text-center">
                  No materials cataloged yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-xs">
                  <table className="w-full min-w-[650px] divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Material Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Available Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price Per Day
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {materials.map((material) => {
                        const dynamicAvailable = getDynamicAvailableStock(material.id, material.total_quantity);
                        return (
                          <tr key={material.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                              {material.name}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {material.total_quantity}
                            </td>
                            <td className={`whitespace-nowrap px-6 py-4 text-sm font-semibold ${dynamicAvailable === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                              {dynamicAvailable}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">
                              ₹{material.price_per_day} / day
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-3">
                              <button
                                onClick={() => handleOpenEditMaterial(material)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(material.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}


        {/* --- CUSTOMERS TAB CONTENT --- */}
        {activeTab === 'customers' && (
          <div className="flex flex-col gap-8">
            {/* Add Customer Form */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs h-fit space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
                Register New Customer
              </h3>

              {custFormError && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 text-xs text-red-700">
                  {custFormError}
                </div>
              )}
              {custSuccess && (
                <div className="rounded-md bg-green-50 p-3 border border-green-200 text-xs text-green-700">
                  Customer registered successfully!
                </div>
              )}

              <form onSubmit={handleAddCustomerSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="cust-name" className="block text-xs font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. Rajesh Kumar"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="cust-phone" className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="cust-phone"
                    type="text"
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. +91 9876543210"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
                  >
                    Register Customer
                  </button>
                </div>
              </form>
            </div>

            {/* Customers List Table */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Registered Customer Registry</h2>
              {isCustomersLoading ? (
                <div className="text-sm text-gray-500">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed border-gray-300 p-6 rounded-md text-center">
                  No customers registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-xs">
                  <table className="w-full min-w-[500px] divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {customers.map((customer) => (
                        <tr key={customer.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                            {customer.name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {customer.phone}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-3">
                            <button
                              onClick={() => handleOpenEditCustomer(customer)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- RENTALS TAB CONTENT --- */}
        {activeTab === 'rentals' && (
          <div className="flex flex-col gap-8">
            {/* Allocate Rental Form */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xs h-fit space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
                Allocate Material Rental
              </h3>

              {rentFormError && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 text-xs text-red-700">
                  {rentFormError}
                </div>
              )}
              {rentSuccess && (
                <div className="rounded-md bg-green-50 p-3 border border-green-200 text-xs text-green-700">
                  Rental allocated successfully! Stock updated.
                </div>
              )}

              <form onSubmit={handleAllocateRentalSubmit} className="space-y-4">
                {/* Customer + Date row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rent-customer" className="block text-xs font-medium text-gray-700 mb-1">
                      Select Customer
                    </label>
                    <select
                      id="rent-customer"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                      value={rentCustId}
                      onChange={(e) => setRentCustId(e.target.value)}
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="rent-date" className="block text-xs font-medium text-gray-700 mb-1">
                      Rental Date
                    </label>
                    <input
                      id="rent-date"
                      type="date"
                      required
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                      value={rentDate}
                      onChange={(e) => setRentDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Material rows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Materials</span>
                    <button
                      type="button"
                      onClick={addRentalRow}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 border border-indigo-300 rounded px-2 py-1 hover:bg-indigo-50"
                    >
                      + Add Material
                    </button>
                  </div>

                  {rentalRows.map((row, idx) => {
                    return (
                      <div key={row.id} className="flex gap-3 items-end bg-gray-50 p-3 rounded-md border border-gray-200">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Material {idx + 1}
                          </label>
                          <select
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                            value={row.matId}
                            onChange={(e) => updateRentalRow(row.id, 'matId', e.target.value)}
                          >
                            <option value="">-- Choose Material --</option>
                            {materials.map(m => {
                              const avail = getDynamicAvailableStock(m.id, m.total_quantity);
                              return (
                                <option key={m.id} value={m.id} disabled={avail === 0}>
                                  {m.name} (Avail: {avail} / {m.total_quantity})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="w-28">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                          <input
                            type="number"
                            min="1"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                            value={row.qty}
                            onChange={(e) => updateRentalRow(row.id, 'qty', e.target.value)}
                          />
                        </div>
                        {rentalRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRentalRow(row.id)}
                            className="mb-0.5 text-red-500 hover:text-red-700 text-lg font-bold leading-none"
                            title="Remove row"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  Allocate Rental
                </button>
              </form>
            </div>

            {/* Rentals Registry Logs */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Rental Allocations History</h2>

              {isRentalsLoading ? (
                <div className="text-sm text-gray-500">Loading rental logs...</div>
              ) : rentals.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed border-gray-300 p-6 rounded-md text-center">
                  No active or completed rentals logged. Allocate items on the right to start.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-xs">
                  <table className="w-full min-w-[900px] divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Material
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dates
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rent Charged
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {rentals.map((rental) => {
                        const customer = customers.find(c => c.id === rental.customer_id);
                        const material = materials.find(m => m.id === rental.material_id);
                        return (
                          <tr key={rental.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                              {customer ? customer.name : 'Unknown Customer'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-800">
                              {material ? material.name : 'Unknown Material'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {rental.quantity}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500 space-y-1">
                              <div><strong>Rent:</strong> {rental.rental_date}</div>
                              {rental.return_date && <div><strong>Ret:</strong> {rental.return_date}</div>}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {rental.total_rent !== null ? `₹${rental.total_rent}` : '-'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-xs">
                              {rental.status === 'Active' ? (
                                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 font-semibold leading-5 text-blue-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 font-semibold leading-5 text-green-800">
                                  Returned
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-xs">
                              {rental.status === 'Active' && (
                                <button
                                  onClick={() => setActiveReturnRental(rental)}
                                  className="rounded-sm bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                  Return Item
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- RETURN RENTAL FORM MODAL PANEL --- */}
        {activeReturnRental && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md border border-gray-200 bg-white p-6 rounded-lg shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Process Rental Return
                </h3>
                <button
                  onClick={() => {
                    setActiveReturnRental(null);
                    setReturnFormError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg font-semibold"
                >
                  &times;
                </button>
              </div>

              {returnFormError && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 text-xs text-red-700">
                  {returnFormError}
                </div>
              )}

              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md space-y-1">
                <div><strong>Customer:</strong> {customers.find(c => c.id === activeReturnRental.customer_id)?.name || 'Unknown'}</div>
                <div><strong>Material:</strong> {materials.find(m => m.id === activeReturnRental.material_id)?.name || 'Unknown'}</div>
                <div><strong>Quantity:</strong> {activeReturnRental.quantity} units</div>
                <div><strong>Rented Date:</strong> {activeReturnRental.rental_date}</div>
                <div><strong>Daily Rate:</strong> ₹{materials.find(m => m.id === activeReturnRental.material_id)?.price_per_day || 0} / day</div>
              </div>

              <form onSubmit={handleReturnRentalSubmit} className="space-y-4">
                <div>
                  <label htmlFor="ret-date" className="block text-xs font-medium text-gray-700 mb-1">
                    Select Return Date
                  </label>
                  <input
                    id="ret-date"
                    type="date"
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>

                {/* Live Cost estimation directly shown */}
                {returnDate && activeReturnRental && (
                  <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 p-2.5 rounded-sm">
                    {(() => {
                      const mat = materials.find(m => m.id === activeReturnRental.material_id);
                      if (!mat) return '';

                      const tRental = new Date(activeReturnRental.rental_date).getTime();
                      const tReturn = new Date(returnDate).getTime();

                      if (tReturn < tRental) return 'Invalid return date Selected.';

                      const days = Math.round(Math.abs(tReturn - tRental) / (1000 * 60 * 60 * 24)) + 1;
                      const cost = activeReturnRental.quantity * mat.price_per_day * days;
                      return `Estimated: ₹${mat.price_per_day} × ${activeReturnRental.quantity} qty × ${days} days = ₹${cost}`;
                    })()}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReturnRental(null);
                      setReturnFormError(null);
                    }}
                    className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-md bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    Mark Returned
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- EDIT MATERIAL MODAL --- */}
        {editMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md border border-gray-200 bg-white p-6 rounded-lg shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900">Edit Material</h3>
                <button
                  onClick={() => { setEditMaterial(null); setEditMatError(null); }}
                  className="text-gray-400 hover:text-gray-600 text-lg font-semibold"
                >
                  &times;
                </button>
              </div>

              {editMatError && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 text-xs text-red-700">
                  {editMatError}
                </div>
              )}

              <form onSubmit={handleEditMaterialSubmit} className="space-y-4">
                <div>
                  <label htmlFor="edit-mat-name" className="block text-xs font-medium text-gray-700 mb-1">
                    Material Name
                  </label>
                  <input
                    id="edit-mat-name"
                    type="text"
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    value={editMatName}
                    onChange={(e) => setEditMatName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-mat-qty" className="block text-xs font-medium text-gray-700 mb-1">
                    Total Stock Quantity
                  </label>
                  <input
                    id="edit-mat-qty"
                    type="number"
                    required
                    min="1"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    value={editMatQty}
                    onChange={(e) => setEditMatQty(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-mat-price" className="block text-xs font-medium text-gray-700 mb-1">
                    Price Per Day (₹)
                  </label>
                  <input
                    id="edit-mat-price"
                    type="number"
                    required
                    min="1"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    value={editMatPrice}
                    onChange={(e) => setEditMatPrice(e.target.value)}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => { setEditMaterial(null); setEditMatError(null); }}
                    className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- EDIT CUSTOMER MODAL --- */}
        {editCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md border border-gray-200 bg-white p-6 rounded-lg shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900">Edit Customer</h3>
                <button
                  onClick={() => { setEditCustomer(null); setEditCustError(null); }}
                  className="text-gray-400 hover:text-gray-600 text-lg font-semibold"
                >
                  &times;
                </button>
              </div>

              {editCustError && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 text-xs text-red-700">
                  {editCustError}
                </div>
              )}

              <form onSubmit={handleEditCustomerSubmit} className="space-y-4">
                <div>
                  <label htmlFor="edit-cust-name" className="block text-xs font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    id="edit-cust-name"
                    type="text"
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    value={editCustName}
                    onChange={(e) => setEditCustName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-cust-phone" className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="edit-cust-phone"
                    type="text"
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    value={editCustPhone}
                    onChange={(e) => setEditCustPhone(e.target.value)}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => { setEditCustomer(null); setEditCustError(null); }}
                    className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
