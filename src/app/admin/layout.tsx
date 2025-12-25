import type { Metadata } from "next";
import { AuthProvider } from "./lib/auth-context";
import { QueryProvider } from "./lib/query-client";
import { ToasterWrapper } from "./lib/toaster-wrapper";
import "./admin.css";

export const metadata: Metadata = {
  title: "管理画面 - RADIANCE CMS",
  description: "RADIANCE メディア管理システム",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <ToasterWrapper />
      </AuthProvider>
    </QueryProvider>
  );
}
