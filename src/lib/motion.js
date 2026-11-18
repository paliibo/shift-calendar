// Єдині налаштування руху. Жодна пружина не має перельоту: рух швидко стартує
// і мʼяко завмирає, нічого не підстрибує.

export const EASE_SPRING = [0.32, 0.72, 0, 1]

/** Поява шторки: мʼякша й трохи довша. damping вище критичного (2·√(260·0.8) ≈ 28.8) → без відскоку. */
export const SHEET_OPEN = { type: 'spring', stiffness: 260, damping: 34, mass: 0.8 }

/** Зникнення й повернення на місце після недосвайпу: швидше, бо людина вже вирішила. */
export const SHEET_SPRING = { type: 'spring', stiffness: 420, damping: 42, mass: 0.8 }

/** Дрібні елементи: кнопка «Сьогодні», індикатор статусу. */
export const SOFT_SPRING = { type: 'spring', bounce: 0, duration: 0.5 }
