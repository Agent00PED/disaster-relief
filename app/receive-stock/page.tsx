'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import DonorForm from '@/components/DonorForm';

export default function ReceiveStockPage() {
  return (
    <div className="min-h-screen bg-[#f4f0e8] font-sans pb-12">
      {/* Navbar พร้อมส่ง props activeMenu="รับของเข้าคลัง" เพื่อแสดงเส้นใต้สีแดง */}
      <Navbar activeMenu="รับของเข้าคลัง" />
      
      <main className="p-4 md:p-6">
        <DonorForm />
      </main>
    </div>
  );
}