"use client";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";

export default function Header() {
    const pathname = usePathname();

    if (pathname === "/login") return null;

    return (
        <header className={styles.header}>
            <div>
                <input type="text" placeholder="Search..." className={styles.search} />
            </div>
            <div className={styles.profile}>
                <div className={styles.avatar}>A</div>
            </div>
        </header>
    );
}
