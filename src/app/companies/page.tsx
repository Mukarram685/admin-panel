"use client";
import { useEffect, useState } from "react";
import { Check, X, CheckCircle2, Clock, AlertCircle, Building2 } from "lucide-react";
import { fetchAPI } from "@/utils/api";
import DataTable from "@/component/DataTable/DataTable";
import styles from "./page.module.css";

export default function Companies() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const res = await fetchAPI("/companies/list");
            setCompanies(res.companies || []);
        } catch (err: any) {
            setError(err.message || "Failed to load companies");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        if (!confirm(`Are you sure you want to ${action} this company?`)) return;
        try {
            await fetchAPI(`/companies/approve/${id}`, {
                method: "PUT",
                body: JSON.stringify({ action }),
            });
            loadCompanies();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const columns = [
        { 
            key: "name", 
            header: "Company Name",
            render: (row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={15} color="var(--primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{row.name}</span>
                </div>
            )
        },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { 
            key: "status", 
            header: "Status",
            render: (row: any) => (
                <span className={`badge ${row.status === 'approved' ? 'badge-success' : row.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                    {row.status === 'approved' && <CheckCircle2 size={11} />}
                    {row.status === 'pending' && <Clock size={11} />}
                    {row.status === 'rejected' && <AlertCircle size={11} />}
                    <span>{row.status}</span>
                </span>
            )
        },
        {
            key: "actions",
            header: "Actions",
            render: (row: any) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                    {row.status === "pending" ? (
                        <>
                            <button className="btn-icon-success" onClick={() => handleAction(row._id, "approve")} title="Approve Registration">
                                <Check size={13} />
                                <span>Approve</span>
                            </button>
                            <button className="btn-icon-danger" onClick={() => handleAction(row._id, "reject")} title="Reject Registration">
                                <X size={13} />
                                <span>Reject</span>
                            </button>
                        </>
                    ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No actions pending</span>
                    )}
                </div>
            )
        }
    ];

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Company Management</h1>
                <p className={styles.subtitle}>Review registrations and partner transit operators across networks.</p>
                {error && <p className={styles.error}>{error}</p>}
            </header>

            <div className={styles.content}>
                <DataTable 
                    title="Registered Transport Operators" 
                    columns={columns} 
                    data={companies} 
                    loading={loading}
                />
            </div>
        </main>
    );
}
