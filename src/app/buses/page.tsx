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
    Building2,
    Wifi,
    Zap,
    Tv,
    Moon,
    Droplets,
    Coffee,
    Check,
    Loader2
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

    // Dynamic Amenities
    const [availableAmenities, setAvailableAmenities] = useState<string[]>([
        "WiFi", "Charging Port", "TV", "Blanket", "Water", "Snacks"
    ]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [loadingAmenities, setLoadingAmenities] = useState(false);

    const [formData, setFormData] = useState({
        busNumber: "",
        registrationNumber: "",
        type: "AC",
        totalSeats: 40,
    });

    const getAmenityIcon = (name: string) => {
        const n = (name || "").toLowerCase();
        if (n.includes("wifi")) return <Wifi size={13} />;
        if (n.includes("charg") || n.includes("plug") || n.includes("power") || n.includes("usb")) return <Zap size={13} />;
        if (n.includes("tv") || n.includes("screen") || n.includes("movie")) return <Tv size={13} />;
        if (n.includes("blanket") || n.includes("pillow") || n.includes("sleep")) return <Moon size={13} />;
        if (n.includes("water") || n.includes("drink")) return <Droplets size={13} />;
        if (n.includes("snack") || n.includes("food") || n.includes("meal") || n.includes("tea") || n.includes("coffee")) return <Coffee size={13} />;
        return <Sparkles size={13} />;
    };

    const loadAmenities = async () => {
        try {
            setLoadingAmenities(true);
            const res = await fetchAPI("/buses/amenities");
            if (res.amenities && Array.isArray(res.amenities) && res.amenities.length > 0) {
                setAvailableAmenities(res.amenities);
            }
        } catch (err) {
            console.warn("Could not fetch backend amenities, using default dynamic set:", err);
        } finally {
            setLoadingAmenities(false);
        }
    };

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
        loadAmenities();
    }, []);

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev => 
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

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
                amenities: selectedAmenities,
                ...(companyId ? { company: companyId } : {})
            };
            
            const endpoint = selectedBus ? `/buses/${selectedBus._id}` : "/buses/add";
            const method = selectedBus ? "PUT" : "POST";

            await fetchAPI(endpoint, {
                method,
                body: JSON.stringify(bodyData),
            });

            setIsModalOpen(false);
            setFormData({ busNumber: "", registrationNumber: "", type: "AC", totalSeats: 40 });
            setSelectedAmenities([]);
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
        });
        setSelectedAmenities(Array.isArray(bus.amenities) ? bus.amenities : []);
        setIsModalOpen(true);
    };

    const columns = [
        { 
            key: "busNumber", 
            header: "Bus Number",
            render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', flexShrink: 0 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    <Users size={13} color="var(--text-secondary)" />
                    <span>{r.totalSeats} seats</span>
                </div>
            )
        },
        {
            key: "amenities",
            header: "Amenities",
            render: (r: any) => {
                const list = Array.isArray(r.amenities) ? r.amenities : [];
                if (list.length === 0) return <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Standard</span>;
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                        {list.slice(0, 2).map((a: string, i: number) => (
                            <span key={i} className="badge badge-primary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {getAmenityIcon(a)}
                                <span>{a}</span>
                            </span>
                        ))}
                        {list.length > 2 && (
                            <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                +{list.length - 2} more
                            </span>
                        )}
                    </div>
                );
            }
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
                    <p className="page-subtitle">Track vehicles, bus specifications, seating capacity, and onboard amenities.</p>
                </div>
                <button 
                    onClick={() => { 
                        setSelectedBus(null); 
                        setFormData({ busNumber: "", registrationNumber: "", type: "AC", totalSeats: 40 }); 
                        setSelectedAmenities([]);
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="form-label" style={{ margin: 0 }}>Onboard Amenities</label>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {selectedAmenities.length} selected
                            </span>
                        </div>
                        
                        {loadingAmenities ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                <Loader2 size={16} className="spin-icon" />
                                <span>Loading amenities from backend...</span>
                            </div>
                        ) : (
                            <div className="amenities-grid">
                                {availableAmenities.map((amenity) => {
                                    const isSelected = selectedAmenities.includes(amenity);
                                    return (
                                        <button
                                            type="button"
                                            key={amenity}
                                            onClick={() => toggleAmenity(amenity)}
                                            className={`amenity-chip ${isSelected ? 'selected' : ''}`}
                                        >
                                            <span className="amenity-icon">
                                                {getAmenityIcon(amenity)}
                                            </span>
                                            <span className="amenity-text">{amenity}</span>
                                            {isSelected && <Check size={13} className="amenity-check" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
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
                .amenities-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                    gap: 8px;
                    margin-top: 4px;
                }
                .amenity-chip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-md);
                    color: var(--text-muted);
                    font-size: 12.5px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    user-select: none;
                    text-align: left;
                }
                .amenity-chip:hover {
                    background: var(--hover-bg);
                    color: var(--foreground);
                    border-color: rgba(99, 102, 241, 0.3);
                }
                .amenity-chip.selected {
                    background: var(--primary-light);
                    border-color: var(--primary);
                    color: #a5b4fc;
                    font-weight: 600;
                    box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
                }
                .amenity-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .amenity-text {
                    flex: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .amenity-check {
                    color: var(--primary);
                    flex-shrink: 0;
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
                .spin-icon {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}

