"use client";
import { useEffect, useState } from "react";
import {
    Plus,
    Edit3,
    Trash2,
    MapPin,
    ArrowRight,
    Clock,
    Compass,
    Route,
    Building2
} from "lucide-react";
import { fetchAPI } from "@/utils/api";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";
import { useCompanyFilter } from "@/context/CompanyFilterContext";

export default function RoutesPage() {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [error, setError] = useState("");
    const [user, setUser] = useState<any>(null);
    const { selectedCompanyId: globalCompanyId, selectedCompany } = useCompanyFilter();

    const [formData, setFormData] = useState({
        from: "",
        to: "",
        fromCity: "",
        toCity: "",
        distance: "",
        duration: "",
    });

    const [durationHours, setDurationHours] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");

    const parseDuration = (dur: string) => {
        if (!dur) return { hours: "", minutes: "" };
        const str = dur.trim().toLowerCase();
        let hours = 0;
        let minutes = 0;
        let found = false;

        const hMatch = str.match(/(\d+)\s*h/);
        const mMatch = str.match(/(\d+)\s*m/);

        if (hMatch) {
            hours = parseInt(hMatch[1], 10);
            found = true;
        }
        if (mMatch) {
            minutes = parseInt(mMatch[1], 10);
            found = true;
        }

        if (!found && str.includes(":")) {
            const parts = str.split(":");
            hours = parseInt(parts[0], 10) || 0;
            minutes = parseInt(parts[1], 10) || 0;
            found = true;
        }

        if (!found && /^\d+$/.test(str)) {
            hours = parseInt(str, 10);
            found = true;
        }

        return {
            hours: found && hours > 0 ? String(hours) : (found && hours === 0 && minutes > 0 ? "0" : (found ? String(hours) : "")),
            minutes: found && minutes > 0 ? String(minutes) : ""
        };
    };

    const formatDuration = (h: string | number, m: string | number) => {
        const hoursNum = parseInt(String(h), 10);
        const minsNum = parseInt(String(m), 10);

        const hasHours = !isNaN(hoursNum) && hoursNum > 0;
        const hasMins = !isNaN(minsNum) && minsNum > 0;

        if (hasHours && hasMins) {
            return `${hoursNum}h ${minsNum}m`;
        } else if (hasHours) {
            return `${hoursNum}h`;
        } else if (hasMins) {
            return `${minsNum}m`;
        }
        return "";
    };

    const loadRoutes = async () => {
        try {
            setLoading(true);
            const res = await fetchAPI("/routes/allRoutes");
            setRoutes(res.data || res.routes || []);
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
                setUser(JSON.parse(userStr));
            } catch (e) {
                console.error(e);
            }
        }
        loadRoutes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const finalDuration = formatDuration(durationHours, durationMinutes) || formData.duration || "N/A";
            const bodyData = { 
                ...formData, 
                duration: finalDuration,
                distance: Number(formData.distance),
                ...(user?.role === "superadmin" && globalCompanyId ? { company: globalCompanyId } : {})
            };
            
            const endpoint = selectedRoute ? `/routes/updateRoute/${selectedRoute._id}` : "/routes/createRoute";
            const method = selectedRoute ? "PATCH" : "POST";

            await fetchAPI(endpoint, {
                method,
                body: JSON.stringify(bodyData),
            });

            setIsModalOpen(false);
            setFormData({ from: "", to: "", fromCity: "", toCity: "", distance: "", duration: "" });
            setDurationHours("");
            setDurationMinutes("");
            setSelectedRoute(null);
            loadRoutes();
        } catch (err: any) {
            setError(err.message || "Operation failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this route?")) return;
        try {
            await fetchAPI(`/routes/deleteRoute/${id}`, { method: "DELETE" });
            loadRoutes();
        } catch (err: any) {
            alert(err.message || "Failed to delete route");
        }
    };

    const openEditModal = (route: any) => {
        setSelectedRoute(route);
        setFormData({
            from: route.from || "",
            to: route.to || "",
            fromCity: route.fromCity || "",
            toCity: route.toCity || "",
            distance: route.distance?.toString() || "",
            duration: route.duration || "",
        });
        const parsed = parseDuration(route.duration || "");
        setDurationHours(parsed.hours);
        setDurationMinutes(parsed.minutes);
        setIsModalOpen(true);
    };

    const displayedRoutes = (user?.role === "superadmin" && globalCompanyId)
        ? routes.filter((r: any) => {
            const compId = typeof r.company === "object" && r.company !== null
                ? (r.company._id || r.company.id)
                : r.company;
            return compId === globalCompanyId;
        })
        : routes;

    const columns = [
        { 
            key: "routePath", 
            header: "Journey Path", 
            render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                        <Route size={14} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--foreground)' }}>
                            <span>{r.fromCity}</span>
                            <ArrowRight size={13} color="var(--primary)" />
                            <span>{r.toCity}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.from} → {r.to}</span>
                    </div>
                </div>
            )
        },
        ...(user?.role === "superadmin" && !globalCompanyId ? [{
            key: "company",
            header: "Company",
            render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={13} color="var(--primary)" />
                    <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>
                        {typeof r.company === 'object' ? r.company?.name : "N/A"}
                    </span>
                </div>
            )
        }] : []),
        { 
            key: "distance", 
            header: "Distance", 
            render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                    <Compass size={13} color="var(--text-secondary)" />
                    <span>{r.distance} km</span>
                </div>
            )
        },
        { 
            key: "duration", 
            header: "Estimated Duration", 
            render: (r: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                    <Clock size={13} color="var(--text-secondary)" />
                    <span>{r.duration || 'N/A'}</span>
                </div>
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
                        title="Edit Route"
                    >
                        <Edit3 size={13} />
                        <span>Edit</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }} 
                        className="btn-icon-danger"
                        title="Delete Route"
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
                    <h1 className="page-title">
                        {user?.role === "superadmin" && selectedCompany 
                            ? `${selectedCompany.name} - Intercity Routes` 
                            : "Routes & Networks"}
                    </h1>
                    <p className="page-subtitle">
                        {user?.role === "superadmin" && selectedCompany 
                            ? `Viewing transit corridors and schedules for ${selectedCompany.name}.` 
                            : "Configure departure terminals, arrival destinations, mileage, and transit schedules."}
                    </p>
                </div>
                <button 
                    onClick={() => { 
                        setSelectedRoute(null); 
                        setFormData({ from: "", to: "", fromCity: "", toCity: "", distance: "", duration: "" }); 
                        setDurationHours("");
                        setDurationMinutes("");
                        setIsModalOpen(true); 
                    }} 
                    className="btn-primary"
                >
                    <Plus size={15} />
                    <span>Add New Route</span>
                </button>
            </header>

            <DataTable 
                title={user?.role === "superadmin" && selectedCompany ? `${selectedCompany.name} Transit Corridors` : "Configured Transit Paths"} 
                columns={columns} 
                data={displayedRoutes} 
                loading={loading} 
                onRowClick={openEditModal} 
            />

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedRoute ? "Update Transit Route" : "Establish New Route"}
            >
                <form onSubmit={handleSubmit}>
                    {error && <div className="error-text">{error}</div>}

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Origin Terminal</label>
                            <input 
                                type="text" 
                                required 
                                className="form-input" 
                                value={formData.from} 
                                onChange={e => setFormData({ ...formData, from: e.target.value })} 
                                placeholder="Main Terminal A" 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Origin City</label>
                            <input 
                                type="text" 
                                required 
                                className="form-input" 
                                value={formData.fromCity} 
                                onChange={e => setFormData({ ...formData, fromCity: e.target.value })} 
                                placeholder="e.g. Lahore" 
                            />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Destination Terminal</label>
                            <input 
                                type="text" 
                                required 
                                className="form-input" 
                                value={formData.to} 
                                onChange={e => setFormData({ ...formData, to: e.target.value })} 
                                placeholder="Central Station B" 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Destination City</label>
                            <input 
                                type="text" 
                                required 
                                className="form-input" 
                                value={formData.toCity} 
                                onChange={e => setFormData({ ...formData, toCity: e.target.value })} 
                                placeholder="e.g. Islamabad" 
                            />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Distance (Kilometers)</label>
                            <input 
                                type="number" 
                                className="form-input" 
                                value={formData.distance} 
                                onChange={e => setFormData({ ...formData, distance: e.target.value })} 
                                placeholder="375" 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Transit Duration</span>
                                {(durationHours || durationMinutes) && (
                                    <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '11px', textTransform: 'none' }}>
                                        Preview: {formatDuration(durationHours, durationMinutes)}
                                    </span>
                                )}
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="72"
                                        className="form-input" 
                                        style={{ paddingRight: '28px' }}
                                        value={durationHours} 
                                        onChange={e => setDurationHours(e.target.value)} 
                                        placeholder="Hours" 
                                    />
                                    <span style={{ position: 'absolute', right: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                                        h
                                    </span>
                                </div>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="59"
                                        className="form-input" 
                                        style={{ paddingRight: '28px' }}
                                        value={durationMinutes} 
                                        onChange={e => setDurationMinutes(e.target.value)} 
                                        placeholder="Minutes" 
                                    />
                                    <span style={{ position: 'absolute', right: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                                        m
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">
                            <Route size={15} />
                            <span>{selectedRoute ? 'Save Changes' : 'Create Route'}</span>
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
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                @media (max-width: 640px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
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
                    margin-bottom: 16px;
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

