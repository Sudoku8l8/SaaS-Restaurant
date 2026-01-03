import { type HTMLAttributes, type ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    title?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    footer?: ReactNode;
    // onClick is already in HTMLAttributes
}

export function Card({
    children,
    className = '',
    title,
    padding = 'md',
    footer,
    onClick,
    ...props
}: CardProps) {
    const cardClasses = [
        styles.card,
        styles[`padding-${padding}`],
        onClick ? styles.clickable : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={cardClasses} onClick={onClick} {...props}>
            {title && (
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                </div>
            )}
            <div className={styles.content}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
        </div>
    );
}
