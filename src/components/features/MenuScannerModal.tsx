import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Sparkles, CheckSquare, Square, Trash2, Plus, AlertCircle, Loader2, Check } from 'lucide-react';
import { parseMenuImage, type ExtractedProductItem } from '@/services/ai/menuParserService';
import { db } from '@/services/firebase/config';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/shared';

interface MenuScannerModalProps {
    onClose: () => void;
    onImportSuccess: () => void;
    existingCategories: string[];
}

export function MenuScannerModal({ onClose, onImportSuccess, existingCategories }: MenuScannerModalProps) {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'saving'>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [extractedItems, setExtractedItems] = useState<ExtractedProductItem[]>([]);
    const [detectedCategories, setDetectedCategories] = useState<string[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>('Todas');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [importingCount, setImportingCount] = useState<number>(0);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setErrorMessage('Por favor selecciona un archivo de imagen (JPG, PNG, WebP).');
            return;
        }
        setErrorMessage(null);
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const startProcessing = async () => {
        if (!selectedFile) return;

        setStep('processing');
        setErrorMessage(null);

        try {
            const result = await parseMenuImage(selectedFile);
            setExtractedItems(result.items);
            setDetectedCategories(result.categories);
            setStep('review');
        } catch (err: any) {
            console.error('Error parsing menu image:', err);
            setErrorMessage(err.message || 'Error al analizar la foto de la carta');
            setStep('upload');
        }
    };

    const handleToggleSelectAll = () => {
        const allSelected = extractedItems.every(i => i.selected);
        setExtractedItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
    };

    const handleToggleItem = (id: string) => {
        setExtractedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
    };

    const handleItemChange = (id: string, field: keyof ExtractedProductItem, value: any) => {
        setExtractedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleDeleteItem = (id: string) => {
        setExtractedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleAddManualItem = () => {
        const newItem: ExtractedProductItem = {
            id: `manual-${Date.now()}`,
            name: '',
            price: 0,
            category: detectedCategories[0] || existingCategories[0] || 'General',
            description: '',
            selected: true,
        };
        setExtractedItems(prev => [...prev, newItem]);
    };

    const handleExecuteImport = async () => {
        const itemsToImport = extractedItems.filter(i => i.selected && i.name.trim() !== '');
        if (itemsToImport.length === 0) {
            setErrorMessage('Selecciona al menos un producto válido para importar.');
            return;
        }

        if (!user?.restaurantId) {
            setErrorMessage('Error: Restaurante no identificado.');
            return;
        }

        setStep('saving');
        setImportingCount(itemsToImport.length);

        try {
            const restaurantId = user.restaurantId;

            // 1. Check existing categories in Firestore to avoid duplicate creation
            const catsQuery = query(collection(db, 'categories'), where('restaurantId', '==', restaurantId));
            const catsSnap = await getDocs(catsQuery);
            const existingCatNames = new Set(catsSnap.docs.map(d => d.data().name.trim().toLowerCase()));

            // Find categories from extracted items that need to be created
            const categoriesNeeded = new Set<string>();
            itemsToImport.forEach(item => {
                if (item.category && item.category.trim() !== '') {
                    categoriesNeeded.add(item.category.trim());
                }
            });

            // Batch write for categories and products
            const batch = writeBatch(db);

            for (const catName of categoriesNeeded) {
                if (!existingCatNames.has(catName.toLowerCase())) {
                    const catRef = doc(collection(db, 'categories'));
                    batch.set(catRef, {
                        restaurantId,
                        name: catName,
                        createdAt: new Date(),
                    });
                }
            }

            // Create products
            for (const item of itemsToImport) {
                const prodRef = doc(collection(db, 'products'));
                batch.set(prodRef, {
                    restaurantId,
                    name: item.name.trim(),
                    price: item.price || 0,
                    category: item.category.trim() || 'General',
                    description: item.description.trim(),
                    available: true,
                    controlaStock: false,
                    tipoInventario: 'product',
                    unidadMedida: 'unidad',
                    createdAt: new Date(),
                });
            }

            await batch.commit();

            onImportSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error importing items:', err);
            setErrorMessage('Error al guardar los productos en la base de datos: ' + (err.message || ''));
            setStep('review');
        }
    };

    const visibleItems = extractedItems.filter(i => filterCategory === 'Todas' || i.category === filterCategory);
    const selectedCount = extractedItems.filter(i => i.selected).length;

    const allCategoriesForFilter = ['Todas', ...Array.from(new Set([...detectedCategories, ...existingCategories]))];

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto'
        }}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: step === 'review' ? '960px' : '520px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--glass-bg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, var(--accent-copper, #b87333), var(--secondary-color))',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Carga de Carta por Foto (IA)
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Extrae automáticamente categorías, platos y precios
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '50%'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div style={{
                        padding: '0.85rem 1.25rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                        color: 'var(--danger-color)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Modal Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {/* STEP 1: Upload */}
                    {step === 'upload' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '2.5rem 1.5rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: previewUrl ? `url(${previewUrl}) center/cover no-repeat` : 'var(--background-color)',
                                    minHeight: '220px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {previewUrl && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0, 0, 0, 0.45)',
                                        backdropFilter: 'blur(2px)'
                                    }} />
                                )}

                                <div style={{
                                    zIndex: 1,
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    background: 'var(--surface-color)',
                                    boxShadow: 'var(--shadow-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary-color)'
                                }}>
                                    <Upload size={26} />
                                </div>

                                <div style={{ zIndex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: previewUrl ? 'white' : 'var(--text-primary)' }}>
                                        {selectedFile ? selectedFile.name : 'Haz clic o arrastra la foto de tu carta'}
                                    </p>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: previewUrl ? '#e2e8f0' : 'var(--text-secondary)' }}>
                                        Formatos soportados: JPG, PNG, WebP
                                    </p>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            />

                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            />

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button
                                    variant="outline"
                                    onClick={() => cameraInputRef.current?.click()}
                                    style={{ flex: 1 }}
                                >
                                    📷 Usar Cámara
                                </Button>
                                <Button
                                    variant="primary"
                                    disabled={!selectedFile}
                                    onClick={startProcessing}
                                    style={{ flex: 1 }}
                                >
                                    ✨ Escanear con IA
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Processing */}
                    {step === 'processing' && (
                        <div style={{
                            padding: '3rem 1.5rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1.25rem'
                        }}>
                            <Loader2 size={48} className="spin" style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    Analizando la carta con IA...
                                </h4>
                                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Identificando secciones, platos y precios automáticamente
                                </p>
                            </div>
                            <style>{`
                                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                            `}</style>
                        </div>
                    )}

                    {/* STEP 3: Review Table */}
                    {step === 'review' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Summary & Toolbar */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                                background: 'var(--background-color)',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button
                                        onClick={handleToggleSelectAll}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        {extractedItems.every(i => i.selected) ? <CheckSquare size={18} color="var(--primary-color)" /> : <Square size={18} />}
                                        <span>Seleccionar Todos ({selectedCount}/{extractedItems.length})</span>
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filtrar:</span>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--surface-color)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {allCategoriesForFilter.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Editable Items Table */}
                            <div style={{
                                maxHeight: '420px',
                                overflowY: 'auto',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--surface-color)'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{
                                            background: 'var(--background-color)',
                                            borderBottom: '1px solid var(--border-color)',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 10
                                        }}>
                                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: '40px' }}>✓</th>
                                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Producto</th>
                                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', width: '150px' }}>Categoría</th>
                                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', width: '100px' }}>Precio (S/)</th>
                                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: '40px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleItems.map((item) => (
                                            <tr key={item.id} style={{
                                                borderBottom: '1px solid var(--divider-color)',
                                                opacity: item.selected ? 1 : 0.4,
                                                background: item.selected ? 'transparent' : 'var(--background-color)'
                                            }}>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={item.selected}
                                                        onChange={() => handleToggleItem(item.id)}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                        placeholder="Nombre del producto"
                                                        style={{
                                                            width: '100%',
                                                            padding: '4px 8px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            background: 'var(--surface-color)',
                                                            color: 'var(--text-primary)',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        value={item.category}
                                                        onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                                                        placeholder="Categoría"
                                                        list="categories-datalist"
                                                        style={{
                                                            width: '100%',
                                                            padding: '4px 8px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            background: 'var(--surface-color)',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.5rem' }}>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={item.price}
                                                        onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '4px 8px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            background: 'var(--surface-color)',
                                                            color: 'var(--text-primary)',
                                                            textAlign: 'right',
                                                            fontWeight: 700
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--danger-color)',
                                                            cursor: 'pointer',
                                                            padding: '4px'
                                                        }}
                                                        title="Eliminar ítem"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {visibleItems.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                    No hay productos en esta categoría
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                <datalist id="categories-datalist">
                                    {detectedCategories.map(c => <option key={c} value={c} />)}
                                    {existingCategories.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>

                            {/* Add Manual Row Button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    onClick={handleAddManualItem}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        background: 'transparent',
                                        border: '1px dashed var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '0.4rem 0.75rem',
                                        color: 'var(--primary-color)',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    <Plus size={14} /> Agregar Producto Manual
                                </button>

                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                    {selectedCount} plato{selectedCount !== 1 ? 's' : ''} listo{selectedCount !== 1 ? 's' : ''} para importar
                                </span>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Saving */}
                    {step === 'saving' && (
                        <div style={{
                            padding: '3rem 1.5rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1.25rem'
                        }}>
                            <Loader2 size={48} className="spin" style={{ color: 'var(--success-color)', animation: 'spin 1s linear infinite' }} />
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    Guardando {importingCount} productos en tu catálogo...
                                </h4>
                                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Creando categorías e insertando platos en la base de datos
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                {step === 'review' && (
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--glass-bg)'
                    }}>
                        <Button variant="outline" onClick={() => setStep('upload')}>
                            ← Subir Otra Foto
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleExecuteImport}
                            disabled={selectedCount === 0}
                        >
                            <Check size={18} /> Guardar {selectedCount} Productos en el Catálogo
                        </Button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
