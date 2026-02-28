import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, storage } from '@/services/firebase/config';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from './useAuth';
import { useTenant } from '@/app/providers/TenantProvider';
import { getPeruDateString, getPeruNow } from '@/utils/dateUtils';
import type {
    PettyCashExpense,
    PettyCashCategory,
    Closure
} from '@/types';
import { PettyCashExpenseStatus as PCStatus, UserRole as Roles } from '@/types';

// ── Default Configuration ────────────────────────────────────────────────────
const DEFAULT_PETTY_CASH_CONFIG = {
    maxPerExpense: 20,
    maxDailyPerUser: 50,
    enableAutoApproval: true,
    requireReceipt: false,
};

// ── Types ────────────────────────────────────────────────────────────────────
export interface RequestExpenseInput {
    amount: number;
    description: string;
    category: PettyCashCategory;
    receiptFile?: File;
}

export interface PettyCashSummary {
    totalApproved: number;
    totalPending: number;
    totalRejected: number;
    countApproved: number;
    countPending: number;
    countRejected: number;
    userDailyTotal: number;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function usePettyCash() {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const restaurantId = user?.restaurantId || '';

    const [expenses, setExpenses] = useState<PettyCashExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSession, setCurrentSession] = useState<Closure | null>(null);

    // Petty Cash config with defaults
    const config = useMemo(() => ({
        ...DEFAULT_PETTY_CASH_CONFIG,
        ...(tenant?.config?.pettyCash || {}),
    }), [tenant?.config?.pettyCash]);

    const today = getPeruDateString();

