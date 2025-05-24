'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatNumber } from '../utils/formatters';
import type { InstallmentDetail } from '../types/plan';

interface InstallmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    installments: InstallmentDetail[];
    planTitle: string;
    modelName: string;
}

export function InstallmentDetailsModal({
    isOpen,
    onClose,
    installments,
    planTitle,
    modelName,
}: InstallmentDetailsModalProps) {
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const sortedInstallments = [...installments].sort((a, b) => {
        const dateA = new Date(a.paymentDate.split('/').reverse().join('-'));
        const dateB = new Date(b.paymentDate.split('/').reverse().join('-'));
        return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    const totalARS = installments.reduce((sum, inst) => sum + inst.amountARS, 0);
    const totalUSD = installments.reduce((sum, inst) => sum + inst.amountUSD, 0);

    const toggleSort = () => {
        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-w-4xl max-h-[80vh]'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <span>{planTitle} - Detalle de Cuotas</span>
                    </DialogTitle>
                    <DialogDescription>
                        {modelName} • {installments.length} cuotas pagadas
                    </DialogDescription>
                </DialogHeader>

                {/* Summary Cards */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                    <div className='bg-slate-50 p-4 rounded-lg'>
                        <p className='text-sm text-slate-600 mb-1'>Total Pagado (ARS)</p>
                        <p className='text-xl font-bold text-slate-800'>{formatCurrency(totalARS, 'ARS')}</p>
                    </div>
                    <div className='bg-green-50 p-4 rounded-lg'>
                        <p className='text-sm text-slate-600 mb-1'>Total Pagado (USD)</p>
                        <p className='text-xl font-bold text-green-700'>{formatCurrency(totalUSD, 'USD')}</p>
                    </div>
                </div>

                <ScrollArea className='h-[400px]'>
                    {/* Vista de tabla para desktop */}
                    <div className='hidden md:block'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='cursor-pointer hover:bg-slate-50' onClick={toggleSort}>
                                        <div className='flex items-center gap-1'>
                                            Cuota #
                                            <Badge variant='outline' className='text-xs'>
                                                {sortOrder === 'desc' ? '↓' : '↑'}
                                            </Badge>
                                        </div>
                                    </TableHead>
                                    <TableHead>Fecha de Pago</TableHead>
                                    <TableHead className='text-right'>Monto (ARS)</TableHead>
                                    <TableHead className='text-right'>Cotización USD</TableHead>
                                    <TableHead className='text-right'>Monto (USD)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedInstallments.map((installment, index) => (
                                    <TableRow
                                        key={`${installment.installmentNumber}-${index}`}
                                        className='hover:bg-slate-50'
                                    >
                                        <TableCell className='font-medium'>
                                            <Badge variant='secondary'>{formatNumber(installment.installmentNumber)}</Badge>
                                        </TableCell>
                                        <TableCell>{installment.paymentDate}</TableCell>
                                        <TableCell className='text-right font-mono'>
                                            {formatCurrency(installment.amountARS, 'ARS')}
                                        </TableCell>
                                        <TableCell className='text-right font-mono text-sm text-slate-600'>
                                            ${formatNumber(installment.exchangeRate)}
                                        </TableCell>
                                        <TableCell className='text-right font-mono text-green-700 font-semibold'>
                                            {formatCurrency(installment.amountUSD, 'USD')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Vista de tarjetas para móvil */}
                    <div className='md:hidden space-y-4'>
                        {sortedInstallments.map((installment, index) => (
                            <div
                                key={`${installment.installmentNumber}-${index}`}
                                className='bg-white rounded-lg border p-4 space-y-2'
                            >
                                <div className='flex justify-between items-center'>
                                    <Badge variant='secondary'>{formatNumber(installment.installmentNumber)}</Badge>
                                    <span className='text-sm text-slate-600'>{installment.paymentDate}</span>
                                </div>
                                <div className='grid grid-cols-2 gap-2 text-sm'>
                                    <div>
                                        <p className='text-slate-600'>Monto (ARS)</p>
                                        <p className='font-mono font-medium'>{formatCurrency(installment.amountARS, 'ARS')}</p>
                                    </div>
                                    <div>
                                        <p className='text-slate-600'>Monto (USD)</p>
                                        <p className='font-mono font-medium text-green-700'>{formatCurrency(installment.amountUSD, 'USD')}</p>
                                    </div>
                                    <div className='col-span-2'>
                                        <p className='text-slate-600'>Cotización USD</p>
                                        <p className='font-mono text-sm'>${formatNumber(installment.exchangeRate)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Footer with average exchange rate */}
                <div className='border-t pt-4'>
                    <div className='flex justify-between items-center text-sm text-slate-600'>
                        <span>Cotización promedio ponderada:</span>
                        <span className='font-semibold'>${formatNumber(totalARS / totalUSD)} ARS/USD</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
