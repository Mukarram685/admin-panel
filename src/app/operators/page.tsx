"use client";
import { useEffect, useState } from "react";
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
            setOperators(response.operators);
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
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { 
            key: "operatorType", 
            header: "Type",
            render: (row: Operator) => (
                <span style={{ textTransform: 'capitalize' }}>
                    {row.operatorType?.replace('_', ' ') || 'N/A'}
                </span>
            )
        },
        { 
            key: "status", 
            header: "Status",
            render: (row: Operator) => (
                <span className={`status-badge ${row.status}`}>
                    {row.status}
                </span>
            )
        },
        {
            key: "actions",
            header: "Actions",
            render: (row: Operator) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {row.status === "pending" && (
                        <button 
                            onClick={() => handleStatusUpdate(row._id, "approve")}
                            className="btn-success-sm"
                        >
                            Approve
                        </button>
                    )}
                    <button 
                        onClick={() => openScopeModal(row)}
                        className="btn-primary-sm"
                    >
                        Manage Scope
                    </button>
                </div>
            )
        }
    ];

    return (
        <main className="page-container">
            <DataTable
                title="Company Operators"
                columns={columns}
                data={operators}
                loading={loading}
                actionButton={
                    <button onClick={openAddOperatorModal} className="btn-primary">
                        Add New Operator
                    </button>
                }
            />

            {/* Registration Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Register New Operator"
            >
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            required
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            required
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            required
                            className="form-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Phone Number</label>
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
                        <label>Operator Type</label>
                        <select
                            className="form-input"
                            value={formData.operatorType}
                            onChange={(e) => setFormData({ ...formData, operatorType: e.target.value })}
                        >
                            <option value="trip_operator">Trip Operator</option>
                            <option value="city_manager">City Manager</option>
                            <option value="company_manager">Company Manager</option>
                        </select>
                    </div>
                    {user?.role === "superadmin" && (
                        <div className="form-group">
                            <label>Company</label>
                            <select
                                className="form-input"
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
                    {error && <p className="error-text">{error}</p>}
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                        Register Operator
                    </button>
                </form>
            </Modal>

            {/* Scope Management Modal */}
            <Modal
                isOpen={isScopeModalOpen}
                onClose={() => setIsScopeModalOpen(false)}
                title={`Manage Scope: ${selectedOperator?.name}`}
            >
                <form onSubmit={handleScopeUpdate}>
                    <div className="form-group">
                        <label>Operator Type</label>
                        <select
                            className="form-input"
                            value={scopeData.operatorType}
                            onChange={(e) => setScopeData({ ...scopeData, operatorType: e.target.value })}
                        >
                            <option value="trip_operator">Trip Operator</option>
                            <option value="city_manager">City Manager</option>
                            <option value="company_manager">Company Manager</option>
                        </select>
                    </div>
                    
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
                        Note: Further granular city/bus/schedule assignment can be added here.
                    </p>

                    {error && <p className="error-text">{error}</p>}
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                        Update Scope
                    </button>
                </form>
            </Modal>

            <style jsx>{`
                .page-container {
                    padding: 24px;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                }
                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid var(--card-border);
                    border-radius: 10px;
                    color: white;
                    outline: none;
                }
                .error-text {
                    color: #ef4444;
                    font-size: 13px;
                    margin-top: 8px;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: capitalize;
                }
                .status-badge.approved { background: rgba(16, 185, 129, 0.2); color: #10b981; }
                .status-badge.pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
                .status-badge.rejected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
                
                .btn-success-sm {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-success-sm:hover { background: rgba(16, 185, 129, 0.2); }
                
                .btn-primary-sm {
                    background: rgba(79, 70, 229, 0.1);
                    color: #818cf8;
                    border: 1px solid rgba(79, 70, 229, 0.2);
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-primary-sm:hover { background: rgba(79, 70, 229, 0.2); }
            `}</style>
        </main>
    );
}
