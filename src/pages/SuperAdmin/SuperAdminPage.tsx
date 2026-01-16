import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { Button, Card, Input, Badge } from '@/components/shared';
import type { Restaurant } from '@/types';

export function SuperAdminPage() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // MVP Security: Simple hardcoded password check
    // In production, this should use Firebase Auth with a specific role
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') { // TODO: Move to env var
            setIsAuthenticated(true);
            loadRestaurants();
        } else {
            alert('Contraseña incorrecta');
        }
    };

    const loadRestaurants = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'restaurants'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
            setRestaurants(data);
        } catch (error) {
            console.error("Error loading restaurants:", error);
            alert('Error cargando restaurantes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿ESTÁS SEGURO? Esto eliminará el acceso al restaurante "${name}". (Nota: No borra las sub-colecciones en este MVP)`)) {
            try {
                await deleteDoc(doc(db, 'restaurants', id));
                setRestaurants(prev => prev.filter(r => r.id !== id));
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Error eliminando restaurante");
            }
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'restaurants', id), {
                active: !currentStatus
            });
            setRestaurants(prev => prev.map(r => r.id === id ? { ...r, active: !currentStatus } : r));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar estado");
        }
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
        if (date instanceof Date) return date.toLocaleDateString();
        return 'Fecha inválida';
    };

    if (!isAuthenticated) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-hover)' }}>
                <Card style={{ padding: '2.5rem', width: '360px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', fontWeight: '800', margin: 0 }}>SuperAdmin</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Gestión Maestra de Restaurantes</p>
                    </div>
                    <form onSubmit={handleLogin}>
                        <Input
                            type="password"
                            placeholder="Contraseña Maestra"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            fullWidth
                            style={{ marginBottom: '1.5rem' }}
                        />
                        <Button type="submit" fullWidth style={{ background: 'var(--primary-color)', fontWeight: '800' }}>Acceder al Panel</Button>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ color: 'var(--text-primary)', fontWeight: '900' }}>🦸 SuperAdmin Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Gestión Global de Tenants</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/')}>Salir</Button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <Card style={{ padding: '1.75rem', textAlign: 'center', borderTop: '4px solid var(--primary-color)', boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-primary)', margin: '0.5rem 0' }}>{restaurants.length}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Restaurantes Totales</p>
                </Card>
                <Card style={{ padding: '1.75rem', textAlign: 'center', borderTop: '4px solid var(--success-color)', boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--success-color)', margin: '0.5rem 0' }}>{restaurants.filter(r => r.active).length}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Licencias Activas</p>
                </Card>
                <Card style={{ padding: '1.75rem', textAlign: 'center', borderTop: '4px solid var(--secondary-hover)', boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary-color)', margin: '0.5rem 0' }}>S/ 0.00</h3>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Ingresos Mensuales</p>
                </Card>
            </div>

            <Card style={{ boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    {isLoading ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Cargando datos...</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--divider-color)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800' }}>Restaurante</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800' }}>Ruta URL</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800' }}>Plan</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800' }}>Estado</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800' }}>Registro</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restaurants.map(rest => (
                                    <tr key={rest.id} style={{ borderBottom: '1px solid var(--divider-color)', transition: 'background-color 0.2s' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{rest.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <a href={`/${rest.id}/login`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none', borderBottom: '1px dashed' }}>
                                                /{rest.id}
                                            </a>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <Badge variant={rest.plan === 'premium' ? 'warning' : 'neutral'}>
                                                {rest.plan.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <Badge variant={rest.active ? 'success' : 'error'}>
                                                {rest.active ? 'ACTIVO' : 'INACTIVO'}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {formatDate(rest.createdAt)}
                                        </td>
                                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <Button
                                                variant={rest.active ? 'outline' : 'primary'}
                                                size="sm"
                                                onClick={() => toggleActive(rest.id, rest.active)}
                                                style={{ fontSize: '0.75rem', fontWeight: '800' }}
                                            >
                                                {rest.active ? 'Desactivar' : 'Activar'}
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(rest.id, rest.name)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '800' }}>
                                                Eliminar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    );
}
