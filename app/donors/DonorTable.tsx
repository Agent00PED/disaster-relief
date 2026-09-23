'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { PageHeader } from '@/app/page-header'
import { PROVINCES } from '@/lib/provinces'

type Donor = {
  id: string
  name: string
  donor_type: 'individual' | 'organization'
  phone: string | null
  address?: string | null
  is_anonymous: boolean
  is_active: boolean
}

type Props = {
  donors: Donor[]
  dict: Dictionary
}

const PAGE_SIZE = 10

export default function DonorTable({ donors, dict }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [page, setPage] = useState(1)

  const filteredDonors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return donors.filter((donor) => {
      const matchesName = donor.name.toLowerCase().includes(normalizedSearch)
      const matchesStatus =
        status === 'all' ||
        (status === 'active' ? donor.is_active : !donor.is_active)
      
      // ที่อยู่ถูกเก็บเป็น "<ตำบล> <จังหวัด>" (ดู app/donors/actions.ts)
      // จึงเทียบที่ท้ายข้อความ ไม่ใช่ includes
      //
      // มีตำบล 17 ชื่อที่ซ้ำกับชื่อจังหวัด เช่น ต.ขอนแก่น อยู่ใน จ.ร้อยเอ็ด
      // ถ้าใช้ includes คนในร้อยเอ็ดจะโผล่มาตอนกรองขอนแก่น
      const matchesProvince =
        selectedProvince === 'all' ||
        (donor.address ? donor.address.trim().endsWith(selectedProvince) : false)

      return matchesName && matchesStatus && matchesProvince
    })
  }, [donors, searchTerm, status, selectedProvince])

  const pageCount = Math.max(1, Math.ceil(filteredDonors.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleDonors = filteredDonors.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleSearchClick = () => {
    setSearchTerm(searchInput)
    setPage(1)
  }

  const handleClear = () => {
    setSearchInput('')
    setSearchTerm('')
    setSelectedProvince('all')
    setStatus('all')
    setPage(1)
  }

  return (
    <section className="space-y-4">
      <PageHeader
        color="rose"
        title={dict.donors?.searchTitle ?? 'ค้นหาผู้บริจาค'}
        subtitle={dict.donors?.searchSubtitle ?? 'จัดการรายชื่อผู้บริจาค'}
        action={
          <Link
            href="/donors/new"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
          >
            {dict.donors?.addNew ?? 'เพิ่มผู้บริจาค'}
          </Link>
        }
        icon={
          <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19c.5-3 2.3-5 5.5-5s5 2 5.5 5" />
            <path d="M17 8v6M14 11h6" />
          </svg>
        }
      />
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            <label htmlFor="donor-search">{dict.donors?.searchByName ?? 'ค้นหาตามชื่อ'}</label>
            <div className="mt-1 flex gap-2">
              <input
                id="donor-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchClick()
                  }
                }}
                placeholder={dict.donors?.searchPlaceholder ?? 'ค้นหาตามชื่อ...'}
                className="block min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSearchClick}
                className="rounded-md bg-brand px-4 py-2 font-normal text-white hover:bg-brand-deep"
              >
                {dict.common?.search ?? 'ค้นหา'}
              </button>
            </div>
          </div>

          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
            <label>
              {dict.donors?.provinceArea ?? 'จังหวัด / พื้นที่'}
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value)
                  setPage(1)
                }}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:w-44"
              >
                <option value="all">{dict.donors?.allProvinces ?? 'ทุกจังหวัด'}</option>
                {PROVINCES.map((prov: string) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
            <label>
              {dict.common?.status ?? 'สถานะ'}
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as 'all' | 'active' | 'inactive')
                  setPage(1)
                }}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:w-44"
              >
                <option value="all">{dict.donors?.allStatuses ?? 'ทุกสถานะ'}</option>
                <option value="active">{dict.donors?.active ?? 'ใช้งาน'}</option>
                <option value="inactive">{dict.donors?.inactive ?? 'ไม่ใช้งาน'}</option>
              </select>
            </label>
          </div>
        </div>

        {(searchTerm || selectedProvince !== 'all' || status !== 'all') && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">{dict.donors?.sequence ?? 'ลำดับ'}</th>
              <th className="px-4 py-3">{dict.donors?.name ?? 'ชื่อ'}</th>
              <th className="px-4 py-3">{dict.form?.phone ?? 'เบอร์โทรศัพท์'}</th>
              <th className="px-4 py-3">{dict.donors?.provinceArea ?? 'จังหวัด / พื้นที่'}</th>
              <th className="px-4 py-3">{dict.common?.status ?? 'สถานะ'}</th>
              <th className="px-4 py-3 text-right">{dict.common?.actions ?? 'จัดการ'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleDonors.map((donor, index) => (
              <tr key={donor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {(currentPage - 1) * PAGE_SIZE + index + 1}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  {donor.is_anonymous ? 'ไม่ประสงค์ออกนาม' : donor.name}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {donor.is_anonymous ? '-' : donor.phone ?? '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {donor.is_anonymous ? '-' : donor.address ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={donor.is_active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                    {donor.is_active ? (dict.donors?.active ?? 'ใช้งาน') : (dict.donors?.inactive ?? 'ไม่ใช้งาน')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/donors/${donor.id}/edit`} className="font-medium text-brand hover:underline">
                    {dict.common?.edit ?? 'แก้ไข'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleDonors.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {dict.donors?.notFound ?? 'ไม่พบข้อมูลผู้บริจาค'}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((v) => Math.max(1, v - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-slate-300 px-3 py-1.5 dark:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {dict.donors?.previousPage ?? 'ก่อนหน้า'}
          </button>
          <span>{currentPage} / {pageCount}</span>
          <button
            type="button"
            onClick={() => setPage((v) => Math.min(pageCount, v + 1))}
            disabled={currentPage === pageCount}
            className="rounded-md border border-slate-300 px-3 py-1.5 dark:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {dict.donors?.nextPage ?? 'ถัดไป'}
          </button>
        </div>
      </div>
    </section>
  )
}