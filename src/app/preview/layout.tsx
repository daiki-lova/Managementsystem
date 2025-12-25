import { AuthProvider } from "@/app/admin/lib/auth-context";
import { QueryProvider } from "@/app/admin/lib/query-client";

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  );
}
