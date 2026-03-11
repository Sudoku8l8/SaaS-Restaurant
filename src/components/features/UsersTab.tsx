import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, addDoc, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useBranch } from '@/app/providers/BranchProvider';
import { useTenant } from '@/app/providers/TenantProvider';
import { Button, Input, Card, Badge } from '@/components/shared';
import { Trash2, Pencil, Building2, Users, Filter } from 'lucide-react';
import { hashPin } from '@/utils/crypto';
import type { User } from '@/types';

export function UsersTab() {
    const { user: currentUser } = useAuth();
    const { tenant } = useTenant();
    const { allBranches, isMultiBranch } = useBranch();

    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [filterBranch, setFilterBranch] = useState<string>('all');

    // Form State
    const [formData, setFormData] = useState<{
        name: string;
        pin: string;
        role: 'admin' | 'waiter' | 'chef' | 'shift_manager' | 'caja';
        restaurantId: string;
    }>({
        name: '',
        pin: '',
        role: 'waiter',
        restaurantId: currentUser?.restaurantId || '',
    });

    // Get all restaurant IDs to monitor
    const allRestaurantIds = isMultiBranch && tenant?.branches
        ? [tenant.id, ...tenant.branches]
        : [currentUser?.restaurantId || ''];

    const loadUsers = useCallback(async () => {
        if (!currentUser?.restaurantId) return;

        const idsToWatch = allRestaurantIds.filter(Boolean);
        if (idsToWatch.length === 0) return;

        // Firestore 'in' supports up to 30 values
        const q = query(
            collection(db, 'users'),
            where('restaurantId', 'in', idsToWatch.slice(0, 30))
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(data);
    }, [currentUser?.restaurantId, allRestaurantIds.length]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Filter by branch
    const filteredUsers = filterBranch === 'all'
        ? users
        : users.filter(u => u.restaurantId === filterBranch);

    // Get branch name by ID
    const getBranchName = (restaurantId: string): string => {
        if (restaurantId === tenant?.id) return tenant.name || 'Principal';
        const branch = allBranches.find(b => b.id === restaurantId);
        return branch?.name || restaurantId;
    };

    // Group users by branch for stats
    const usersByBranch = allRestaurantIds.reduce((acc, branchId) => {
        acc[branchId] = users.filter(u => u.restaurantId === branchId);
        return acc;
    }, {} as Record<string, User[]>);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!/^\d{4}$/.test(formData.pin)) {
                alert("El PIN debe tener 4 dígitos numéricos");
                return;
            }

            const targetRestaurantId = isMultiBranch ? formData.restaurantId : currentUser?.restaurantId;

            const newHash = await hashPin(formData.pin);

            // PIN collision check within target branch
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('restaurantId', '==', targetRestaurantId));
            const querySnapshot = await getDocs(q);

            const collision = querySnapshot.docs.some(doc => {
                if (editingUserId && doc.id === editingUserId) return false;
                const data = doc.data();
                return data.pinHash === newHash || data.pinHash === formData.pin;
            });

            if (collision) {
                alert("Este PIN ya está en uso por otro miembro en esa sucursal.");
                return;
            }

            const userData = {
                restaurantId: targetRestaurantId,
                name: formData.name,
                pinHash: newHash,
                role: formData.role
            };

            if (editingUserId) {
                await updateDoc(doc(db, 'users', editingUserId), userData);
            } else {
                await addDoc(collection(db, 'users'), userData);
            }
            await loadUsers();
            closeModal();
        } catch (error) {
            console.error(error);
            alert(`Error al ${editingUserId ? 'editar' : 'crear'} usuario`);
        }
    };

    const handleDelete = async (id: string) => {
        if (id === currentUser?.id) {
            alert("No puedes eliminar tu propio usuario");
            return;
        }
        if (confirm('¿Eliminar usuario? Esta acción no se puede deshacer.')) {
            await deleteDoc(doc(db, 'users', id));
            await loadUsers();
        }
    };

    const openModal = (user?: User) => {
        if (user) {
            setFormData({
                name: user.name,
                pin: '',
                role: user.role as any,
                restaurantId: user.restaurantId,
            });
            setEditingUserId(user.id);
        } else {
            setFormData({
                name: '',
                pin: '',
                role: 'waiter',
                restaurantId: filterBranch !== 'all' ? filterBranch : (currentUser?.restaurantId || ''),
            });
            setEditingUserId(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUserId(null);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <Badge variant="info">Administrador</Badge>;
            case 'caja': return <Badge variant="info" style={{ backgroundColor: '#8b5cf6', color: 'white' }}>Cajero</Badge>;
            case 'chef': return <Badge variant="warning">Cocinero</Badge>;
            case 'shift_manager': return <Badge variant="success">Encargado de Turno</Badge>;
            default: return <Badge variant="neutral">Mozo</Badge>;
        }
    };

    const getRoleBorderColor = (role: string) => {
        switch (role) {
            case 'admin': return 'var(--primary-color)';
            case 'caja': return '#8b5cf6';
            case 'chef': return 'var(--warning-color)';
            case 'shift_manager': return 'var(--success-color)';
            default: return '#ccc';
        }
    };

    return (
        <div>
            {/* Header with branch summary (multi-branch only) */}
            {isMultiBranch && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {allRestaurantIds.map(branchId => {
                        const branchUsers = usersByBranch[branchId] || [];
                        const name = getBranchName(branchId);
                        const isActive = filterBranch === branchId;
                        return (
                            <button
                                key={branchId}
                                onClick={() => setFilterBranch(isActive ? 'all' : branchId)}
                                style={{
                                    padding: '1rem', borderRadius: '10px', cursor: 'pointer',
                                    border: `2px solid ${isActive ? 'var(--primary-color)' : 'var(--divider-color)'}`,
                                    background: isActive ? 'rgba(37, 99, 235, 0.05)' : 'var(--surface-color)',
                                    textAlign: 'center', fontFamily: 'inherit', display: 'flex',
                                    flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <Building2 size={18} color={isActive ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isActive ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                                    {name}
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isActive ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                                    {branchUsers.length} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>usuarios</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} />
                    Equipo ({filteredUsers.length})
                    {filterBranch !== 'all' && (
                        <Badge variant="info" style={{ fontSize: '0.75rem' }}>{getBranchName(filterBranch)}</Badge>
                    )}
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {isMultiBranch && filterBranch !== 'all' && (
                        <Button size="sm" variant="ghost" onClick={() => setFilterBranch('all')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Filter size={14} /> Ver Todos
                        </Button>
                    )}
                    <Button onClick={() => openModal()}>+ Nuevo Usuario</Button>
                </div>
            </div>

            {/* User Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {filteredUsers.map(u => (
                    <Card key={u.id} style={{ padding: '1rem', borderLeft: `5px solid ${getRoleBorderColor(u.role)}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{u.name}</div>
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {getRoleBadge(u.role)}
                                    {isMultiBranch && (
                                        <Badge variant="neutral" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}>
                                            <Building2 size={10} /> {getBranchName(u.restaurantId)}
                                        </Badge>
                                    )}
                                </div>
                                <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                                    PIN: ••••
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button size="sm" variant="outline" onClick={() => openModal(u)}>
                                    <Pencil size={16} />
                                </Button>
                                {u.id !== currentUser?.id && (
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(u.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No hay usuarios{filterBranch !== 'all' ? ' en esta sucursal' : ''}. Crea uno nuevo.
                </Card>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
                }}>
                    <Card style={{ padding: '2rem', width: '440px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.25rem' }}>{editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Branch Selector (multi-branch only) */}
                            {isMultiBranch && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>
                                        <Building2 size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                        Sucursal
                                    </label>
                                    <select
                                        value={formData.restaurantId}
                                        onChange={e => setFormData({ ...formData, restaurantId: e.target.value })}
                                        required
                                        style={{
                                            width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                                            border: '1px solid var(--divider-color)', background: 'var(--background-color)',
                                            color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit',
                                        }}
                                    >
                                        {allRestaurantIds.map(id => (
                                            <option key={id} value={id}>{getBranchName(id)}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <Input
                                label="Nombre Completo"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Ej: Carlos Pérez"
                            />
                            <Input
                                label="PIN de Acceso (4 dígitos)"
                                type="password"
                                maxLength={4}
                                value={formData.pin}
                                onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                required
                                placeholder="••••"
                            />
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Rol</label>
                                <select
                                    style={{
                                        width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                                        border: '1px solid var(--divider-color)', background: 'var(--background-color)',
                                        color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit',
                                    }}
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                >
                                    <option value="waiter">🍽️ Mozo</option>
                                    <option value="chef">👨‍🍳 Cocinero</option>
                                    <option value="shift_manager">📋 Encargado de Turno</option>
                                    <option value="caja">💵 Caja</option>
                                    <option value="admin">⚙️ Administrador</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="ghost" onClick={closeModal} fullWidth>Cancelar</Button>
                                <Button type="submit" fullWidth>{editingUserId ? 'Actualizar' : 'Crear'} Usuario</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
