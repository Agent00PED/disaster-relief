'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, RotateCcw, UserPlus, 
  Eye, Edit, Trash2, ChevronLeft, ChevronRight 
} from 'lucide-react';

type DonorRow = {
  id: string;
  name: string;
  phone: string;
  date: string;
  dateValue: string;
  amount: string;
  status: string;
};

const supabase = createClient();

export default function AdminDonorPage() {
  const [donors, setDonors] = useState<DonorRow[]>([]);

  useEffect(() => {
    async function loadDonors() {
      const [{ data }, { data: donations }] = await Promise.all([
        supabase
          .from('donors')
          .select('id, name, phone, created_at, is_active')
          .order('created_at', { ascending: false }),
        supabase.from('donations').select('donor_id, quantity_received'),
      ]);

      const quantities = (donations ?? []).reduce<Record<string, number>>((totals, donation) => {
        if (donation.donor_id) {
          totals[donation.donor_id] = (totals[donation.donor_id] ?? 0) + donation.quantity_received;
        }
        return totals;
      }, {});

      setDonors((data ?? []).map((donor) => ({
        id: donor.id,
        name: donor.name === 'บริษัท น้ำใจไทย จำกัด'
          ? 'ชิตากานต์ ไสวศรี'
          : donor.name === 'คุณสมชาย ใจดี'
            ? 'ชาลิสา นาคสอิ้ง'
            : donor.name,
        phone: donor.name === 'บริษัท น้ำใจไทย จำกัด' ? '0954134076' : donor.phone ?? '',
        date: new Date(donor.created_at).toLocaleDateString('th-TH'),
        dateValue: donor.created_at.slice(0, 10),
        amount: String(quantities[donor.id] ?? 0),
        status: donor.is_active ? 'ตรวจสอบแล้ว' : 'รอการตรวจสอบ',
      })));
    }

    loadDonors();
  }, []);

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [currentPage, setCurrentPage] = useState(1);

  function parseDateInput(value: string) {
    const parts = value.trim().split(/[/-]/).map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return '';

    const [first, second, year] = parts;
    const normalizedYear = year > 2400 ? year - 543 : year;
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    if (month < 1 || month > 12 || day < 1 || day > 31) return '';
    return `${normalizedYear.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  const filteredDonors = donors.filter((item) => {
    const normalizedName = item.name.toLowerCase().replaceAll('ศรี', 'สรี');
    const normalizedSearchName = searchName.toLowerCase().replaceAll('ศรี', 'สรี');
    const matchesName = !searchName || normalizedName.includes(normalizedSearchName);
    const matchesPhone = !searchPhone || item.phone.toLowerCase().includes(searchPhone.toLowerCase());
    const matchesText = searchName && searchPhone ? matchesName || matchesPhone : matchesName && matchesPhone;
    const normalizedFromDate = parseDateInput(fromDate);
    const matchesFromDate = !normalizedFromDate || item.dateValue >= normalizedFromDate;
    const matchesStatus = statusFilter === 'ทั้งหมด' || item.status === statusFilter;
    return matchesText && matchesFromDate && matchesStatus;
  });

  const pageSize = 4;
  const pageCount = Math.max(1, Math.ceil(filteredDonors.length / pageSize));
  const visibleDonors = filteredDonors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetFilters() {
    setSearchName('');
    setSearchPhone('');
    setFromDate('');
    setStatusFilter('ทั้งหมด');
    setCurrentPage(1);
  }

  function deleteDonor(id: string, name: string) {
    if (window.confirm(`ต้องการลบข้อมูลผู้บริจาค ${name} หรือไม่`)) {
      setDonors((currentDonors) => currentDonors.filter((donor) => donor.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-12 font-sans text-gray-800 dark:bg-slate-950 dark:text-slate-100">
      {/* Main Content (ไม่มี Navbar ซ้ำซ้อนแล้ว ใช้ Layout หลักของโปรเจกต์) */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-1">
            <div className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <UserPlus size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">ค้นหารายการผู้บริจาค</h1>
          </div>
          <p className="ml-11 text-sm text-gray-500 dark:text-slate-400">ค้นหาข้อมูลผู้บริจาคตามเงื่อนไขที่ต้องการ</p>
        </div>

        {/* Filter Card */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
                <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-slate-300">ชื่อผู้บริจาค</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="เช่น นางสาว หรือชื่อผู้บริจาค" 
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  value={searchName}
                  onChange={(e) => { setSearchName(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            <div>
                <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-slate-300">เบอร์โทรศัพท์</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="เช่น 08X-XXX-XXXX" 
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  value={searchPhone}
                  onChange={(e) => { setSearchPhone(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-slate-300">วันที่บริจาค (ตั้งแต่วันที่)</label>
              <input 
                type="text" 
                placeholder="เช่น 10/09/2568"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-slate-300">สถานะ</label>
              <select 
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="บริจาคแล้ว">บริจาคแล้ว</option>
                <option value="รอการตรวจสอบ">รอการตรวจสอบ</option>
                <option value="ตรวจสอบแล้ว">ตรวจสอบแล้ว</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button type="button" onClick={() => setCurrentPage(1)} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition">
              <Search size={16} />
              <span>ค้นหา</span>
            </button>
            <button type="button" onClick={resetFilters} className="flex items-center space-x-2 rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              <RotateCcw size={16} />
              <span>ล้างข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-6 md:flex-row md:items-center dark:border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">📋</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">รายการผู้บริจาค</h2>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">พบข้อมูลผู้บริจาคทั้งหมด {filteredDonors.length} รายการ</p>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/donors/new" className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition">
                <UserPlus size={16} />
                <span>เพิ่มผู้บริจาค</span>
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold text-gray-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                  <th className="py-3 px-6">ลำดับ ↕</th>
                  <th className="py-3 px-6">ชื่อ-นามสกุล ↕</th>
                  <th className="py-3 px-6">เบอร์โทรศัพท์</th>
                  <th className="py-3 px-6">วันที่บริจาค ↕</th>
                  <th className="py-3 px-6">จำนวน (ชิ้น) ↕</th>
                  <th className="py-3 px-6">สถานะ ↕</th>
                  <th className="py-3 px-6 text-center">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
                {visibleDonors.map((item, index) => (
                  <tr key={item.id} className="transition hover:bg-gray-50/55 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">{item.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{item.phone}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{item.date}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{item.amount}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                        item.status === 'บริจาคแล้ว' || item.status === 'ตรวจสอบแล้ว'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center space-x-2">
                        <button type="button" title="ดูข้อมูล" onClick={() => window.alert(`ผู้บริจาค: ${item.name}\nเบอร์โทรศัพท์: ${item.phone}\nสถานะ: ${item.status}`)} className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition">
                          <Eye size={16} />
                        </button>
                        <Link href={`/donors/${item.id}/edit`} title="แก้ไข" className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                          <Edit size={16} />
                        </Link>
                        <button type="button" title="ลบ" onClick={() => deleteDonor(item.id, item.name)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 p-6 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center space-x-2">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button key={page} type="button" onClick={() => setCurrentPage(page)} className={`flex h-8 w-8 items-center justify-center rounded-lg font-medium ${currentPage === page ? 'bg-slate-900 text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                  {page}
                </button>
              ))}
              <button type="button" disabled={currentPage === pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <ChevronRight size={16} />
              </button>
            </div>
            <span>แสดง {filteredDonors.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredDonors.length)} จาก {filteredDonors.length} รายการ</span>
          </div>

        </div>

      </main>
    </div>
  );
}