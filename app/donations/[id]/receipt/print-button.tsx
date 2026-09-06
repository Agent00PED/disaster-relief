'use client'

// ปุ่มพิมพ์ต้องแยกเป็น client component เพราะใช้ window.print() ซึ่งต้องมี onClick
// ส่วนหน้าเอกสารทั้งหมดยังเป็น Server Component ได้ตามปกติ
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-4 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 print:hidden"
    >
      พิมพ์ใบรับ
    </button>
  )
}
