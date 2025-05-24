import type { PlanData, InstallmentDetail } from '../types/plan';

interface StoredData {
    peugeotPlan: PlanData | null;
    nissanPlan: PlanData | null;
    peugeotInstallments: InstallmentDetail[];
    nissanInstallments: InstallmentDetail[];
    lastUpdate: string;
}

const STORAGE_KEY = 'plan_ahorro_data';

export const storageService = {
    saveData(data: StoredData): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    },

    getData(): StoredData | null {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        }
        return null;
    },

    clearData(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
}; 