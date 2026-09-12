"use client";
import { useEffect, useState } from "react";
import {
    UserPlus,
    UserCheck,
    Sliders,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Mail,
    Lock,
    Phone,
    Building2,
    Check
} from "lucide-react";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";
import { fetchAPI } from "@/utils/api";

interface Operator {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    operatorType: string;
    operatorScope: {
        cities: string[];
        buses: string[];
        schedules: string[];
    };
}

export default function OperatorsPage() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
    const [error, setError] = useState("");
    const [user, setUser] = useState<any>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phoneNumber: "",
        operatorType: "trip_operator",
    });

    const [scopeData, setScopeData] = useState({
        operatorType: "trip_operator",
        operatorScope: {
            cities: [] as string[],
            buses: [] as string[],
            schedules: [] as string[],
        }
    });

    const fetchOperators = async () => {
        try {
            setLoading(true);
            const response = await fetchAPI("/operator/company");
            setOperators(response.operators || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch operators");
        } finally {
            setLoading(false);
        }
    };

    const getCompanyId = (u: any) => {
        if (!u || !u.company) return "";
        if (typeof u.company === "object" && u.company !== null) {
            return u.company._id || u.company.id || "";
        }
        return typeof u.company === "string" ? u.company : "";
    };

    const openAddOperatorModal = () => {
        setError("");
        setIsModalOpen(true);
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
                
                // SECURITY: ONLY Superadmin loads the full company list
                if (userData.role === "superadmin") {
                    fetchAPI("/companies/list")
                        .then(res => {
                            setCompanies(res.companies || []);
                        })
                        .catch(err => console.error("Failed to load companies:", err));
                }
            } catch (e) {
                console.error("Failed to parse user session");
            }
        }
        fetchOperators();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) throw new Error("User session not found");
            const userData = JSON.parse(userStr);
            
            let companyId = "";
            if (userData.role === "superadmin") {
                if (!selectedCompanyId) {
                    throw new Error("Please select a company for the operator");
                }
                companyId = selectedCompanyId;
            } else {
                companyId = getCompanyId(userData);
            }

            if (!companyId) {
                throw new Error("Your user account is not associated with any company. Please contact Superadmin.");
            }

            await fetchAPI("/register", {
                method: "POST",
                body: JSON.stringify({ 
                    ...formData, 
                    role: "operator", 
                    company: companyId 
                }),
            });
            setIsModalOpen(false);
            setFormData({ name: "", email: "", password: "", phoneNumber: "", operatorType: "trip_operator" });
            if (userData.role === "superadmin") setSelectedCompanyId("");
            fetchOperators();
        } catch (err: any) {
            setError(err.message || "Failed to register operator");
        }
    };

    const handleStatusUpdate = async (id: string, action: "approve" | "reject") => {
        try {
            await fetchAPI(`/operator/approve/${id}`, {
                method: "PUT",
                body: JSON.stringify({ action }),
            });
            fetchOperators();
        } catch (err: any) {
            alert(err.message || "Failed to update status");
        }
    };

    const handleScopeUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOperator) return;
        setError("");
        try {
            await fetchAPI(`/operator/scope/${selectedOperator._id}`, {
                method: "PUT",
                body: JSON.stringify(scopeData),
            });
            setIsScopeModalOpen(false);
            fetchOperators();
        } catch (err: any) {
            setError(err.message || "Failed to update scope");
        }
    };

    const openScopeModal = (op: Operator) => {
        setSelectedOperator(op);
        setScopeData({
            operatorType: op.operatorType || "trip_operator",
            operatorScope: {
                cities: op.operatorScope?.cities || [],
                buses: op.operatorScope?.buses || [],
                schedules: op.operatorScope?.schedules || [],
            }
        });
        setIsScopeModalOpen(true);
    };

    const columns = [
        { 
            key: "name", 
            header: "Name",
            render: (row: Operator) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                        <User size={14} />
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{row.name}</span>
                </div>
            )
        },
        { key: "email", header: "Email" },
        { 
            key: "operatorType", 
            header: "Duty Type",
            render: (row: Operator) => (
                <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                    {row.operatorType?.replace('_', ' ') || 'Trip Operator'}
                </span>
            )
        },
        { 
            key: "status", 
            header: "Status",
            render: (row: Operator) => (
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
            render: (row: Operator) => {
                const canManageScope = user?.role === "superadmin" || user?.role === "companyadmin" || user?.operatorType === "company_manager";
                return (
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {canManageScope && row.status === "pending" && (
                            <button 
                                onClick={() => handleStatusUpdate(row._id, "approve")}
                                className="btn-icon-success"
                                title="Approve Staff"
                            >
                                <Check size={13} />
                                <span>Approve</span>
                            </button>
                        )}
                        {canManageScope && (
                            <button 
                                onClick={() => openScopeModal(row)}
                                className="btn-icon-primary"
                                title="Manage Scope"
                            >
                                <Sliders size={13} />
                                <span>Scope</span>
                            </button>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <main className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        {user?.operatorType === "city_manager" ? "Terminal Crew Directory" : "Operator Staff Directory"}
                    </h1>
                    <p className="page-subtitle">
                        {user?.operatorType === "city_manager" 
                            ? `Manage local drivers and conductors for ${user?.operatorScope?.cities?.join(", ") || "your terminal"}.`
                            : "Manage driver assignments, city managers, and crew credentials."}
                    </p>
                </div>
                <button onClick={openAddOperatorModal} className="btn-primary">
                    <UserPlus size={15} />
                    <span>{user?.operatorType === "city_manager" ? "Register New Conductor/Driver" : "Register New Operator"}</span>
                </button>
            </header>

            <DataTable
                title={user?.operatorType === "city_manager" ? "Station Personnel" : "Active Personnel"}
                columns={columns}
                data={operators}
                loading={loading}
            />

            {/* Registration Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={user?.operatorType === "city_manager" ? "Register Terminal Driver / Conductor" : "Register New Operator"}
            >
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            required
                            className="form-input"
                            placeholder="operator@domain.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            required
                            className="form-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="e.g. 03001234567"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Operator Designation</label>
                        {user?.operatorType === "city_manager" ? (
                            <input 
                                type="text" 
                                readOnly 
                                className="form-input" 
                                value={`Trip Operator (Conductor/Driver) - ${user?.operatorScope?.cities?.join(", ") || "Assigned City"}`} 
                            />
                        ) : (
                            <select
                                className="form-select"
                                value={formData.operatorType}
                                onChange={(e) => setFormData({ ...formData, operatorType: e.target.value })}
                            >
                                <option value="trip_operator">Trip Operator (Conductor/Driver)</option>
                                <option value="city_manager">City Terminal Manager</option>
                                <option value="company_manager">Company Dispatch Manager</option>
                            </select>
                        )}
                    </div>
                    {user?.role === "superadmin" && (
                        <div className="form-group">
                            <label className="form-label">Company Affiliation</label>
                            <select
                                className="form-select"
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                required
                            >
                                <option value="">Select a Company</option>
                                {companies.map((c: any) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {error && <div className="error-text">{error}</div>}
                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">
                            <UserPlus size={15} />
                            <span>Register Operator</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Scope Management Modal */}
            <Modal
                isOpen={isScopeModalOpen}
                onClose={() => setIsScopeModalOpen(false)}
                title={`Manage Staff Scope: ${selectedOperator?.name}`}
            >
                <form onSubmit={handleScopeUpdate}>
                    <div className="form-group">
                        <label className="form-label">Assigned Duty Designation</label>
                        <select
                            className="form-select"
                            value={scopeData.operatorType}
                            onChange={(e) => setScopeData({ ...scopeData, operatorType: e.target.value })}
                        >
                            <option value="trip_operator">Trip Operator</option>
                            <option value="city_manager">City Terminal Manager</option>
                            <option value="company_manager">Company Operations Manager</option>
                        </select>
                    </div>
                    
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.5 }}>
                        Duty scopes determine system route authorizations and schedule dispatch permissions.
                    </p>

                    {error && <div className="error-text">{error}</div>}
                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsScopeModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">
                            <Sliders size={15} />
                            <span>Save Scope</span>
                        </button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .page-container {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;
                    box-sizing: border-box;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    gap: 16px;
                    flex-wrap: wrap;
                    box-sizing: border-box;
                }
                .page-title {
                    font-size: clamp(20px, 3.5vw, 26px);
                    font-weight: 800;
                    margin: 0;
                    color: var(--foreground);
                    letter-spacing: -0.025em;
                    line-height: 1.2;
                }
                .page-subtitle {
                    color: var(--text-muted);
                    margin: 6px 0 0 0;
                    font-size: clamp(12px, 2vw, 13px);
                    line-height: 1.5;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 24px;
                    flex-wrap: wrap;
                }
                @media (max-width: 480px) {
                    .modal-actions {
                        flex-direction: column-reverse;
                        width: 100%;
                    }
                    .modal-actions button {
                        width: 100%;
                    }
                }
                .error-text {
                    background: var(--danger-light);
                    color: var(--danger);
                    padding: 10px 14px;
                    border-radius: var(--radius-md);
                    font-size: 13px;
                    margin-top: 14px;
                    border: 1px solid rgba(239, 68, 68, 0.25);
                }
                @media (max-width: 640px) {
                    .page-container {
                        gap: 18px;
                    }
                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 14px;
                    }
                    .page-header button {
                        width: 100%;
                    }
                }
            `}</style>
        </main>
    );
}
