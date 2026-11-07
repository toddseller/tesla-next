import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Footer } from "@/components/footer";
import { TopBar } from "@/components/top-bar";
import "./globals.css";

// next/font downloads these at build and serves them from the site, so no font request leaves it.
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata = { title: "Tesla Solar Report" };

// A nonce is per request, so no page may be prerendered without one.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <TopBar />
        <main className="mx-auto box-border w-full max-w-[1200px] px-4 py-8 sm:px-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
