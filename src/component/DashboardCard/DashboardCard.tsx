import styles from "./DashboardCard.module.css";

interface Props {
    title: string;
    value: string;
    trend?: string;
    trendType?: "up" | "down";
    icon?: React.ReactNode;
}

export default function DashboardCard({ title, value, trend, trendType, icon }: Props) {
    return (
        <div className={`glass glass-card ${styles.card}`}>
            <div className={styles.header}>
                <span className={styles.title}>{title}</span>
                {icon && <div className={styles.iconWrapper}>{icon}</div>}
            </div>
            <span className={styles.value}>{value}</span>
            {trend && (
                <div className={`${styles.trend} ${trendType === "up" ? styles.trendUp : styles.trendDown}`}>
                    <span className={styles.trendIcon}>{trendType === "up" ? "↗" : "↘"}</span>
                    <span>{trend}</span>
                </div>
            )}
        </div>
    );
}
