import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#080807] text-cream">
      <AdminSidebar />

      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto w-full max-w-7xl p-6 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}