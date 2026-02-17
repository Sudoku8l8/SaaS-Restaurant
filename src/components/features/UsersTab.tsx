import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card, Badge } from '@/components/shared';
import { Trash2, Pencil } from 'lucide-react';
import { hashPin } from '@/utils/crypto';
import type { User } from '@/types';

export function UsersTab() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<{
        name: string;
        pin: string;
        role: 'admin' | 'waiter' | 'chef';
    }>({
        name: '',
        pin: '',
        role: 'waiter'
    });

    useEffect(() => {
        if (!currentUser?.restaurantId) return;

        const q = query(
            collection(db, 'users'),
            where('restaurantId', '==', currentUser.restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(data);
        });

        return () => unsubscribe();
    }, [currentUser?.restaurantId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Validation: PIN must be 4 digits
            if (!/^\d{4}$/.test(formData.pin)) {
                alert("El PIN debe tener 4 dígitos numéricos");
                return;
            }

            const newHash = await hashPin(formData.pin);

            // Collision Check
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('restaurantId', '==', currentUser?.restaurantId));
            const querySnapshot = await getDocs(q);

            const collision = querySnapshot.docs.some(doc => {
                if (editingUserId && doc.id === editingUserId) return false;
                const data = doc.data();
                return data.pinHash === newHash || data.pinHash === formData.pin;
            });

            if (collision) {
                alert("Este PIN ya está en uso por otro miembro del equipo.");
                return;
            }

            const userData = {
                restaurantId: currentUser?.restaurantId,
                name: formData.name,
                pinHash: newHash,
                role: formData.role
            };

            if (editingUserId) {
                await updateDoc(doc(db, 'users', editingUserId), userData);
            } else {
                await addDoc(collection(db, 'users'), userData);
            }
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
        }
    };

    const openModal = (user?: User) => {
        if (user) {
            setFormData({
                name: user.name,
                pin: '', // Don't show old PIN for security
                role: user.role as any
            });
            setEditingUserId(user.id);
        } else {
            setFormData({ name: '', pin: '', role: 'waiter' });
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
            case 'chef': return <Badge variant="warning">Cocinero</Badge>;
            default: return <Badge variant="neutral">Mozo</Badge>;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3>Equipo ({users.length})</h3>
                <Button onClick={() => openModal()}>+ Nuevo Usuario</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {users.map(u => (
                    <Card key={u.id} style={{ padding: '1rem', borderLeft: u.role === 'admin' ? '5px solid var(--color-primary)' : u.role === 'chef' ? '5px solid var(--warning-color)' : '5px solid #ccc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{u.name}</div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    {getRoleBadge(u.role)}
                                </div>
                                <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                                    PIN: ••••
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {u.role !== 'admin' && (
                                    <Button size="sm" variant="outline" onClick={() => openModal(u)}>
                                        <Pencil size={16} />
                                    </Button>
                                )}
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

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ padding: '2rem', width: '400px', maxWidth: '90%' }}>
                        <h2>{editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input
                                label="Nombre Completo"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label=" PIN de Acceso (4 dígitos)"
                                type="password"
                                maxLength={4}
                                value={formData.pin}
                                onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                required
                            />
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Rol</label>
                                <select
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                >
                                    <option value="waiter">Mozo</option>
                                    <option value="chef">Cocinero</option>
                                    <option value="admin">Administrador</option>
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
