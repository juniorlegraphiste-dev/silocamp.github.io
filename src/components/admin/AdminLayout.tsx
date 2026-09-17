import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#080807] text-cream">
      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <AdminSidebar />

      {/* =====================================================
          ZONE PRINCIPALE
      ====================================================== */}
      <div className="min-h-screen lg:pl-72">
        {/* ===================================================
            HEADER ADMIN
        ==================================================== */}
        <AdminHeader />

        {/* ===================================================
            CONTENU
        ==================================================== */}
        <main className="min-h-[calc(100vh-80px)]">
          <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 md:px-8 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}