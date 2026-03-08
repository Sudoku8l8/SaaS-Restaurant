import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, MapPin } from 'lucide-react';
import { useBranch } from '@/app/providers/BranchProvider';

export function BranchSelector() {
    const { currentBranch, allBranches, isMultiBranch, switchBranch } = useBranch();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // If not multi-branch or only one branch, don't render
    if (!isMultiBranch || allBranches.length <= 1) return null;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--divider-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 0 2px var(--primary-color)' : 'var(--shadow-sm)',
                }}
            >
                <Building2 size={16} color="var(--primary-color)" />
                <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentBranch?.name || 'Seleccionar local'}
                </span>
                <ChevronDown
                    size={14}
                    style={{
                        transition: 'transform 0.2s',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        color: 'var(--text-secondary)',
                    }}
                />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    minWidth: '240px',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--divider-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 100,
                    overflow: 'hidden',
                    animation: 'fadeInDropdown 0.15s ease-out',
                }}>
                    <div style={{
                        padding: '0.75rem 1rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid var(--divider-color)',
                    }}>
                        Sucursales
                    </div>
                    {allBranches.map((branch) => {
                        const isActive = branch.id === currentBranch?.id;
                        return (
                            <button
                                key={branch.id}
                                onClick={() => {
                                    switchBranch(branch.id);
                                    setIsOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: 'none',
                                    background: isActive ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    textAlign: 'left',
                                    transition: 'background 0.15s',
                                    borderBottom: '1px solid var(--divider-color)',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.03)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = isActive ? 'rgba(37, 99, 235, 0.06)' : 'transparent';
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: 'var(--radius-md)',
                                    background: isActive ? 'var(--primary-color)' : 'var(--background-color)',
                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <MapPin size={16} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? 'var(--primary-color)' : 'var(--text-primary)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {branch.name}
                                        {branch.isParent && (
                                            <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                                (Principal)
                                            </span>
                                        )}
                                    </div>
                                    {branch.address && (
                                        <div style={{
                                            fontSize: '0.78rem',
                                            color: 'var(--text-secondary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {branch.address}
                                        </div>
                                    )}
                                </div>
                                {isActive && <Check size={16} color="var(--primary-color)" />}
                            </button>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes fadeInDropdown {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
