import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from './print-button'

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: donation } = await supabase
    .from('donations')
    .select(
      'item_name, category, unit, quantity_received, expiry_date, received_at, donors(name, phone), centers(name), profiles(full_name)',
    )
    .eq('id', id)
    .single()

  if (!donation) notFound()

  const donor = donation.donors as unknown as { name?: string; phone?: string } | null
  const center = donation.centers as unknown as { name?: string } | null
  const receiver = donation.profiles as unknown as { full_name?: string } | null

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12 print:py-0">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">ใบรับของบริจาค</h1>
        <p className="mb-6 text-sm text-slate-500">{center?.name ?? '—'}</p>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">ผู้บริจาค</dt>
            <dd className="text-slate-900">{donor?.name ?? 'ไม่ประสงค์ออกนาม'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">รายการ</dt>
            <dd className="text-slate-900">{donation.item_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">จำนวน</dt>
            <dd className="text-slate-900">
              {donation.quantity_received} {donation.unit}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">วันหมดอายุ</dt>
            <dd className="text-slate-900">{donation.expiry_date ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">วันที่รับ</dt>
            <dd className="text-slate-900">
              {new Date(donation.received_at).toLocaleDateString('th-TH')}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">เจ้าหน้าที่ผู้รับ</dt>
            <dd className="text-slate-900">{receiver?.full_name || '—'}</dd>
          </div>
        </dl>

        <p className="mt-8 text-center text-xs text-slate-400">ขอบคุณสำหรับความช่วยเหลือ</p>
      </div>

      <PrintButton />
    </main>
  )
}
