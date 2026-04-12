import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/component/AuthGuard/AuthWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Dashboard | BookNGo",
  description: "Premium admin panel using modern web design principles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </div>
      </body>
    </html>
  );
}
