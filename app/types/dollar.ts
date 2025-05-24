export interface DollarRate {
  date: string
  buyRate: number
  sellRate: number
}

export interface DollarApiResponse {
  fecha: string
  compra: string
  venta: string
}

export interface DollarStorage {
  rates: DollarRate[]
  lastUpdate: string
} 