import { createContext } from 'react';
import type { Restaurant } from '@/types';

export interface BranchContextType {
    /** Currently active branch (or the restaurant itself if not multi-branch) */
    currentBranch: Restaurant | null;
    /** All branches belonging to this owner */
    allBranches: Restaurant[];
    /** Whether multi-branch mode is enabled */
    isMultiBranch: boolean;
    /** Switch active branch by its restaurant ID/slug */
    switchBranch: (branchId: string) => void;
    /** Loading state while fetching branches */
    isLoading: boolean;
}

export const BranchContext = createContext<BranchContextType | undefined>(undefined);
