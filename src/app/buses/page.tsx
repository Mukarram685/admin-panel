"use client";
import { useEffect, useState } from "react";
import {
    Plus,
    Edit3,
    Trash2,
    BusFront,
    CheckCircle2,
    Sparkles,
    Users,
    Tag,
    Building2
} from "lucide-react";
import { fetchAPI } from "@/utils/api";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";

export default function BusesPage() {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBus, setSelectedBus] = useState<any>(null);
    const [error, setError] = useState("");

    const [user, setUser] = useState<any>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");

    const [formData, setFormData] = useState({
        busNumber: "",
        registrationNumber: "",
        type: "AC",
        totalSeats: 40,
        amenities: "",
    });

    const loadBuses = async () => {
        try {
            setLoading(true);
            const res = await fetchAPI("/buses/company");
            setBuses(res.buses || res.data || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
                if (userData.role === "superadmin") {
                    fetchAPI("/companies/list")
                        .then(res => setCompanies(res.companies || []))
                        .catch(err => console.error(err));
                }
            } catch (e) {
                console.error(e);
            }
        }
        loadBuses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            let companyId = selectedCompanyId;
            if (!companyId && user?.company) {
                companyId = typeof user.company === "object" ? (user.company._id || user.company.id) : user.company;
            }

            const bodyData = {
                ...formData,
                amenities: typeof formData.amenities === "string"
                    ? formData.amenities.split(',').map(s => s.trim()).filter(Boolean)
                    : formData.amenities,
                ...(companyId ? { company: companyId } : {})
            };
            
            const endpoint = selectedBus ? `/buses/${selectedBus._id}` : "/buses/add";
            const method = selectedBus ? "PUT" : "POST";

            await fetchAPI(endpoint, {
                method,
                body: JSON.stringify(bodyData),
            });

            setIsModalOpen(false);
            setFormData({ busNumber: "", registrationNumber: "", type: "AC", totalSeats: 40, amenities: "" });
            setSelectedBus(null);
            if (user?.role === "superadmin") setSelectedCompanyId("");
            loadBuses();
        } catch (err: any) {
            setError(err.message || "Operation failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bus from fleet?")) return;
        try {
            await fetchAPI(`/buses/${id}`, { method: "DELETE" });
            loadBuses();
        } catch (err: any) {
            alert(err.message || "Failed to delete bus");
        }
    };

    const openEditModal = (bus: any) => {
        setSelectedBus(bus);
        setFormData({
            busNumber: bus.busNumber || "",
            registrationNumber: bus.registrationNumber || "",
            type: bus.type || "AC",
            totalSeats: bus.totalSeats || 40,
            amenities: (bus.amenities || []).join(", "),
        });
        setIsModalOpen(true);
    };

    const columns = [
        { 
            key: "busNumber", 
            header: "Bus Number",
            render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                        <BusFront size={14} />
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{r.busNumber}</span>
                </div>
            )
        },
        { 
            key: "registrationNumber", 
            header: "Registration",
            render: (r: any) => <span className="badge badge-info">{r.registrationNumber}</span>
        },
        { 
            key: "type", 
            header: "Category",
            render: (r: any) => (
                <span className="badge badge-primary">
                    <Sparkles size={11} />
                    <span>{r.type}</span>
                </span>
            )
        },
        { 
            key: "totalSeats", 
            header: "Capacity", 
            render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                    <Users size={13} color="var(--text-secondary)" />
                    <span>{r.totalSeats} seats</span>
                </div>
            )
        },
        {
            key: "status", 
            header: "Status", 
            render: (r: any) => (
                <span className="badge badge-success">
                    <CheckCircle2 size={11} />
                    <span>{r.status || 'Active'}</span>
                </span>
            )
        },
        {
            key: "actions", 
            header: "Actions", 
            render: (r: any) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(r); }} 
                        className="btn-icon-primary"
                        title="Edit Bus"
                    >
                        <Edit3 size={13} />
                        <span>Edit</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }} 
                        className="btn-icon-danger"
                        title="Delete Bus"
                    >
                        <Trash2 size={13} />
                        <span>Delete</span>
                    </button>
                </div>
            )
        }
    ];

    return (
        <main className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Fleet Management</h1>
                    <p className="page-subtitle">Track vehicles, bus specifications, seating capacity, and configurations.</p>
                </div>
                <button 
                    onClick={() => { 
                        setSelectedBus(null); 
                        setFormData({ busNumber: "", registrationNumber: "", type: "AC", totalSeats: 40, amenities: "" }); 
                        setIsModalOpen(true); 
                    }} 
                    className="btn-primary"
                >
                    <Plus size={15} />
                    <span>Add New Bus</span>
                </button>
            </header>

            <DataTable 
                title="Active Bus Fleet" 
                columns={columns} 
                data={buses} 
                loading={loading} 
                onRowClick={openEditModal} 
            />

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedBus ? "Update Bus Details" : "Add New Bus to Fleet"}
            >
                <form onSubmit={handleSubmit}>
                    {error && <div className="error-text">{error}</div>}

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Bus Code / Number</label>
                            <input 
                                type="text" 
                                required 
                                className="form-input" 
                                value={formData.busNumber} 
                                onChange={e => setFormData({ ...formData, busNumber: e.target.value })} 
                                placeholder="e.g. B-101" 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Registration Number</label>
                            <input 
                                type="text" 
                                required 
                                className="form-input" 
                                value={formData.registrationNumber} 
                                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} 
                                placeholder="e.g. ABC-123" 
                            />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Category / Tier</label>
                            <select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="AC">AC Luxury</option>
                                <option value="Non-AC">Executive Economy</option>
                                <option value="Sleeper">Sleeper Coach</option>
                                <option value="Luxury">Premium Business</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Passenger Capacity (Seats)</label>
                            <input 
                                type="number" 
                                required 
                                min={10} 
                                max={60} 
                                className="form-input" 
                                value={formData.totalSeats} 
                                onChange={e => setFormData({ ...formData, totalSeats: Number(e.target.value) })} 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Onboard Amenities (comma separated)</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={formData.amenities} 
                            onChange={e => setFormData({ ...formData, amenities: e.target.value })} 
                            placeholder="WiFi, Charging Port, AC, Refreshments..." 
                        />
                    </div>

                    {user?.role === "superadmin" && (
                        <div className="form-group">
                            <label className="form-label">Assign Company</label>
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

                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">
                            <BusFront size={15} />
                            <span>{selectedBus ? 'Save Changes' : 'Create Bus'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .page-container {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .page-title {
                    font-size: 26px;
                    font-weight: 800;
                    margin: 0;
                    color: var(--foreground);
                    letter-spacing: -0.025em;
                }
                .page-subtitle {
                    color: var(--text-muted);
                    margin: 6px 0 0 0;
                    font-size: 13px;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 24px;
                }
                .error-text {
                    background: var(--danger-light);
                    color: var(--danger);
                    padding: 10px 14px;
                    border-radius: var(--radius-md);
                    font-size: 13px;
                    margin-bottom: 16px;
                    border: 1px solid rgba(239, 68, 68, 0.25);
                }
            `}</style>
        </main>
    );
}

