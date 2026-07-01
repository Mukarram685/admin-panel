import React from 'react';
import styles from './Modal.module.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
}

export default function Modal({ isOpen, onClose, title, children, width }: Props) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} style={width ? { maxWidth: width } : {}} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <button className={styles.close} onClick={onClose}>&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
}
