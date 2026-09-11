import { Outlet } from "react-router-dom";

import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-ink-950">
      <AdminSidebar />

      <main className="min-h-screen lg:pl-72">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}