export interface PlanData {
  modelName: string
  paidInstallments: number
  totalInstallments: number
  remainingInstallments: number
  currentInstallmentARS: number
  currentInstallmentUSD: number
  totalPaidARS: number
  totalPaidUSD: number
}

export interface PeugeotLoginResponse {
  status: string
  statusReason: string | null
  token: string
}

export interface PeugeotApiData {
  estadoContrato: string
  mesCuota: string | null
  cuota: number
  vencimiento: string
  importe: string
  estadoCuota: string | null
  historialCuotas: Array<{
    nro: number
    fechaVencimiento: string
    importeOriginal: string
    importeActualizado: string | null
    fechaPago: string
    estado: string
  }>
  cuotasItemsAPagar: Array<{
    codigo: string | null
    concepto: string
    monto: number
  }>
  proximoVencimientoCuota: string | null
}

export interface NissanApiData {
  movements: Array<{
    installmentNumber: string
    paidDate: string
    motionDescription: string
    totalValue: number
  }>
  summary: {
    goodName: string
    salesPlanName: string
    paidValues: number
  }
}

export interface DollarRate {
  date: string
  buyRate: number
  sellRate: number
}

export interface InstallmentDetail {
  installmentNumber: number
  paymentDate: string // Format: "dd/MM/yyyy"
  amountARS: number
  amountUSD: number
  exchangeRate: number
}

export interface NissanAccessResponse {
  tid: string
  accessCode: string
}

export interface NissanLoginResponse {
  uidPerson: string
  uidQuota: string
  token: string
  personName: string
  personType: string
  personEmail: string
  temporaryKey: string | null
  temporaryPassword: string | null
  firstAccess: string | null
  eHash: string
  ynInitialTerms: string
  initialTerms: string | null
  initialAceptDate: string | null
  ynInitialAceptTerms: string | null
}

export interface NissanStatementItem {
  installmentNumber: string
  dueDate: string
  paidDate: string
  launchedValue: number
  motionCode: number
  motionDescription: string
  commonFund: number
  administrativeTax: number
  reserveFund: number
  finesInterest: number
  insurance: number
  taxAmount: number
  adhesionValue: number
  percentCommonFund: number
  percentAdministrativeTax: number
  percentReserveFund: number
  percentFinesInterest: number
  percentInsurance: number
  percentTaxAmount: number
  percentAdhesionValue: number
  percentTotalValue: number
  goodValue: number
  vlDifference: number
  totalValue: number
  finalTotalValue: number
  groupMovimentId: number
}
