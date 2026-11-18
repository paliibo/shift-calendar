// Дати й логіка графіка — без React, щоб це можна було перевіряти окремо.

export const STORAGE_KEY = 'shift-calendar:v1'
export const MONTHS_AHEAD = 12

export const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень']
export const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']
export const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд']
export const WEEKDAYS_FULL = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота', 'Неділя']

const DAY_MS = 86_400_000

// День як ціле число (кількість діб від епохи) — жодних сюрпризів із переведенням годинника.
export const dayNumber = (year, month, day) => Math.floor(Date.UTC(year, month, day) / DAY_MS)
export const fromDay = (n) => {
  const date = new Date(n * DAY_MS)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate(), weekday: (date.getUTCDay() + 6) % 7 }
}
export const todayNumber = () => {
  const now = new Date()
  return dayNumber(now.getFullYear(), now.getMonth(), now.getDate())
}
export const toISO = (n) => new Date(n * DAY_MS).toISOString().slice(0, 10)
export const fromISO = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return dayNumber(year, month - 1, day)
}

export const formatShort = (n) => {
  const d = fromDay(n)
  return `${WEEKDAYS[d.weekday]}, ${d.day} ${MONTHS_GEN[d.month]}`
}
export const formatLong = (n) => {
  const d = fromDay(n)
  return `${WEEKDAYS_FULL[d.weekday]}, ${d.day} ${MONTHS_GEN[d.month]}`
}
export const plural = (n, one, few, many) => {
  const a = n % 10
  const b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}

// ── стан ──
const DEFAULTS = { anchor: null, work: 2, off: 2, overrides: {} }
const KEEP_OVERRIDES_DAYS = 62

/** Прибирає давні ручні зміни; повертає той самий обʼєкт, якщо прибирати нічого. */
export function pruneOverrides(overrides, today) {
  const entries = Object.entries(overrides)
  const fresh = entries.filter(([day]) => +day >= today - KEEP_OVERRIDES_DAYS)
  return fresh.length === entries.length ? overrides : Object.fromEntries(fresh)
}

export function loadSchedule() {
  let saved = null
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    // сховище недоступне або зіпсоване — починаємо з чистого графіка
  }
  const schedule = { ...DEFAULTS, ...saved }
  return { ...schedule, overrides: pruneOverrides(schedule.overrides || {}, todayNumber()) }
}

export function saveSchedule(schedule) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule))
  } catch {
    // приватний режим тощо — графік просто не збережеться
  }
}

export const clampRun = (n) => Math.min(14, Math.max(1, n))

/** Робочий день за самим ритмом, без ручних змін. `null`, поки графік не налаштовано. */
export function isBaseWork(schedule, n) {
  if (schedule.anchor == null) return null
  const cycle = schedule.work + schedule.off
  return (((n - schedule.anchor) % cycle) + cycle) % cycle < schedule.work
}

export function isWorkDay(schedule, n) {
  const override = schedule.overrides[n]
  return override != null ? override === 1 : isBaseWork(schedule, n)
}

export function describeToday(schedule, today) {
  if (schedule.anchor == null) {
    return { title: 'Налаштуй графік', sub: 'Тапни на перший день своєї зміни', work: false }
  }
  const work = isWorkDay(schedule, today)
  let n = 1
  while (n < 90 && isWorkDay(schedule, today + n) === work) n++
  let sub = ''
  if (n === 1) sub = work ? 'Завтра вихідний' : 'Завтра на роботу'
  else if (n < 90) sub = work ? `Вихідні з ${formatShort(today + n)}` : `На роботу: ${formatShort(today + n)}`
  return { title: work ? 'Сьогодні робочий' : 'Сьогодні вихідний', sub, work }
}

/** Місяці для показу: `back` минулих і MONTHS_AHEAD від поточного. */
export function buildMonths(today, back) {
  const now = fromDay(today)
  return Array.from({ length: back + MONTHS_AHEAD }, (_, i) => {
    const idx = i - back
    const total = now.month + idx
    const year = now.year + Math.floor(total / 12)
    const month = ((total % 12) + 12) % 12
    const first = dayNumber(year, month, 1)
    return {
      key: `${year}-${month}`,
      idx,
      year,
      month,
      first,
      offset: fromDay(first).weekday,
      count: new Date(year, month + 1, 0).getDate(),
    }
  })
}
