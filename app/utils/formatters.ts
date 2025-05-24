export function formatCurrency(amount: number, currency: "ARS" | "USD"): string {
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return formatter.format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-AR").format(num)
}

export function parseArsAmount(amount: string): number {
  // Parse ARS amounts that might come as strings
  return Number.parseFloat(amount.replace(",", "."))
}

export function parsePeugeotDate(dateStr: string): string {
  // Convert "12-MAY-25" to "12/05/2025"
  const months: { [key: string]: string } = {
    JAN: "01",
    FEB: "02",
    MAR: "03",
    APR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AUG: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DEC: "12",
  }

  const [day, monthAbbr, year] = dateStr.split("-")
  const month = months[monthAbbr]
  const fullYear = `20${year}`

  return `${day}/${month}/${fullYear}`
}

export function parseNissanDate(dateStr: string): string {
  // Convert "2025-05-09T00:00:00" to "09/05/2025"
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}
