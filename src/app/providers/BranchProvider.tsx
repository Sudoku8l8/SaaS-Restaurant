import { useState, useEffect, useContext, type ReactNode } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useTenant } from './TenantProvider';
import { BranchContext, type BranchContextType } from './BranchContext';
import type { Restaurant } from '@/types';

export function BranchProvider({ children }: { children: ReactNode }) {
    const { tenant } = useTenant();

    const [allBranches, setAllBranches] = useState<Restaurant[]>([]);
    const [currentBranch, setCurrentBranch] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const isMultiBranch = tenant?.config?.multiSucursal === true;

    // Load branches when multi-branch is enabled
    useEffect(() => {
        if (!tenant || !isMultiBranch) {
            // Not multi-branch → current branch IS the restaurant itself
            setCurrentBranch(tenant);
            setAllBranches(tenant ? [tenant] : []);
            return;
        }

        // If this is the parent restaurant, load its branches
        if (tenant.isParent && tenant.branches && tenant.branches.length > 0) {
            setIsLoading(true);

            const q = query(
                collection(db, 'restaurants'),
                where('parentId', '==', tenant.id)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const branches = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as Restaurant));

                // Include parent + children
                const all = [tenant, ...branches];
                setAllBranches(all);

                // Default to first branch if no current
                if (!currentBranch || !all.find(b => b.id === currentBranch.id)) {
                    setCurrentBranch(tenant);
                }

                setIsLoading(false);
            });

            return () => unsubscribe();
        } else {
            // This restaurant IS a branch or has no branches yet
            setCurrentBranch(tenant);
            setAllBranches([tenant]);
        }
    }, [tenant, isMultiBranch]);

    const switchBranch = (branchId: string) => {
        const branch = allBranches.find(b => b.id === branchId);
        if (branch) {
            setCurrentBranch(branch);
        }
    };

    const value: BranchContextType = {
        currentBranch,
        allBranches,
        isMultiBranch,
        switchBranch,
        isLoading,
    };

    return (
        <BranchContext.Provider value={value}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error('useBranch must be used within a BranchProvider');
    }
    return context;
}
