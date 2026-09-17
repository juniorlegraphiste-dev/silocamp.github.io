import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!mounted) return;

        setAuthenticated(
          response.ok && data?.authenticated === true
        );
      } catch {
        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080807] text-cream flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-cream/50">
          <Loader2 className="h-5 w-5 animate-spin text-[#C8A45D]" />
          Vérification de votre session...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin" replace />;
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Même en cas d'erreur réseau,
      // on retourne vers la connexion.
    }

    navigate("/admin", {
      replace: true,
    });
  }

  return (
    <div className="min-h-screen bg-[#080807] text-cream">

      <AdminSidebar />

      <div className="lg:pl-72">

        <AdminHeader onLogout={handleLogout} />

        <main className="min-h-screen">
          <div className="mx-auto w-full max-w-7xl p-6 md:p-8 lg:p-10">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}