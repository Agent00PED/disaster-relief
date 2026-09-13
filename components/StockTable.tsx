'use client';

import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  Printer,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Droplets,
  Wheat,
  Pill,
  Shirt,
  Utensils,
  Cookie,
  Activity,
} from 'lucide-react';
import { DonationRecord, ItemType, DonationStatus } from '@/types/donation';

export interface FilterProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onReset: () => void;
}

export function DonationFilterBar({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onReset,
}: FilterProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4">
          <label className="block text-[11px] text-slate-400 mb-1">ค้นหา</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสิ่งของ, ผู้บริจาค..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] text-slate-400 mb-1">ประเภทสิ่งของ</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="น้ำดื่ม">น้ำดื่ม</option>
            <option value="อาหาร">อาหาร</option>
            <option value="ยารักษาโรค">ยารักษาโรค</option>
            <option value="เครื่องนุ่งห่ม">เครื่องนุ่งห่ม</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] text-slate-400 mb-1">สถานะ</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="รับเข้าคลัง">รับเข้าคลัง</option>
            <option value="ปกติ">ปกติ</option>
            <option value="ใกล้หมดอายุ">ใกล้หมดอายุ</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-[11px] text-slate-400 mb-1">ช่วงวันที่รับของ</label>
          <div className="flex items-center space-x-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-[11px] text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-[11px] text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="md:col-span-1">
          <button
            type="button"
            onClick={onReset}
            className="w-full py-1.5 bg-[#0f1d3a] hover:bg-slate-800 text-white rounded-xl text-xs flex items-center justify-center space-x-1 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            <span>รีเซ็ต</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface TableProps {
  records: DonationRecord[];
  totalItems: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: (v: number) => void;
}

export default function StockTable({
  records,
  totalItems,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
}: TableProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const toggleSelectAll = () => {
    if (selectedRows.length === records.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(records.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'water':
        return <Droplets className="w-3.5 h-3.5 text-sky-500" />;
      case 'rice':
        return <Wheat className="w-3.5 h-3.5 text-amber-500" />;
      case 'medicine':
        return <Pill className="w-3.5 h-3.5 text-rose-500" />;
      case 'clothes':
        return <Shirt className="w-3.5 h-3.5 text-purple-500" />;
      case 'canned':
        return <Utensils className="w-3.5 h-3.5 text-orange-500" />;
      case 'snack':
        return <Cookie className="w-3.5 h-3.5 text-yellow-600" />;
      case 'medical':
        return <Activity className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const getStatusBadge = (status: DonationStatus) => {
    switch (status) {
      case 'รับเข้าคลัง':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-600 font-medium border border-emerald-100">
            รับเข้าคลัง
          </span>
        );
      case 'ปกติ':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-sky-50 text-sky-600 font-medium border border-sky-100">
            ปกติ
          </span>
        );
      case 'ใกล้หมดอายุ':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-600 font-medium border border-amber-100">
            ใกล้หมดอายุ
          </span>
        );
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    let startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, startPage + 2);

    if (endPage - startPage < 2) {
      startPage = Math.max(1, endPage - 2);
    }

    for (let p = startPage; p <= endPage; p++) {
      if (p < 1) continue;
      buttons.push(
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
            currentPage === p
              ? 'bg-[#0f1d3a] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {p}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold text-slate-700">
          ทั้งหมด <span className="text-slate-900 font-bold">{totalItems}</span> รายการ
        </div>
        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center space-x-1.5 hover:bg-slate-50 transition-colors shadow-sm">
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>พิมพ์รายงาน</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-normal">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={records.length > 0 && selectedRows.length === records.length}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">ลำดับ</th>
                <th className="py-3 px-3">วันที่รับของ</th>
                <th className="py-3 px-3">ชื่อผู้บริจาค</th>
                <th className="py-3 px-3">รายการของ</th>
                <th className="py-3 px-3">จำนวน</th>
                <th className="py-3 px-3">หน่วย</th>
                <th className="py-3 px-3">วันหมดอายุ</th>
                <th className="py-3 px-3">สถานะ</th>
                <th className="py-3 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(record.id)}
                      onChange={() => toggleSelectRow(record.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">{record.id}</td>
                  <td className="py-3.5 px-3 text-slate-500">{record.date}</td>
                  <td className="py-3.5 px-3 font-medium text-slate-700">{record.donorName}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="p-1 rounded bg-slate-100/80 border border-slate-200/50">
                        {getItemIcon(record.itemType)}
                      </span>
                      <span className="text-slate-700">{record.itemName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">{record.amount}</td>
                  <td className="py-3.5 px-3 text-slate-500">{record.unit}</td>
                  <td className="py-3.5 px-3 text-slate-500">{record.expireDate}</td>
                  <td className="py-3.5 px-3">{getStatusBadge(record.status)}</td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <button className="flex items-center space-x-0.5 text-sky-600 hover:text-sky-800 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="text-[11px]">แก้ไข</span>
                      </button>
                      <button className="flex items-center space-x-0.5 text-rose-500 hover:text-rose-700 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">ลบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value={10}>แสดง 10 รายการต่อหน้า</option>
              <option value={20}>แสดง 20 รายการต่อหน้า</option>
              <option value={50}>แสดง 50 รายการต่อหน้า</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {renderPaginationButtons()}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}