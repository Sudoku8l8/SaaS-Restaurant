import { type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    fullWidth?: boolean;
}

export function Input({
    label,
    error,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    id,
    ...props
}: InputProps) {
    const inputId = id || props.name;

    const containerClasses = [
        styles.container,
        fullWidth ? styles.fullWidth : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            {label && (
                <label htmlFor={inputId} className={styles.label}>
                    {label}
                </label>
            )}

            <div className={styles.inputWrapper}>
                {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}

                <input
                    id={inputId}
                    className={`${styles.input} ${error ? styles.hasError : ''} ${leftIcon ? styles.hasLeftIcon : ''} ${rightIcon ? styles.hasRightIcon : ''}`}
                    {...props}
                />

                {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
            </div>

            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
}
