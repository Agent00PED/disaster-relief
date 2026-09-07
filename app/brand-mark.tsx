// โลโก้ WalaiTrack — หัวใจสองสี (กรมท่า+แดง) ตามที่ทีมออกแบบไว้ ใช้ร่วมกัน
// ทุกหน้าสาธารณะ (Entry Hub, login, register) และแถบเมนูตอน login แล้ว
//
// onDark: ใช้ตอนพื้นหลังเป็นกรมท่าเข้ม (เช่น nav bar) — ครึ่ง "Walai" ที่
// ปกติเป็นกรมท่าจะกลืนกับพื้น เลยสลับเป็นสีขาวแทน ครึ่งแดงยังคงเดิม
export function BrandMark({
  size = 'md',
  onDark = false,
}: {
  size?: 'sm' | 'md' | 'lg'
  onDark?: boolean
}) {
  const px = size === 'sm' ? 18 : size === 'lg' ? 30 : 24
  const textClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const walaiColor = onDark ? '#ffffff' : 'var(--color-brand)'

  return (
    <span className="inline-flex items-center gap-2" style={{ fontFamily: 'var(--font-brand)' }}>
      <svg width={px} height={px} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21s-7.5-4.6-10.2-9.3C.2 8.7 1.6 5 5.2 4.2 7.6 3.7 9.9 4.9 12 7.6V21z"
          fill={walaiColor}
        />
        <path
          d="M12 21s7.5-4.6 10.2-9.3C23.8 8.7 22.4 5 18.8 4.2 16.4 3.7 14.1 4.9 12 7.6V21z"
          fill="var(--color-brand-accent)"
        />
      </svg>
      <span className={`${textClass} font-semibold`}>
        <span style={{ color: walaiColor }}>Walai</span>
        <span style={{ color: 'var(--color-brand-accent)' }}>Track</span>
      </span>
    </span>
  )
}
