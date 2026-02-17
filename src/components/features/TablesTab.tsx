import { useState, useMemo } from 'react';
import { db } from '@/services/firebase/config';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useTables } from '@/hooks/useTables';
import { useFloors } from '@/hooks/useFloors';
import { Button } from '@/components/shared';
import { Plus, Pencil, Trash2, X, Check, Users, Table2, Layers } from 'lucide-react';
import type { RestaurantTable } from '@/types';
import styles from './TablesTab.module.css';

const DEFAULT_FLOOR = 'Principal';

interface EditingTable {
    id: string;
    number: number;
    capacity: number;
    label: string;
    floor: string;
}

export function TablesTab() {
    const { user } = useAuth();
    const { tables } = useTables();
    const { floorNames, floors, addFloor, deleteFloor: deleteFloorDoc } = useFloors();

    // Floor management
    const [activeFloor, setActiveFloor] = useState(DEFAULT_FLOOR);
    const [isAddingFloor, setIsAddingFloor] = useState(false);
    const [newFloorName, setNewFloorName] = useState('');

    // Add table form
    const [newTableNumber, setNewTableNumber] = useState('');
    const [newTableCapacity, setNewTableCapacity] = useState('4');
    const [isCreating, setIsCreating] = useState(false);

    // Edit modal
    const [editingTable, setEditingTable] = useState<EditingTable | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Ensure activeFloor exists
    const currentFloor = floorNames.includes(activeFloor) ? activeFloor : DEFAULT_FLOOR;

    // Tables for current floor
    const floorTables = useMemo(() => {
        return tables
            .filter(t => (t.floor || DEFAULT_FLOOR) === currentFloor)
            .sort((a, b) => a.number - b.number);
    }, [tables, currentFloor]);

    const getFloorCount = (floor: string) => {
        return tables.filter(t => (t.floor || DEFAULT_FLOOR) === floor).length;
    };

    // ---- Floor CRUD ----
    const handleAddFloor = async () => {
        const name = newFloorName.trim();
        if (!name || floorNames.includes(name)) {
            setIsAddingFloor(false);
            setNewFloorName('');
            return;
        }
        await addFloor(name);
        setActiveFloor(name);
        setIsAddingFloor(false);
        setNewFloorName('');
    };

    const handleDeleteFloor = async (floor: string) => {
        if (floor === DEFAULT_FLOOR) return;
        const count = getFloorCount(floor);
        if (count > 0) {
            alert(`No se puede eliminar "${floor}" porque tiene ${count} mesa(s). Mueve o elimina las mesas primero.`);
            return;
        }
        if (confirm(`¿Eliminar el piso "${floor}"?`)) {
            const floorDoc = floors.find(f => f.name === floor);
            if (floorDoc) {
                await deleteFloorDoc(floorDoc.id);
            }
            setActiveFloor(DEFAULT_FLOOR);
        }
    };

    // ---- Table CRUD ----
    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseInt(newTableNumber, 10);
        if (!num || num <= 0) return;

        if (tables.some(t => t.number === num)) {
            alert(`La mesa ${num} ya existe.`);
            return;
        }

        try {
            setIsCreating(true);
            await addDoc(collection(db, 'tables'), {
                restaurantId: user?.restaurantId,
                number: num,
                status: 'free',
                capacity: parseInt(newTableCapacity, 10) || 4,
                floor: currentFloor,
            });
            setNewTableNumber('');
            setNewTableCapacity('4');
        } catch (error) {
            console.error("Error adding table:", error);
            alert("Error al crear mesa");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteTable = async (id: string, number: number) => {
        if (confirm(`¿Eliminar Mesa ${number}? Esta acción no se puede deshacer.`)) {
            try {
                await deleteDoc(doc(db, 'tables', id));
            } catch (error) {
                console.error("Error deleting table:", error);
                alert("Error al eliminar mesa");
            }
        }
    };

    const handleOpenEdit = (table: RestaurantTable) => {
        setEditingTable({
            id: table.id,
            number: table.number,
            capacity: table.capacity || 4,
            label: table.label || '',
            floor: table.floor || DEFAULT_FLOOR,
        });
    };

    const handleSaveEdit = async () => {
        if (!editingTable) return;

        if (editingTable.number <= 0) {
            alert('El número de mesa debe ser mayor a 0.');
            return;
        }

        if (tables.some(t => t.number === editingTable.number && t.id !== editingTable.id)) {
            alert(`La mesa ${editingTable.number} ya existe.`);
            return;
        }

        try {
            setIsSaving(true);
            const ref = doc(db, 'tables', editingTable.id);
            await updateDoc(ref, {
                number: editingTable.number,
                capacity: editingTable.capacity,
                label: editingTable.label || null,
                floor: editingTable.floor || DEFAULT_FLOOR,
            });
            setEditingTable(null);
        } catch (error) {
            console.error("Error updating table:", error);
            alert("Error al actualizar mesa");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.tablesContainer}>
            {/* Floor Selector */}
            <div className={styles.floorBar}>
                <Layers size={16} style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem', flexShrink: 0 }} />
                {floorNames.map(floor => (
                    <button
                        key={floor}
                        className={`${styles.floorTab} ${currentFloor === floor ? styles.floorTabActive : ''}`}
                        onClick={() => setActiveFloor(floor)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            if (floor !== DEFAULT_FLOOR) handleDeleteFloor(floor);
                        }}
                    >
                        {floor}
                        <span className={`${styles.floorTabCount} ${currentFloor !== floor ? styles.floorTabCountInactive : ''}`}>
                            {getFloorCount(floor)}
                        </span>
                    </button>
                ))}

                {isAddingFloor ? (
                    <div className={styles.floorInput}>
                        <input
                            autoFocus
                            placeholder="Nombre del piso"
                            value={newFloorName}
                            onChange={e => setNewFloorName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleAddFloor();
                                if (e.key === 'Escape') { setIsAddingFloor(false); setNewFloorName(''); }
                            }}
                        />
                        <button
                            onClick={handleAddFloor}
                            style={{ background: 'var(--success-color)', color: 'white', borderRadius: '6px', padding: '0.4rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={() => { setIsAddingFloor(false); setNewFloorName(''); }}
                            style={{ background: 'var(--danger-color)', color: 'white', borderRadius: '6px', padding: '0.4rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        className={styles.addFloorBtn}
                        onClick={() => setIsAddingFloor(true)}
                    >
                        <Plus size={14} /> Piso
                    </button>
                )}

                {/* Delete floor button (only non-default, empty floors) */}
                {currentFloor !== DEFAULT_FLOOR && getFloorCount(currentFloor) === 0 && (
                    <button
                        onClick={() => handleDeleteFloor(currentFloor)}
                        style={{
                            background: 'rgba(230, 57, 70, 0.1)',
                            color: 'var(--danger-color)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.4rem 0.7rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            whiteSpace: 'nowrap',
                            fontFamily: 'var(--font-family)',
                        }}
                    >
                        <Trash2 size={12} /> Eliminar piso
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarTitle}>
                    <h3>
                        <Table2 size={18} style={{ verticalAlign: 'middle', marginRight: '0.4rem', color: 'var(--primary-color)' }} />
                        {currentFloor}
                    </h3>
                    <p>{floorTables.length} mesa{floorTables.length !== 1 ? 's' : ''} en este piso</p>
                </div>

                <form onSubmit={handleAddTable} className={styles.addForm}>
                    <input
                        type="number"
                        placeholder="N° Mesa"
                        value={newTableNumber}
                        onChange={e => setNewTableNumber(e.target.value)}
                        min="1"
                        style={{ width: '90px' }}
                    />
                    <input
                        type="number"
                        placeholder="Capacidad"
                        value={newTableCapacity}
                        onChange={e => setNewTableCapacity(e.target.value)}
                        min="1"
                        style={{ width: '100px' }}
                    />
                    <Button
                        type="submit"
                        disabled={!newTableNumber || isCreating}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.55rem 1rem',
                            fontWeight: '700',
                        }}
                    >
                        <Plus size={16} /> Agregar
                    </Button>
                </form>
            </div>

            {/* Table Grid */}
            {floorTables.length > 0 ? (
                <div className={styles.tableGrid}>
                    {floorTables.map(table => (
                        <div
                            key={table.id}
                            className={`${styles.tableItem} ${table.status === 'free' ? styles.tableItemFree : styles.tableItemOccupied}`}
                            onClick={() => handleOpenEdit(table)}
                        >
                            {/* Action buttons */}
                            <div className={styles.tableActions}>
                                <button
                                    className={`${styles.actionBtn} ${styles.editBtn}`}
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(table); }}
                                    title="Editar mesa"
                                >
                                    <Pencil size={13} />
                                </button>
                                <button
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.number); }}
                                    title="Eliminar mesa"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            <div className={styles.tableNumber}>{table.number}</div>

                            {table.label && (
                                <div className={styles.tableLabel}>{table.label}</div>
                            )}

                            {table.capacity && (
                                <div className={styles.tableCapacity}>
                                    <Users size={12} /> {table.capacity}
                                </div>
                            )}

                            <div className={`${styles.tableStatus} ${table.status === 'free' ? styles.statusFree : styles.statusOccupied}`}>
                                {table.status === 'free' ? 'Libre' : 'Ocupada'}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <Table2 size={48} strokeWidth={1} style={{ opacity: 0.25 }} />
                    <h4>No hay mesas en "{currentFloor}"</h4>
                    <p>Agrega una mesa usando el formulario de arriba.</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingTable && (
                <div
                    className={styles.modalOverlay}
                    onClick={(e) => { if (e.target === e.currentTarget) setEditingTable(null); }}
                >
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Editar Mesa {editingTable.number}</h3>
                            <button
                                className={styles.modalCloseBtn}
                                onClick={() => setEditingTable(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Número de Mesa</label>
                                <input
                                    type="number"
                                    value={editingTable.number}
                                    onChange={e => setEditingTable({ ...editingTable, number: parseInt(e.target.value, 10) || 0 })}
                                    min="1"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Capacidad (personas)</label>
                                <input
                                    type="number"
                                    value={editingTable.capacity}
                                    onChange={e => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value, 10) || 1 })}
                                    min="1"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Etiqueta (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Ventana, Terraza, VIP"
                                    value={editingTable.label}
                                    onChange={e => setEditingTable({ ...editingTable, label: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Piso</label>
                                <select
                                    value={editingTable.floor}
                                    onChange={e => setEditingTable({ ...editingTable, floor: e.target.value })}
                                >
                                    {floorNames.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <Button
                                variant="ghost"
                                onClick={() => setEditingTable(null)}
                                style={{ fontWeight: '600' }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    fontWeight: '700',
                                }}
                            >
                                <Check size={16} /> {isSaving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
