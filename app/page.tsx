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
    
    // Estados individuales para cada plan
    const [peugeotLoading, setPeugeotLoading] = useState(true);
    const [nissanLoading, setNissanLoading] = useState(true);
    const [peugeotError, setPeugeotError] = useState<string | null>(null);
    const [nissanError, setNissanError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            setError(null);
            setPeugeotLoading(true);
            setNissanLoading(true);
            setPeugeotError(null);
            setNissanError(null);

            // Intentar cargar datos del localStorage primero
            const storedData = storageService.getData();
            if (storedData) {
                setPeugeotPlan(storedData.peugeotPlan);
                setNissanPlan(storedData.nissanPlan);
                setPeugeotInstallments(storedData.peugeotInstallments);
                setNissanInstallments(storedData.nissanInstallments);
                setLastUpdate(storedData.lastUpdate);
            }

            // Obtener tasas de dólar (necesarias para ambos planes)
            let dollarRates: any;
            try {
                dollarRates = await fetchDollarRates();
            } catch (dollarError) {
                console.error('Error al obtener tasas de dólar:', dollarError);
                // Si no podemos obtener las tasas de dólar, usar datos almacenados si existen
                setLoading(false);
                if (!storedData) {
                    setError('Error al obtener las tasas de cambio. Por favor, intenta nuevamente.');
                }
                return;
            }

            // Manejar Peugeot de forma independiente
            const loadPeugeotData = async () => {
                try {
                    const peugeotData = await fetchPeugeotData();
                    const processedPeugeot = processPeugeotData(peugeotData, dollarRates);
                    const peugeotInstallmentDetails = processPeugeotInstallments(peugeotData, dollarRates);
                    
                    setPeugeotPlan(processedPeugeot);
                    setPeugeotInstallments(peugeotInstallmentDetails);
                    setPeugeotError(null);
                } catch (error) {
                    console.error('Error al obtener datos de Peugeot:', error);
                    setPeugeotError('Error al cargar datos de Peugeot. Mostrando datos almacenados.');
                } finally {
                    setPeugeotLoading(false);
                }
            };

            // Manejar Nissan de forma independiente
            const loadNissanData = async () => {
                try {
                    const nissanData = await fetchNissanData();
                    const processedNissan = processNissanData(nissanData, dollarRates);
                    const nissanInstallmentDetails = processNissanInstallments(nissanData, dollarRates);
                    
                    setNissanPlan(processedNissan);
                    setNissanInstallments(nissanInstallmentDetails);
                    setNissanError(null);
                } catch (error) {
                    console.error('Error al obtener datos de Nissan:', error);
                    setNissanError('Error al cargar datos de Nissan. Mostrando datos almacenados.');
                } finally {
                    setNissanLoading(false);
                }
            };

            // Ejecutar ambas llamadas en paralelo pero manejar errores individualmente
            const results = await Promise.allSettled([loadPeugeotData(), loadNissanData()]);

            // Guardar datos actualizados en localStorage
            const currentTime = new Date().toISOString();
            setLastUpdate(currentTime);

            setLoading(false);
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
                    <h1 className='text-4xl font-bold text-slate-800 mb-2'>Planes de Ahorro</h1>
                    <p className='text-slate-600'>Seguimiento de progreso y conversión USD/ARS</p>
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
                        isLoading={peugeotLoading}
                        error={peugeotError}
                        onViewDetails={handleViewPeugeotDetails}
                    />
                    <PlanCard
                        title='Plan Nissan'
                        brand='nissan'
                        planData={nissanPlan}
                        isLoading={nissanLoading}
                        error={nissanError}
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
