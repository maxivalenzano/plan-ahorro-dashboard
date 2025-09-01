"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Car, DollarSign, Calendar, TrendingUp, Eye } from "lucide-react"
import type { PlanData } from "../types/plan"
import { formatCurrency, formatNumber } from "../utils/formatters"

interface PlanCardProps {
  title: string
  brand: "peugeot" | "nissan"
  planData: PlanData | null
  isLoading: boolean
  error?: string | null
  onViewDetails?: () => void
}

export function PlanCard({ title, brand, planData, isLoading, error, onViewDetails }: PlanCardProps) {
  const brandColors = {
    peugeot: "from-blue-500 to-blue-600",
    nissan: "from-red-500 to-red-600",
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Mostrar error si existe, pero aún mostrar datos si están disponibles
  const hasError = !!error;
  
  if (!planData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasError ? (
            <div className="space-y-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <p className="text-slate-500 text-sm">No hay datos almacenados disponibles</p>
            </div>
          ) : (
            <p className="text-slate-500">No se pudieron cargar los datos</p>
          )}
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = (planData.paidInstallments / planData.totalInstallments) * 100

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          {title}
        </CardTitle>
        
        {/* Mostrar error si existe */}
        {hasError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <p className="text-amber-800 text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">{planData.modelName}</p>
          <div className="flex items-center gap-2">
            <div className={`h-2 bg-gradient-to-r ${brandColors[brand]} rounded-full flex-1`}>
              <div
                className="h-full bg-white/30 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, 100 - progressPercentage)}%` }}
              />
            </div>
            <Badge variant="secondary" className="text-xs">
              {progressPercentage.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Installments Progress */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Cuotas Pagadas</p>
            <p className="text-lg font-bold text-green-600">{formatNumber(planData.paidInstallments)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Total Cuotas</p>
            <p className="text-lg font-bold text-slate-700">{formatNumber(planData.totalInstallments)}</p>
          </div>
        </div>

        {/* Remaining Installments */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">Cuotas Restantes</span>
          </div>
          <span className="font-semibold text-orange-600">{formatNumber(planData.remainingInstallments)}</span>
        </div>

        {/* Current Installment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Cuota Actual (ARS)</span>
            </div>
            <span className="font-semibold">{formatCurrency(planData.currentInstallmentARS, "ARS")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 ml-6">Cuota Actual (USD)</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(planData.currentInstallmentUSD, "USD")}
            </span>
          </div>
        </div>

        {/* Total Paid */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Total Pagado (ARS)</span>
            </div>
            <span className="font-semibold">{formatCurrency(planData.totalPaidARS, "ARS")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 ml-6">Total Pagado (USD)</span>
            <span className="font-semibold text-green-600">{formatCurrency(planData.totalPaidUSD, "USD")}</span>
          </div>
        </div>

        {/* View Details Button */}
        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={onViewDetails} disabled={!planData}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalle de Cuotas
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
