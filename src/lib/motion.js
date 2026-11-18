// Єдині налаштування руху. Жодна пружина не має перельоту: рух швидко стартує
// і мʼяко завмирає, нічого не підстрибує.

export const EASE_SPRING = [0.32, 0.72, 0, 1]

/** Шторки. damping вище критичного (2·√(stiffness·mass) ≈ 36.7) → без відскоку. */
export const SHEET_SPRING = { type: 'spring', stiffness: 420, damping: 42, mass: 0.8 }

/** Дрібні елементи: кнопка «Сьогодні», індикатор статусу. */
export const SOFT_SPRING = { type: 'spring', bounce: 0, duration: 0.5 }
