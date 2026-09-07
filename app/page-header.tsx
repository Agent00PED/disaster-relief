// หัวข้อหน้าแบบไอคอนในกล่องสี + ชื่อ + คำอธิบาย — ตามสไตล์ที่ชมพู่ (F2) ทำ
// mockup ไว้ ใช้ร่วมกันได้ทุกหน้าเพื่อให้ theme ไปทางเดียวกัน
export function PageHeader({
  icon,
  title,
  subtitle,
  color = 'rose',
  action,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  color?: 'rose' | 'blue' | 'amber' | 'emerald'
  action?: React.ReactNode
}) {
  const colorClass = {
    rose: 'bg-rose-50 text-rose-500',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }[color]

  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {action}
    </header>
  )
}
