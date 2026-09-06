import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import styles from "./DashboardCard.module.css";

interface Props {
    title: string;
    value: string;
    trend?: string;
    trendType?: "up" | "down";
    icon?: React.ReactNode;
}

export default function DashboardCard({ title, value, trend, trendType = "up", icon }: Props) {
    return (
        <div className={`glass glass-card ${styles.card}`}>
            <div className={styles.header}>
                <span className={styles.title}>{title}</span>
                {icon && <div className={styles.iconWrapper}>{icon}</div>}
            </div>
            
            <div className={styles.body}>
                <span className={styles.value}>{value}</span>
                {trend && (
                    <div className={`${styles.trend} ${trendType === "up" ? styles.trendUp : styles.trendDown}`}>
                        {trendType === "up" ? (
                            <TrendingUp size={13} className={styles.trendIcon} />
                        ) : (
                            <TrendingDown size={13} className={styles.trendIcon} />
                        )}
                        <span>{trend}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
