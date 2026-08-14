"use client";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/utils/api";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";
import modalStyles from "@/component/Modal/Modal.module.css";

export default function BusesPage() {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
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
            setIsUpdateModalOpen(false);
            setFormData({ busNumber: "", registrationNumber: "", type: "AC", totalSeats: 40, amenities: "" });
            setSelectedBus(null);
            if (user?.role === "superadmin") setSelectedCompanyId("");
            loadBuses();
        } catch (err: any) {
            setError(err.message || "Operation failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bus?")) return;
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
        { key: "busNumber", header: "Bus Number" },
        { key: "registrationNumber", header: "Registration" },
        { key: "type", header: "Type" },
        { key: "totalSeats", header: "Capacity", render: (r: any) => `${r.totalSeats} seats` },
        {
            key: "status", header: "Status", render: (r: any) => (
                <span className={`status-badge ${r.status || 'active'}`}>
                    {r.status || 'Active'}
                </span>
            )
        },
        {
            key: "actions", header: "Actions", render: (r: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} className="btn-primary-sm">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }} className="btn-danger-sm">Delete</button>
                </div>
            )
        }
    ];

    return (
        <main className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Buses Management</h1>
                    <p className="page-subtitle">Manage your fleet and vehicle specifications.</p>
                </div>
                <button onClick={() => { setSelectedBus(null); setFormData({ busNumber: "", registrationNumber: "", type: "AC", totalSeats: 40, amenities: "" }); setIsModalOpen(true); }} className="btn-primary">
                    + Add New Bus
                </button>
            </header>

            <DataTable 
                title="Active Fleet" 
                columns={columns} 
                data={buses} 
                loading={loading} 
                onRowClick={openEditModal} 
            />

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedBus ? "Update Bus Details" : "Add New Bus"}
            >
                <form onSubmit={handleSubmit}>
                    {error && <div className="error-text">{error}</div>}

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Bus Number</label>
                            <input type="text" required className="form-input" value={formData.busNumber} onChange={e => setFormData({ ...formData, busNumber: e.target.value })} placeholder="e.g. B-101" />
                        </div>
                        <div className="form-group">
                            <label>Registration</label>
                            <input type="text" required className="form-input" value={formData.registrationNumber} onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} placeholder="e.g. ABC-123" />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Type</label>
                            <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="AC">AC Luxury</option>
                                <option value="Non-AC">Executive</option>
                                <option value="Sleeper">Sleeper</option>
                                <option value="Luxury">Premium</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Total Seats</label>
                            <input type="number" required min={10} max={60} className="form-input" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Amenities (comma separated)</label>
                        <input type="text" className="form-input" value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })} placeholder="WiFi, AC, Charging Port..." />
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

                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">
                            {selectedBus ? 'Save Changes' : 'Create Bus'}
                        </button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .page-container { padding: 32px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
                .page-title { font-size: 32px; font-weight: 800; margin: 0; color: #f8fafc; letter-spacing: -0.025em; }
                .page-subtitle { color: #94a3b8; margin: 4px 0 0 0; font-size: 15px; }
                
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .form-input { width: 100%; padding: 12px 16px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--card-border); border-radius: 12px; color: white; outline: none; transition: all 0.2s; }
                .form-input:focus { border-color: var(--primary); background: rgba(0, 0, 0, 0.3); }
                
                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
                .btn-secondary { background: transparent; border: 1px solid var(--card-border); color: #94a3b8; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
                .btn-secondary:hover { background: rgba(255, 255, 255, 0.05); color: white; }
                
                .error-text { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 12px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.2); }
                
                .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                .status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                
                .btn-danger-sm { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
                .btn-danger-sm:hover { background: rgba(239, 68, 68, 0.2); }
                
                .btn-primary-sm { background: rgba(79, 70, 229, 0.1); color: #818cf8; border: 1px solid rgba(79, 70, 229, 0.2); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
                .btn-primary-sm:hover { background: rgba(79, 70, 229, 0.2); }
            `}</style>
        </main>
    );
}

