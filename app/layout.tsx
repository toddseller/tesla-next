import "./globals.css";

export const metadata = { title: "Tesla Solar Report" };

// A nonce is per request, so no page may be prerendered without one.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
