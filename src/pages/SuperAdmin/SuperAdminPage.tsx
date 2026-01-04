import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
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

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
        if (date instanceof Date) return date.toLocaleDateString();
        return 'Fecha inválida';
    };

    if (!isAuthenticated) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2c3e50' }}>
                <Card style={{ padding: '2rem', width: '300px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>SuperAdmin</h2>
                    <form onSubmit={handleLogin}>
                        <Input
                            type="password"
                            placeholder="Contraseña Maestra"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            fullWidth
                            style={{ marginBottom: '1rem' }}
                        />
                        <Button type="submit" fullWidth>Entrar</Button>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>🦸 SuperAdmin Dashboard</h1>
                    <p>Gestión Global de Tenants</p>
                </div>
                <Button variant="secondary" onClick={() => navigate('/')}>Salir</Button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3>{restaurants.length}</h3>
                    <p>Restaurantes Totales</p>
                </Card>
                <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3>{restaurants.filter(r => r.active).length}</h3>
                    <p>Activos</p>
                </Card>
                <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3>$0.00</h3>
                    <p>MRR (Ingresos Mensuales)</p>
                </Card>
            </div>

            <Card>
                <div style={{ padding: '1rem', overflowX: 'auto' }}>
                    {isLoading ? (
                        <p>Cargando datos...</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <th style={{ padding: '1rem' }}>Restaurante</th>
                                    <th style={{ padding: '1rem' }}>Slug (URL)</th>
                                    <th style={{ padding: '1rem' }}>Plan</th>
                                    <th style={{ padding: '1rem' }}>Estado</th>
                                    <th style={{ padding: '1rem' }}>Fecha Registro</th>
                                    <th style={{ padding: '1rem' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restaurants.map(rest => (
                                    <tr key={rest.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{rest.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <a href={`/${rest.id}/login`} target="_blank" rel="noreferrer" style={{ color: 'blue' }}>
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
                                        <td style={{ padding: '1rem' }}>
                                            {formatDate(rest.createdAt)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(rest.id, rest.name)}>
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
