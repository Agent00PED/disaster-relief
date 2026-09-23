export function birthDateBounds(now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
  return { min: `${Number(today.slice(0, 4)) - 120}-01-01`, max: today }
}

export function isValidBirthDate(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  const { min, max } = birthDateBounds(now)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    && value >= min && value <= max
}
