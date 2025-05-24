import type { DollarRate, DollarStorage } from "../types/dollar"

const DOLLAR_STORAGE_KEY = "dollar_rates"
const INITIAL_DATE = "2022-05-30"

export class DollarService {
  private static instance: DollarService
  private rates: DollarRate[] = []
  private lastUpdate: string | null = null

  private constructor() {
    this.loadFromStorage()
  }

  public static getInstance(): DollarService {
    if (!DollarService.instance) {
      DollarService.instance = new DollarService()
    }
    return DollarService.instance
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return

    const storedData = localStorage.getItem(DOLLAR_STORAGE_KEY)
    if (storedData) {
      const data: DollarStorage = JSON.parse(storedData)
      this.rates = data.rates
      this.lastUpdate = data.lastUpdate
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return

    const data: DollarStorage = {
      rates: this.rates,
      lastUpdate: this.lastUpdate || new Date().toISOString().split("T")[0]
    }
    localStorage.setItem(DOLLAR_STORAGE_KEY, JSON.stringify(data))
  }

  private needsUpdate(): boolean {
    if (!this.lastUpdate) return true

    const today = new Date().toISOString().split("T")[0]
    return this.lastUpdate !== today
  }

  private async fetchRatesFromApi(): Promise<DollarRate[]> {
    const endDate = new Date().toISOString().split("T")[0]
    
    const response = await fetch(
      `https://mercados.ambito.com/dolar/informal/historico-general/${INITIAL_DATE}/${endDate}`,
      {
        method: "GET",
        redirect: "follow"
      }
    )

    if (!response.ok) {
      throw new Error("Error al obtener las cotizaciones del dólar")
    }

    const data = await response.json()
    
    return data
      .slice(1) // Ignorar el encabezado
      .map((row: string[]) => ({
        date: row[0],
        buyRate: parseFloat(row[1].replace(",", ".")),
        sellRate: parseFloat(row[2].replace(",", "."))
      }))
      .filter((rate: DollarRate) => !isNaN(rate.buyRate) && !isNaN(rate.sellRate))
      .sort((a: DollarRate, b: DollarRate) => 
        new Date(b.date.split("/").reverse().join("-")).getTime() - 
        new Date(a.date.split("/").reverse().join("-")).getTime()
      )
  }

  public async getRates(): Promise<DollarRate[]> {
    if (!this.needsUpdate() && this.rates.length > 0) {
      return this.rates
    }

    try {
      this.rates = await this.fetchRatesFromApi()
      this.lastUpdate = new Date().toISOString().split("T")[0]
      this.saveToStorage()
      return this.rates
    } catch (error) {
      console.error("Error al obtener las cotizaciones del dólar:", error)
      
      // Si hay un error y tenemos datos almacenados, devolver los datos almacenados
      if (this.rates.length > 0) {
        return this.rates
      }
      
      // Si no hay datos almacenados, devolver un array vacío
      return []
    }
  }

  public getRateForDate(date: string): DollarRate | null {
    if (this.rates.length === 0) return null

    // Convertir la fecha al formato DD/MM/YYYY
    const formattedDate = new Date(date)
      .toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
      .replace(/\//g, "/")

    // Buscar la cotización exacta
    const exactMatch = this.rates.find(rate => rate.date === formattedDate)
    if (exactMatch) return exactMatch

    // Si no hay coincidencia exacta, buscar la cotización más cercana anterior
    const targetDate = new Date(date)
    return this.rates.find(rate => {
      const rateDate = new Date(rate.date.split("/").reverse().join("-"))
      return rateDate <= targetDate
    }) || null
  }
}

// Exportar una instancia singleton del servicio
export const dollarService = DollarService.getInstance() 