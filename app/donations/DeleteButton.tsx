'use client'

// ปุ่มลบรายการบริจาค ถามยืนยันก่อนส่งฟอร์ม
// เดิมกดแล้วลบทันทีโดยไม่ถาม ถ้ากดพลาดจะย้อนกลับไม่ได้
export default function DeleteButton({
  label,
  confirmText,
}: {
  label: string
  confirmText: string
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault()
      }}
      className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
    >
      {label}
    </button>
  )
}
