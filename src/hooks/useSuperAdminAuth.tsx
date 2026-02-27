import React, { createContext, useContext, useState } from 'react';
import { hashPin } from '@/utils/crypto';

interface SuperAdminAuthContextType {
    isAuthenticated: boolean;
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | undefined>(undefined);

const MASTER_PIN = import.meta.env.VITE_SUPERADMIN_PIN || import.meta.env.VITE_SUPERADMIN_KEY || 'admin123';
const SESSION_KEY = 'sa_auth_session';

export function SuperAdminAuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        // Obfuscated check instead of plain string
        const session = sessionStorage.getItem(SESSION_KEY);
        try {
            if (session) {
                const dec = atob(session);
                return dec === `SUPER_ADMIN_VALID_${new Date().toISOString().split('T')[0]}`;
            }
        } catch {
            return false;
        }
        return false;
    });

    const login = async (pin: string) => {
        const hashedInput = await hashPin(pin);
        const hashedMaster = await hashPin(MASTER_PIN);
        const isValid = hashedInput === hashedMaster;

        if (isValid) {
            setIsAuthenticated(true);
            sessionStorage.setItem(SESSION_KEY, btoa(`SUPER_ADMIN_VALID_${new Date().toISOString().split('T')[0]}`));
        }
        return isValid;
    };

    const logout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem(SESSION_KEY);
    };

    return (
        <SuperAdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </SuperAdminAuthContext.Provider>
    );
}

export function useSuperAdminAuth() {
    const context = useContext(SuperAdminAuthContext);
    if (!context) {
        throw new Error("useSuperAdminAuth must be used within a SuperAdminAuthProvider");
    }
    return context;
}
