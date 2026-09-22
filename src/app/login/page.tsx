"use client";
import { useState } from "react";
import { BusFront, Mail, Lock, LogIn, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { fetchAPI } from "@/utils/api";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await fetchAPI("/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (data.success) {
                if (data.user.role === "user") {
                    setError("Access restricted: Standard customer accounts cannot access the administrative portal.");
                    setLoading(false);
                    return;
                }
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("user", JSON.stringify(data.user));
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message || "Authentication failed. Please verify your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`glass ${styles.card}`}>
                <div className={styles.header}>
                    <div className={styles.brandIconWrapper}>
                        <BusFront size={28} className={styles.brandIcon} />
                    </div>
                    <h1 className={styles.title}>Book&Go</h1>
                    <div className={styles.badgeWrapper}>
                        <span className="badge badge-primary">
                            <ShieldCheck size={12} />
                            Admin Console
                        </span>
                    </div>
                </div>

                <form className={styles.form} onSubmit={handleLogin}>
                    {error && (
                        <div className={styles.error}>
                            <AlertCircle size={16} className={styles.errorIcon} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email Address</label>
                        <div className={styles.inputWrapper}>
                            <Mail size={16} className={styles.inputIcon} />
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="admin@bookandgo.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={16} className={styles.inputIcon} />
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="••••••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 size={16} className={styles.spinIcon} />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={16} />
                                <span>Sign In to Portal</span>
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>Protected enterprise system • Authorized personnel only</p>
                </div>
            </div>
        </div>
    );
}