    // ── Listen to today's petty cash expenses ────────────────────────────────
    useEffect(() => {
        if (!restaurantId) return;

        const q = query(
            collection(db, 'pettyCashExpenses'),
            where('restaurantId', '==', restaurantId),
            where('date', '==', today)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: PettyCashExpense[] = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    requestedAt: data.requestedAt instanceof Timestamp
                        ? data.requestedAt.toDate()
                        : new Date(data.requestedAt),
                    approvedAt: data.approvedAt instanceof Timestamp
                        ? data.approvedAt.toDate()
                        : data.approvedAt ? new Date(data.approvedAt) : undefined,
                } as PettyCashExpense;
            });
            items.sort((a, b) =>
                new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
            );
            setExpenses(items);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId, today]);

    // ── Listen to today's cash session (closure) ─────────────────────────────
    useEffect(() => {
        if (!restaurantId) return;

        const q = query(
            collection(db, 'closures'),
            where('restaurantId', '==', restaurantId),
            where('date', '==', today)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setCurrentSession({
                    id: snapshot.docs[0].id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp
                        ? data.createdAt.toDate()
                        : new Date(data.createdAt),
                } as Closure);
            } else {
                setCurrentSession(null);
            }
        });

        return () => unsubscribe();
    }, [restaurantId, today]);

    // ── Summary calculations ─────────────────────────────────────────────────
    const summary: PettyCashSummary = useMemo(() => {
        const approved = expenses.filter(e =>
            e.status === PCStatus.AUTO_APPROVED || e.status === PCStatus.APPROVED
        );
        const pending = expenses.filter(e => e.status === PCStatus.PENDING);
        const rejected = expenses.filter(e => e.status === PCStatus.REJECTED);
        const userExpenses = expenses.filter(e =>
            e.requestedBy === user?.id &&
            (e.status === PCStatus.AUTO_APPROVED || e.status === PCStatus.APPROVED)
        );

        return {
            totalApproved: approved.reduce((sum, e) => sum + e.amount, 0),
            totalPending: pending.reduce((sum, e) => sum + e.amount, 0),
            totalRejected: rejected.reduce((sum, e) => sum + e.amount, 0),
            countApproved: approved.length,
            countPending: pending.length,
            countRejected: rejected.length,
            userDailyTotal: userExpenses.reduce((sum, e) => sum + e.amount, 0),
        };
    }, [expenses, user?.id]);

    // Current petty cash balance
    const pettyCashBalance = useMemo(() => {
        const openingBalance = currentSession?.openingBalance || 0;
        return openingBalance - summary.totalApproved;
    }, [currentSession?.openingBalance, summary.totalApproved]);

    // ── Upload receipt photo ─────────────────────────────────────────────────
    const uploadReceipt = useCallback(async (file: File): Promise<string> => {
        const timestamp = Date.now();
        const storageRef = ref(
            storage,
            `receipts/${restaurantId}/${today}/${timestamp}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    }, [restaurantId, today]);

    // ── Request expense ──────────────────────────────────────────────────────
    const requestExpense = useCallback(async (input: RequestExpenseInput) => {
        if (!user || !restaurantId) throw new Error('No autenticado');

        // Upload receipt if provided
        let receiptUrl: string | undefined;
        if (input.receiptFile) {
            receiptUrl = await uploadReceipt(input.receiptFile);
        }

        // Check auto-approval rules
        const userDailyApproved = expenses.filter(e =>
            e.requestedBy === user.id &&
            (e.status === PCStatus.AUTO_APPROVED || e.status === PCStatus.APPROVED)
        ).reduce((sum, e) => sum + e.amount, 0);

        const canAutoApprove =
            config.enableAutoApproval &&
            input.amount <= config.maxPerExpense &&
            (userDailyApproved + input.amount) <= config.maxDailyPerUser;

        // Admin and shift_manager direct expenses are always auto-approved
        const isPrivilegedRole = user.role === Roles.ADMIN || user.role === Roles.SHIFT_MANAGER;
        const shouldAutoApprove = canAutoApprove || isPrivilegedRole;

        const newExpense: Omit<PettyCashExpense, 'id'> = {
            restaurantId,
            amount: input.amount,
            description: input.description,
            category: input.category,
            ...(receiptUrl ? { receiptUrl } : {}),
            requestedBy: user.id,
            requestedByName: user.name,
            requestedByRole: user.role,
            requestedAt: getPeruNow(),
            status: shouldAutoApprove ? PCStatus.AUTO_APPROVED : PCStatus.PENDING,
            autoApproved: shouldAutoApprove,
            date: today,
        };

        await addDoc(collection(db, 'pettyCashExpenses'), newExpense);

        return { autoApproved: shouldAutoApprove };
    }, [user, restaurantId, expenses, config, today, uploadReceipt]);

    // ── Admin actions ────────────────────────────────────────────────────────
    const approveExpense = useCallback(async (expenseId: string) => {
        if (!user || user.role !== Roles.ADMIN) throw new Error('Sin permisos');
        await updateDoc(doc(db, 'pettyCashExpenses', expenseId), {
            status: PCStatus.APPROVED,
            approvedBy: user.id,
            approvedByName: user.name,
            approvedAt: getPeruNow(),
        });
    }, [user]);

    const rejectExpense = useCallback(async (expenseId: string, reason: string) => {
        if (!user || user.role !== Roles.ADMIN) throw new Error('Sin permisos');
        await updateDoc(doc(db, 'pettyCashExpenses', expenseId), {
            status: PCStatus.REJECTED,
            rejectionReason: reason,
            approvedBy: user.id,
            approvedByName: user.name,
            approvedAt: getPeruNow(),
        });
    }, [user]);

    const addObservation = useCallback(async (expenseId: string, note: string) => {
        if (!user || user.role !== Roles.ADMIN) throw new Error('Sin permisos');
        await updateDoc(doc(db, 'pettyCashExpenses', expenseId), {
            status: PCStatus.OBSERVED,
            observation: note,
            approvedBy: user.id,
            approvedByName: user.name,
        });
    }, [user]);

    // ── Permission helpers ───────────────────────────────────────────────────
    const canRegisterDirectExpense = user?.role === Roles.ADMIN || user?.role === Roles.SHIFT_MANAGER;
    const canApproveExpenses = user?.role === Roles.ADMIN;
    const canViewAllExpenses = user?.role === Roles.ADMIN || user?.role === Roles.SHIFT_MANAGER;
    const hasPendingExpenses = summary.countPending > 0;
    const isSessionOpen = currentSession?.status === 'open';

    return {
        expenses,
        isLoading,
        summary,
        config,
        pettyCashBalance,
        currentSession,
        // Actions
        requestExpense,
        approveExpense,
        rejectExpense,
        addObservation,
        // Permissions
        canRegisterDirectExpense,
        canApproveExpenses,
        canViewAllExpenses,
        hasPendingExpenses,
        isSessionOpen,
    };
}
