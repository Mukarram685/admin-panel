import React from 'react';
import { Loader2, Inbox } from 'lucide-react';
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
        <div className={`glass ${styles.container}`}>
            <div className={styles.headerRow}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>{title}</h2>
                    {!loading && (
                        <span className={styles.countBadge}>
                            {data.length} {data.length === 1 ? 'record' : 'records'}
                        </span>
                    )}
                </div>
                {actionButton && <div className={styles.actionSlot}>{actionButton}</div>}
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
                                <td colSpan={columns.length} className={styles.empty}>
                                    <div className={styles.loadingBox}>
                                        <Loader2 size={24} className={styles.spinIcon} />
                                        <span>Loading operational records...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className={styles.empty}>
                                    <div className={styles.emptyBox}>
                                        <Inbox size={32} className={styles.emptyIcon} />
                                        <span>No matching records found.</span>
                                    </div>
                                </td>
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
