'use client';

import { useState, useEffect } from 'react';
import { PlanCard } from './components/PlanCard';
import { fetchPeugeotData, fetchNissanData, fetchDollarRates } from './services/api';
import { processPeugeotData, processNissanData } from './utils/dataProcessors';
import type { PlanData } from './types/plan';
import { InstallmentDetailsModal } from './components/InstallmentDetailsModal';
import { processPeugeotInstallments, processNissanInstallments } from './utils/dataProcessors';
import type { InstallmentDetail } from './types/plan';
import { storageService } from './services/storage';

export default function Dashboard() {
    const [peugeotPlan, setPeugeotPlan] = useState<PlanData | null>(null);
    const [nissanPlan, setNissanPlan] = useState<PlanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [peugeotInstallments, setPeugeotInstallments] = useState<InstallmentDetail[]>([]);
    const [nissanInstallments, setNissanInstallments] = useState<InstallmentDetail[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<'peugeot' | 'nissan' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Intentar cargar datos del localStorage primero
                const storedData = storageService.getData();
                if (storedData) {
                    setPeugeotPlan(storedData.peugeotPlan);
                    setNissanPlan(storedData.nissanPlan);
                    setPeugeotInstallments(storedData.peugeotInstallments);
                    setNissanInstallments(storedData.nissanInstallments);
                    setLastUpdate(storedData.lastUpdate);
                }

                try {
                    // Intentar obtener datos actualizados de las APIs
                    const [peugeotData, nissanData, dollarRates] = await Promise.all([
                        fetchPeugeotData(),
                        fetchNissanData(),
                        fetchDollarRates(),
                    ]);

                    // Procesar los datos
                    const processedPeugeot = processPeugeotData(peugeotData, dollarRates);
                    const processedNissan = processNissanData(nissanData, dollarRates);
                    const peugeotInstallmentDetails = processPeugeotInstallments(peugeotData, dollarRates);
                    const nissanInstallmentDetails = processNissanInstallments(nissanData, dollarRates);

                    // Actualizar el estado
                    setPeugeotPlan(processedPeugeot);
                    setNissanPlan(processedNissan);
                    setPeugeotInstallments(peugeotInstallmentDetails);
                    setNissanInstallments(nissanInstallmentDetails);
                    setLastUpdate(new Date().toISOString());

                    // Guardar en localStorage
                    storageService.saveData({
                        peugeotPlan: processedPeugeot,
                        nissanPlan: processedNissan,
                        peugeotInstallments: peugeotInstallmentDetails,
                        nissanInstallments: nissanInstallmentDetails,
                        lastUpdate: new Date().toISOString(),
                    });
                } catch (apiError) {
                    console.error('Error al obtener datos de las APIs:', apiError);
                    if (!storedData) {
                        throw apiError; // Solo lanzar error si no hay datos almacenados
                    }
                }
            } catch (err) {
                setError('Error al cargar los datos de los planes. Por favor, intenta nuevamente.');
                console.error('Dashboard loading error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const handleViewPeugeotDetails = () => {
        setSelectedPlan('peugeot');
        setIsModalOpen(true);
    };

    const handleViewNissanDetails = () => {
        setSelectedPlan('nissan');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlan(null);
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4'>
            <div className='max-w-7xl mx-auto'>
                {/* Header */}
                <div className='text-center mb-8'>
                    <h1 className='text-4xl font-bold text-slate-800 mb-2'>Dashboard de Planes de Ahorro</h1>
                    <p className='text-slate-600'>Seguimiento de progreso y conversión histórica USD/ARS</p>
                </div>

                {/* Error State */}
                {error && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
                        <p className='text-red-800'>{error}</p>
                    </div>
                )}

                {/* Plans Grid */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    <PlanCard
                        title='Plan Peugeot'
                        brand='peugeot'
                        planData={peugeotPlan}
                        isLoading={loading}
                        onViewDetails={handleViewPeugeotDetails}
                    />
                    <PlanCard
                        title='Plan Nissan'
                        brand='nissan'
                        planData={nissanPlan}
                        isLoading={loading}
                        onViewDetails={handleViewNissanDetails}
                    />
                </div>

                {/* Footer */}
                <div className='text-center mt-8 text-sm text-slate-500'>
                    <p>Última actualización: {new Date(lastUpdate).toLocaleString('es-AR')}</p>
                </div>
                {/* Installment Details Modal */}
                <InstallmentDetailsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    installments={selectedPlan === 'peugeot' ? peugeotInstallments : nissanInstallments}
                    planTitle={selectedPlan === 'peugeot' ? 'Plan Peugeot' : 'Plan Nissan'}
                    modelName={selectedPlan === 'peugeot' ? peugeotPlan?.modelName || '' : nissanPlan?.modelName || ''}
                />
            </div>
        </div>
    );
}
