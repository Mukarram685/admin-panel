"use client";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/utils/api";
import DataTable from "@/component/DataTable/DataTable";
import Modal from "@/component/Modal/Modal";

export default function RoutesPage() {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        from: "",
        to: "",
        fromCity: "",
        toCity: "",
        distance: "",
        duration: "",
    });

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
        loadRoutes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const bodyData = { 
                ...formData, 
                distance: Number(formData.distance) 
            };
            
            const endpoint = selectedRoute ? `/routes/updateRoute/${selectedRoute._id}` : "/routes/createRoute";
            const method = selectedRoute ? "PATCH" : "POST";

            await fetchAPI(endpoint, {
                method,
                body: JSON.stringify(bodyData),
            });

            setIsModalOpen(false);
            setFormData({ from: "", to: "", fromCity: "", toCity: "", distance: "", duration: "" });
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
        setIsModalOpen(true);
    };

    const columns = [
        { key: "from", header: "Source", render: (r: any) => `${r.from} (${r.fromCity})` },
        { key: "to", header: "Destination", render: (r: any) => `${r.to} (${r.toCity})` },
        { key: "distance", header: "Distance", render: (r: any) => `${r.distance} km` },
        { key: "duration", header: "Duration" },
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
                    <h1 className="page-title">Routes Management</h1>
                    <p className="page-subtitle">Define and manage travel paths between cities.</p>
                </div>
                <button onClick={() => { setSelectedRoute(null); setFormData({ from: "", to: "", fromCity: "", toCity: "", distance: "", duration: "" }); setIsModalOpen(true); }} className="btn-primary">
                    + Add New Route
                </button>
            </header>

            <DataTable 
                title="Active Routes" 
                columns={columns} 
                data={routes} 
                loading={loading} 
                onRowClick={openEditModal} 
            />

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={selectedRoute ? "Update Route" : "Create New Route"}
            >
                <form onSubmit={handleSubmit}>
                    {error && <div className="error-text">{error}</div>}

                    <div className="form-grid">
                        <div className="form-group">
                            <label>From (Terminal)</label>
                            <input type="text" required className="form-input" value={formData.from} onChange={e => setFormData({ ...formData, from: e.target.value })} placeholder="Main Terminal A" />
                        </div>
                        <div className="form-group">
                            <label>From City</label>
                            <input type="text" required className="form-input" value={formData.fromCity} onChange={e => setFormData({ ...formData, fromCity: e.target.value })} placeholder="New York" />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>To (Terminal)</label>
                            <input type="text" required className="form-input" value={formData.to} onChange={e => setFormData({ ...formData, to: e.target.value })} placeholder="Central Station B" />
                        </div>
                        <div className="form-group">
                            <label>To City</label>
                            <input type="text" required className="form-input" value={formData.toCity} onChange={e => setFormData({ ...formData, toCity: e.target.value })} placeholder="Boston" />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Distance (km)</label>
                            <input type="number" className="form-input" value={formData.distance} onChange={e => setFormData({ ...formData, distance: e.target.value })} placeholder="340" />
                        </div>
                        <div className="form-group">
                            <label>Duration</label>
                            <input type="text" className="form-input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="4h 30m" />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">
                            {selectedRoute ? 'Save Changes' : 'Create Route'}
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
                
                .btn-danger-sm { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
                .btn-danger-sm:hover { background: rgba(239, 68, 68, 0.2); }
                
                .btn-primary-sm { background: rgba(79, 70, 229, 0.1); color: #818cf8; border: 1px solid rgba(79, 70, 229, 0.2); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
                .btn-primary-sm:hover { background: rgba(79, 70, 229, 0.2); }
            `}</style>
        </main>
    );
}

