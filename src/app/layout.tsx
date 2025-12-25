import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RADIANCE - ヨガ・ウェルネスメディア",
  description: "心と体を整えるヨガ・ウェルネス情報メディア",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
