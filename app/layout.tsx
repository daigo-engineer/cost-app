import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wedding Budget App",
  description: "Manage wedding costs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-screen relative">
        <div className="bg-glow absolute inset-0 -z-10"></div>
        {children}
      </body>
    </html>
  );
}

