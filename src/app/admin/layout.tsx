import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "./lib/auth-context";
import { QueryProvider } from "./lib/query-client";
import { ToasterWrapper } from "./lib/toaster-wrapper";
import "./admin.css";

export const metadata: Metadata = {
  title: "管理画面 - ALIGN CMS",
  description: "ALIGN メディア管理システム",
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
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
