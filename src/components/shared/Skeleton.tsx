import styles from './Skeleton.module.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({ width, height, borderRadius, className = '', style: customStyle = {} }: SkeletonProps) {
    const style = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...customStyle
    };

    return <div className={`${styles.skeleton} ${className}`} style={style} />;
}

export function OrderCardSkeleton() {
    return (
        <div className={styles.orderCardSkeleton}>
            <div className={styles.header}>
                <Skeleton width="60%" height={24} />
                <Skeleton width="30%" height={20} />
            </div>
            <div className={styles.content}>
                <Skeleton width="100%" height={16} />
                <Skeleton width="80%" height={16} />
            </div>
            <div className={styles.footer}>
                <Skeleton width="40%" height={32} borderRadius={8} />
            </div>
        </div>
    );
}

export function TableSkeleton() {
    return (
        <div className={styles.tableSkeleton}>
            <Skeleton width="100%" height="100%" borderRadius="var(--radius-lg)" />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <Skeleton width="200px" height={32} borderRadius={8} style={{ marginBottom: '1.5rem' }} />
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
            }}>
                <Skeleton height={120} borderRadius="var(--radius-lg)" />
                <Skeleton height={120} borderRadius="var(--radius-lg)" />
                <Skeleton height={120} borderRadius="var(--radius-lg)" />
            </div>
        </div>
    );
}
