// Shared helpers for comma-formatted amount inputs (wallet top-up/withdrawal, etc).
// Underlying state always stays a plain numeric string (e.g. "150000" or "150000.5") so
// existing parseFloat()/validation logic elsewhere never needs to change — only the
// on-screen display of the <input> is formatted, via a text input rather than type="number"
// (browsers reject comma characters in a native number input's value).

/** "150000.5" -> "150,000.5". Keeps at most one decimal point, digits only otherwise. */
export const formatWithCommas = (value) => {
  if (value === null || value === undefined || value === "") return ""
  const stringValue = String(value)
  const [wholePart, ...decimalParts] = stringValue.replace(/[^\d.]/g, "").split(".")
  const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  if (decimalParts.length === 0) return formattedWhole
  return `${formattedWhole}.${decimalParts.join("").slice(0, 2)}`
}

/** "150,000.5" -> "150000.5". Safe to call on an already-plain value. */
export const parseFormattedNumber = (value) => {
  if (value === null || value === undefined) return ""
  return String(value).replace(/,/g, "").replace(/[^\d.]/g, "")
}
