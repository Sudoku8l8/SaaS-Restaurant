import styles from './Badge.module.css';

export interface BadgeProps {
    label: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'neutral', size = 'md' }: BadgeProps) {
    return (
        <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`}>
            {label}
        </span>
    );
}
