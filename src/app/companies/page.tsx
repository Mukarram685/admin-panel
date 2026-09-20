"use client";
import { useEffect, useState } from "react";
import { 
    Check, 
    X, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Building2, 
    Key 
} from "lucide-react";
import { fetchAPI } from "@/utils/api";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";
import styles from "./page.module.css";

interface Company {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    status: "pending" | "approved" | "rejected";
    createdBy?: {
        _id?: string;
        name?: string;
        email?: string;
        role?: string;
        status?: string;
    };
    createdAt?: string;
}

export default function Companies() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState<any>(null);

    // Password reset modal state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [passwordData, setPasswordData] = useState({ newPassword: "", confirmPassword: "" });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

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
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) {
                console.error("Failed to parse user");
            }
        }
        loadCompanies();
    }, []);

    const handleStatusChange = async (id: string, newStatus: "approved" | "rejected" | "pending") => {
        const actionLabel = newStatus === "approved" ? "approve" : newStatus === "rejected" ? "reject" : "reset to pending";
        if (!confirm(`Are you sure you want to ${actionLabel} this company?`)) return;
        try {
            await fetchAPI(`/companies/status/${id}`, {
                method: "PUT",
                body: JSON.stringify({ status: newStatus }),
            });
            loadCompanies();
        } catch (err: any) {
            alert(err.message || "Failed to update company status");
        }
    };

    const openPasswordModal = (comp: Company) => {
        setSelectedCompany(comp);
        setPasswordData({ newPassword: "", confirmPassword: "" });
        setPasswordError("");
        setPasswordSuccess("");
        setIsPasswordModalOpen(true);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany) return;
        setPasswordError("");
        setPasswordSuccess("");

        if (passwordData.newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters long");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        try {
            setPasswordLoading(true);
            const res = await fetchAPI(`/companies/change-password/${selectedCompany._id}`, {
                method: "PUT",
                body: JSON.stringify({ newPassword: passwordData.newPassword }),
            });
            setPasswordSuccess(res.message || "Company password updated successfully!");
            setPasswordData({ newPassword: "", confirmPassword: "" });
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordSuccess("");
            }, 1500);
        } catch (err: any) {
            setPasswordError(err.message || "Failed to update company password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const canChangePassword = (comp: Company) => {
        if (!user) return false;
        if (user.role === "superadmin") return true;
        if (user.role === "companyadmin") {
            const compId = user.company ? (user.company._id || user.company) : "";
            return compId === comp._id;
        }
        return false;
    };

    const isSuperAdmin = user?.role === "superadmin";

    const columns = [
        { 
            key: "name", 
            header: "Company Name",
            render: (row: Company) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818cf8'
                    }}>
                        <Building2 size={15} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{row.name}</div>
                        {row.address && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.address}</div>
                        )}
                    </div>
                </div>
            )
        },
        { key: "email", header: "Company Email" },
        { key: "phone", header: "Phone", render: (row: Company) => row.phone || "—" },
        { 
            key: "adminAccount",
            header: "Admin Account",
            render: (row: Company) => {
                const admin = row.createdBy;
                if (!admin) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{admin.name || "Admin"}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{admin.email}</span>
                    </div>
                );
            }
        },
        { 
            key: "status", 
            header: "Status",
            render: (row: Company) => (
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
            render: (row: Company) => {
                return (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {isSuperAdmin && (
                            <>
                                {row.status !== "approved" && (
                                    <button 
                                        className="btn-icon-success" 
                                        onClick={() => handleStatusChange(row._id, "approved")} 
                                        title="Approve / Activate Company"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Check size={13} />
                                        <span>Approve</span>
                                    </button>
                                )}
                                {row.status !== "rejected" && (
                                    <button 
                                        className="btn-icon-danger" 
                                        onClick={() => handleStatusChange(row._id, "rejected")} 
                                        title="Reject / Suspend Company"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={13} />
                                        <span>Reject</span>
                                    </button>
                                )}
                            </>
                        )}
                        {canChangePassword(row) && (
                            <button 
                                onClick={() => openPasswordModal(row)}
                                className="btn-icon-warning"
                                title="Change Company Password"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    color: '#f59e0b',
                                    cursor: 'pointer'
                                }}
                            >
                                <Key size={13} />
                                <span>Password</span>
                            </button>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    {user?.role === "companyadmin" ? "Company Profile & Credentials" : "Company Management"}
                </h1>
                <p className={styles.subtitle}>
                    {user?.role === "companyadmin" 
                        ? "Manage your company profile, credentials, and partner status." 
                        : "Review registrations, adjust company statuses, and manage partner credentials across networks."}
                </p>
                {error && <p className={styles.error}>{error}</p>}
            </header>

            <div className={styles.content}>
                <DataTable 
                    title={user?.role === "companyadmin" ? "Company Information" : "Registered Transport Operators"} 
                    columns={columns} 
                    data={companies} 
                    loading={loading}
                />
            </div>

            {/* Change Company Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                }}
                title={`Change Password: ${selectedCompany?.name || ""}`}
            >
                <form onSubmit={handlePasswordSubmit}>
                    <div style={{
                        marginBottom: "16px",
                        padding: "12px 14px",
                        background: "rgba(255, 255, 255, 0.04)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.08)"
                    }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
                            {selectedCompany?.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                            {selectedCompany?.email}
                            {selectedCompany?.createdBy?.email && ` • Admin: ${selectedCompany.createdBy.email}`}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="form-input"
                            placeholder="Enter new password (min 6 characters)"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="form-input"
                            placeholder="Re-enter new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                    </div>

                    {passwordError && <div className="error-text">{passwordError}</div>}
                    {passwordSuccess && (
                        <div style={{
                            background: "rgba(34, 197, 94, 0.1)",
                            color: "#22c55e",
                            padding: "10px 14px",
                            borderRadius: "var(--radius-md, 8px)",
                            fontSize: "13px",
                            marginTop: "14px",
                            border: "1px solid rgba(34, 197, 94, 0.25)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}>
                            <CheckCircle2 size={15} />
                            <span>{passwordSuccess}</span>
                        </div>
                    )}

                    <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsPasswordModalOpen(false);
                                setPasswordError("");
                                setPasswordSuccess("");
                            }}
                            className="btn-secondary"
                            disabled={passwordLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={passwordLoading}
                        >
                            <Key size={15} />
                            <span>{passwordLoading ? "Updating..." : "Update Password"}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </main>
    );
}
