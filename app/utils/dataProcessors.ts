import type { PeugeotApiData, NissanApiData, DollarRate, PlanData, InstallmentDetail } from "../types/plan"
import { parsePeugeotDate, parseNissanDate, parseArsAmount } from "./formatters"

export function processPeugeotData(data: PeugeotApiData, dollarRates: DollarRate[]): PlanData {
  // Extraer el número total de cuotas del historial
  const totalInstallments = Math.max(...data.historialCuotas.map(cuota => cuota.nro))

  // Contar cuotas pagadas
  const paidInstallments = data.historialCuotas.filter((cuota) => cuota.estado === "P" && cuota.importeOriginal !== "0").length

  // Calcular cuotas restantes
  const remainingInstallments = totalInstallments - paidInstallments

  // Cuota actual en ARS
  const currentInstallmentARS = parseArsAmount(data.importe)

  // Obtener tasa de USD actual (usar la más reciente)
  const currentUsdRate = dollarRates[0]?.sellRate || 1165
  const currentInstallmentUSD = currentInstallmentARS / currentUsdRate

  // Calcular total pagado en ARS
  const totalPaidARS = data.historialCuotas
    .filter((cuota) => cuota.estado === "P")
    .reduce((sum, cuota) => sum + parseArsAmount(cuota.importeOriginal), 0)

  // Calcular total pagado en USD (conversión histórica)
  const totalPaidUSD = data.historialCuotas
    .filter((cuota) => cuota.estado === "P")
    .reduce((sum, cuota) => {
      const paymentDate = parsePeugeotDate(cuota.fechaPago)
      const historicalRate = findHistoricalRate(dollarRates, paymentDate)
      const arsAmount = parseArsAmount(cuota.importeOriginal)
      return sum + arsAmount / historicalRate
    }, 0)

  // Obtener el nombre del modelo del estado del contrato
  const modelName = data.estadoContrato.includes("Deudor Prendario") 
    ? "Peugeot Plan" 
    : data.estadoContrato

  return {
    modelName,
    paidInstallments,
    totalInstallments,
    remainingInstallments,
    currentInstallmentARS,
    currentInstallmentUSD,
    totalPaidARS,
    totalPaidUSD,
  }
}

export function processNissanData(data: NissanApiData, dollarRates: DollarRate[]): PlanData {
  // Extract total installments from sales plan name
  const totalInstallments =  120

  // Filter and count paid installments
  const paidInstallmentMovements = data.movements;
  const paidInstallments = paidInstallmentMovements.length

  // Calculate remaining installments
  const remainingInstallments = totalInstallments - paidInstallments

  // Current installment (most recent payment)
  const currentInstallmentARS = paidInstallmentMovements[0]?.totalValue || 0

  // Get current USD rate
  const currentUsdRate = dollarRates[0]?.sellRate || 1165
  const currentInstallmentUSD = currentInstallmentARS / currentUsdRate

  // Total paid in ARS (from summary)
  const totalPaidARS = data.summary.paidValues

  // Calculate total paid in USD (historical conversion)
  const totalPaidUSD = paidInstallmentMovements.reduce((sum, movement) => {
    const paymentDate = parseNissanDate(movement.paidDate)
    const historicalRate = findHistoricalRate(dollarRates, paymentDate)
    return sum + movement.totalValue / historicalRate
  }, 0)

  return {
    modelName: `Nissan ${data.summary.goodName}`,
    paidInstallments,
    totalInstallments,
    remainingInstallments,
    currentInstallmentARS,
    currentInstallmentUSD,
    totalPaidARS,
    totalPaidUSD,
  }
}

function extractNumberFromString(text: string): number | null {
  const match = text.match(/\d+/)
  return match ? Number.parseInt(match[0], 10) : null
}

function findHistoricalRate(dollarRates: DollarRate[], targetDate: string): number {
  // Find the rate for the specific date, or use the closest available rate
  const exactMatch = dollarRates.find((rate) => rate.date === targetDate)
  if (exactMatch) return exactMatch.sellRate

  // If no exact match, use the most recent rate as fallback
  return dollarRates[0]?.sellRate || 1165
}

export function processPeugeotInstallments(data: PeugeotApiData, dollarRates: DollarRate[]): InstallmentDetail[] {
  return data.historialCuotas
    .filter((cuota) => cuota.estado === "P" && cuota.importeOriginal !== "0")
    .map((cuota) => {
      const paymentDate = parsePeugeotDate(cuota.fechaPago)
      const historicalRate = findHistoricalRate(dollarRates, paymentDate)
      const amountARS = parseArsAmount(cuota.importeOriginal)
      const amountUSD = amountARS / historicalRate

      return {
        installmentNumber: cuota.nro,
        paymentDate,
        amountARS,
        amountUSD,
        exchangeRate: historicalRate,
      }
    })
    .sort((a, b) => b.installmentNumber - a.installmentNumber)
}

export function processNissanInstallments(data: NissanApiData, dollarRates: DollarRate[]): InstallmentDetail[] {
  const paidInstallmentMovements = data.movements;

  return paidInstallmentMovements
    .map((movement) => {
      const paymentDate = parseNissanDate(movement.paidDate)
      const historicalRate = findHistoricalRate(dollarRates, paymentDate)
      const amountARS = movement.totalValue
      const amountUSD = amountARS / historicalRate

      return {
        installmentNumber: Number.parseInt(movement.installmentNumber, 10),
        paymentDate,
        amountARS,
        amountUSD,
        exchangeRate: historicalRate,
      }
    })
    .sort((a, b) => b.installmentNumber - a.installmentNumber)
}
