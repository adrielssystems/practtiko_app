import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Practtiko App - Autogestión",
  description: "Panel de administración y autogestión de Practtiko.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${inter.variable}`}>
      <body>
        <div className="dashboard-layout">
          <aside className="sidebar">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>Practtiko Admin</h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a href="/dashboard" style={{ opacity: 0.7 }}>Dashboard</a>
              <a href="/content" style={{ opacity: 0.7 }}>Contenido</a>
              <a href="/settings" style={{ opacity: 0.7 }}>Ajustes</a>
            </nav>
          </aside>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
