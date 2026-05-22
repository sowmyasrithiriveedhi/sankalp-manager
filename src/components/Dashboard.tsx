'use client';

import React, { useState } from 'react';
import { DashboardStatsData } from '../hooks/useDashboardStats';
import { useMaterials } from '../hooks/useMaterials';
import { useCustomers } from '../hooks/useCustomers';
import { useRentals } from '../hooks/useRentals';
import { Rental } from '../lib/supabaseClient';

interface DashboardProps {
  stats: DashboardStatsData;
  isLoading: boolean;
  error: string | null;
  userEmail: string | null;
  onLogout: () => Promise<boolean>;
  onRefresh: () => void;
}

type TabType = 'overview' | 'materials' | 'customers' | 'rentals';

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
    refreshMaterials
  } = useMaterials();

  const {
    customers,
    isLoading: isCustomersLoading,
    error: customersError,
    addCustomer,
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

  // Customer Form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custFormError, setCustFormError] = useState<string | null>(null);
  const [custSuccess, setCustSuccess] = useState(false);

  // Rental Allocation Form
  const [rentCustId, setRentCustId] = useState('');
  const [rentMatId, setRentMatId] = useState('');
  const [rentQty, setRentQty] = useState('1');
  const [rentDate, setRentDate] = useState(todayStr);
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

  const handleAllocateRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRentFormError(null);
    setRentSuccess(false);

    if (!rentCustId || !rentMatId || !rentQty.trim() || !rentDate) {
      setRentFormError('Please select a customer, material, quantity, and date.');
      return;
    }

    const qty = parseInt(rentQty);
    if (isNaN(qty) || qty <= 0) {
      setRentFormError('Quantity must be a positive integer.');
      return;
    }

    // Allocate rental (will perform automatic stock check inside rentalSubagent)
    const result = await allocateRental(rentCustId, rentMatId, qty, rentDate, materials);
    
    if (result.success) {
      setRentCustId('');
      setRentMatId('');
      setRentQty('1');
      setRentDate(todayStr);
      setRentSuccess(true);
      handleGlobalRefresh();
      setTimeout(() => setRentSuccess(false), 3000);
    } else {
      // Display the stock validation or insertion error directly
      setRentFormError(result.error || 'Failed to allocate rental.');
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
                Step 3 is fully operational! The system checks stock automatically when allocating new rentals and reduces the Available Stock metric immediately. When rentals are marked as returned, the system dynamically calculates total rent based on pricing and duration, increments the stock level back, and registers the returned log.
              </p>
            </div>
          </div>
        )}

        {/* --- MATERIALS TAB CONTENT --- */}
        {activeTab === 'materials' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Materials List Table */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Construction Materials Catalog</h2>
              {isMaterialsLoading ? (
                <div className="text-sm text-gray-500">Loading catalog items...</div>
              ) : materials.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed border-gray-300 p-6 rounded-md text-center">
                  No materials cataloged yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-xs">
                  <table className="min-w-full divide-y divide-gray-200">
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

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

              <form onSubmit={handleAddMaterialSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  Add Material
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- CUSTOMERS TAB CONTENT --- */}
        {activeTab === 'customers' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Customers List Table */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Registered Customer Registry</h2>
              {isCustomersLoading ? (
                <div className="text-sm text-gray-500">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed border-gray-300 p-6 rounded-md text-center">
                  No customers registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-xs">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Number
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

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

              <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  Register Customer
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- RENTALS TAB CONTENT --- */}
        {activeTab === 'rentals' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Rentals Registry Logs */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Rental Allocations History</h2>
              
              {isRentalsLoading ? (
                <div className="text-sm text-gray-500">Loading rental logs...</div>
              ) : rentals.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed border-gray-300 p-6 rounded-md text-center">
                  No active or completed rentals logged. Allocate items on the right to start.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-xs">
                  <table className="min-w-full divide-y divide-gray-200">
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
                  <label htmlFor="rent-material" className="block text-xs font-medium text-gray-700 mb-1">
                    Select Material
                  </label>
                  <select
                    id="rent-material"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    value={rentMatId}
                    onChange={(e) => setRentMatId(e.target.value)}
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

                <div>
                  <label htmlFor="rent-qty" className="block text-xs font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    id="rent-qty"
                    type="number"
                    min="1"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="1"
                    value={rentQty}
                    onChange={(e) => setRentQty(e.target.value)}
                  />
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

                <button
                  type="submit"
                  className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  Allocate Rental
                </button>
              </form>
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
                      
                      const days = Math.ceil(Math.abs(tReturn - tRental) / (1000 * 60 * 60 * 24)) || 1;
                      const cost = activeReturnRental.quantity * mat.price_per_day * days;
                      return `Dynamic billing estimate: ₹${mat.price_per_day} × ${activeReturnRental.quantity} qty × ${days} days = ₹${cost}`;
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
      </main>
    </div>
  );
}
