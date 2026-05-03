import { Plus_Jakarta_Sans, Work_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import LayoutShell from "@/components/LayoutShell";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Practiiko App - Autogestión",
  description: "Panel de administración y autogestión de Practiiko.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${plusJakartaSans.variable} ${workSans.variable}`}>
      <body>
        <Providers>
          <LayoutShell>
            {children}
          </LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
