'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ChevronDown } from 'lucide-react';

interface NavbarProps {
  activeMenu?: string;
}

export default function Navbar({ activeMenu = 'รับของเข้าคลัง' }: NavbarProps) {
  const menuItems = [
    { name: 'หน้าหลัก', href: '/' },
    { name: 'รับของเข้าคลัง', href: '/receive-stock' },
    { name: 'คลังสินค้า', href: '/inventory' },
    { name: 'คำขอ', href: '/requests' },
    { name: 'จัดสรร', href: '/allocation' },
    { name: 'ผู้บริจาค', href: '/donors' },
  ];

  return (
    <nav className="bg-[#1b2e4b] text-white text-xs px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-1.5 font-bold text-base tracking-wide">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>
            Walai<span className="text-rose-500">Track</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-5 text-slate-300 font-light">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.name;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`py-1 transition-colors ${
                  isActive
                    ? 'text-white font-medium border-b-2 border-rose-500 pb-0.5'
                    : 'hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          {/* Dropdown Menu */}
          <div className="flex items-center space-x-1 hover:text-white cursor-pointer transition-colors py-1">
            <span>คำร้องสาธารณะ</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* User Profile Circle */}
      <div className="flex items-center">
        <div className="w-7 h-7 rounded-full bg-white text-[#1b2e4b] font-semibold flex items-center justify-center text-xs shadow-sm">
          A
        </div>
      </div>
    </nav>
  );
}