"use client";

import ProteccionDashboard from "@/components/ProteccionDashboard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProteccionDashboard>{children}</ProteccionDashboard>;
}
