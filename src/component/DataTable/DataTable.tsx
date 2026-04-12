import React from 'react';
import styles from './DataTable.module.css';

interface Column {
    key: string;
    header: string;
    render?: (row: any) => React.ReactNode;
}

interface Props {
    title: string;
    columns: Column[];
    data: any[];
    loading?: boolean;
    actionButton?: React.ReactNode;
    onRowClick?: (row: any) => void;
}

export default function DataTable({ title, columns, data, loading, actionButton, onRowClick }: Props) {
    return (
        <div className="glass glass-card" style={{ padding: '24px' }}>
            <div className={styles.headerRow}>
                <h2 className={styles.title}>{title}</h2>
                {actionButton && <div>{actionButton}</div>}
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col.key} className={styles.th}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className={styles.empty}>Loading data...</td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className={styles.empty}>No records found.</td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr key={i} className={styles.tr} onClick={() => onRowClick?.(row)} style={onRowClick ? { cursor: 'pointer' } : {}}>
                                    {columns.map(col => (
                                        <td key={col.key} className={styles.td}>
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
