'use client';

import React, { useState } from 'react';
import { Package, User, Phone, Box, Plus, Trash2, Save, RotateCcw } from 'lucide-react';

interface FormItem {
  id: number;
  name: string;
  amount: string;
  unit: string;
  expireDate: string;
  note: string;
}

export default function DonorForm() {
  const [items, setItems] = useState<FormItem[]>([
    { id: 1, name: '', amount: '', unit: '', expireDate: '', note: '' },
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now(), name: '', amount: '', unit: '', expireDate: '', note: '' },
    ]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start space-x-3">
        <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800">บันทึกของบริจาคเข้าคลัง</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            กรอกข้อมูลเมื่อของบริจาคที่ได้รับ เพื่อบันทึกเข้าคลังสินค้า
          </p>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {/* Section 1: ข้อมูลผู้บริจาค */}
        <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center space-x-2 font-semibold text-slate-700 text-xs">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>ข้อมูลผู้บริจาค</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                ชื่อผู้บริจาค <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="เช่น มูลนิธิใจดี"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                เบอร์โทรศัพท์ <span className="text-slate-400 font-normal">(ถ้ามี)</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="เช่น 081-234-5678"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                วันที่รับของ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: รายการของที่รับเข้าคลัง */}
        <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center space-x-2 font-semibold text-slate-700 text-xs">
            <Box className="w-3.5 h-3.5 text-slate-500" />
            <span>รายการของที่รับเข้าคลัง</span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2.5 items-center text-xs">
                <div className="col-span-12 md:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    ชื่อของ <span className="text-rose-500">*</span>
                  </label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 focus:outline-none focus:border-blue-500">
                    <option value="">เลือกชื่อของ</option>
                    <option value="น้ำดื่ม">น้ำดื่ม</option>
                    <option value="ข้าวสาร">ข้าวสาร</option>
                    <option value="ยารักษาโรค">ยารักษาโรค</option>
                    <option value="เสื้อผ้า">เสื้อผ้า</option>
                  </select>
                </div>

                <div className="col-span-6 md:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    จำนวน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="เช่น 50"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-300"
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    หน่วย
                  </label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 focus:outline-none focus:border-blue-500">
                    <option value="">เลือกหน่วย</option>
                    <option value="กล่อง">กล่อง</option>
                    <option value="ถุง">ถุง</option>
                    <option value="ชิ้น">ชิ้น</option>
                    <option value="ขวด">ขวด</option>
                  </select>
                </div>

                <div className="col-span-6 md:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    วันหมดอายุ
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="col-span-5 md:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    หมายเหตุ
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น บริจาคจาก.."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-300"
                  />
                </div>

                <div className="col-span-1 md:col-span-1 flex justify-center pt-5">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3.5 py-1.5 border border-sky-200 bg-white hover:bg-sky-50 text-sky-600 rounded-xl text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มรายการ</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#1b2e4b] hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>บันทึกข้อมูล</span>
          </button>
          <button
            type="reset"
            className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium flex items-center space-x-2 shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างข้อมูล</span>
          </button>
        </div>
      </form>
    </div>
  );
}