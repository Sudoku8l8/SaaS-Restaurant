import { createContext } from 'react';
import type { AuthUser } from '@/types';

export interface AuthContextType {
    user: AuthUser | null;
    login: (pin: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
