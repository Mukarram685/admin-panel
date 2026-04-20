"use client";
import { useEffect, useState } from "react";
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
            await fetchAPI(`/company/approve/${id}`, {
                method: "PUT",
                body: JSON.stringify({ action }),
            });
            loadCompanies();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const columns = [
        { key: "name", header: "Company Name" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { 
            key: "status", 
            header: "Status",
            render: (row: any) => (
                <span className={`badge ${row.status === 'approved' ? 'badge-success' : row.status === 'pending' ? 'badge-primary' : 'badge-error'}`}>
                    {row.status}
                </span>
            )
        },
        {
            key: "actions",
            header: "Actions",
            render: (row: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {row.status === "pending" && (
                        <>
                            <button className="btn-primary btn-sm" onClick={() => handleAction(row._id, "approve")}>Approve</button>
                            <button className="btn-secondary btn-sm" onClick={() => handleAction(row._id, "reject")}>Reject</button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Company Management</h1>
                <p className={styles.subtitle}>Review and manage bus company partnerships.</p>
                {error && <p className={styles.error}>{error}</p>}
            </header>

            <div className={styles.content}>
                <DataTable 
                    title="Registered Companies" 
                    columns={columns} 
                    data={companies} 
                    loading={loading}
                />
            </div>
        </main>
    );
}
