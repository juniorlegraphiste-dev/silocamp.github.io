/**
 * =========================================================
 * APP — SILOCAMP
 * =========================================================
 *
 * Routage principal de l'application.
 *
 * Sections :
 * - Site public
 * - Billetterie
 * - Confirmation
 * - Annulation
 * - Vérification des billets
 * - Scanner
 * - Administration
 *
 * =========================================================
 */

import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";

import { CartProvider } from "@/context/CartContext";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

import { lazy, Suspense } from "react";

const Home = lazy(() => import("@/pages/Home"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Confirmation = lazy(() => import("@/pages/Confirmation"));
const Annulation = lazy(() => import("@/pages/Annulation"));
const Contact = lazy(() => import("@/pages/Contact"));
const ScanTicket = lazy(() => import("@/pages/ScanTicket"));
const TicketVerify = lazy(() => import("@/pages/TicketVerify"));

const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminTickets = lazy(() => import("@/pages/admin/AdminTickets"));
const AdminStatistics = lazy(() => import("@/pages/admin/AdminStatistics"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));

/* =========================================================
   ANIMATION DES PAGES
========================================================= */

const EASE = [0.22, 1, 0.36, 1] as const;

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },

  enter: {
    opacity: 1,
    y: 0,
  },

  exit: {
    opacity: 0,
    y: -10,
  },
};

/* =========================================================
   SITE PUBLIC
========================================================= */

function PublicRoutes() {
  const location = useLocation();

  return (
    <>
      <Navbar />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{
              duration: 0.4,
              ease: EASE,
            }}
          >
            <Routes location={location}>
              {/* =================================================
                  ACCUEIL
              ================================================= */}

              <Route path="/" element={<Home />} />

              {/* =================================================
                  ÉVÉNEMENT
              ================================================= */}

              <Route path="/evenement/:id" element={<EventDetail />} />

              {/* =================================================
                  BILLETTERIE
              ================================================= */}

              <Route path="/billetterie" element={<Checkout />} />

              {/* =================================================
                  CONFIRMATION
              ================================================= */}

              <Route path="/confirmation" element={<Confirmation />} />

              {/* =================================================
                  ANNULATION DE BILLET
              ================================================= */}

              <Route path="/annulation" element={<Annulation />} />

              {/* =================================================
                  VÉRIFICATION DE BILLET
              ================================================= */}

              <Route path="/ticket/verify" element={<TicketVerify />} />

              {/* =================================================
                  CONTACT
              ================================================= */}

              <Route path="/contact" element={<Contact />} />

              {/* =================================================
                  ROUTE PAR DÉFAUT
              ================================================= */}

              <Route path="*" element={<Home />} />
            </Routes>
          </motion.main>
        </AnimatePresence>
      </div>

      <Footer />
    </>
  );
}

/* =========================================================
   SCANNER
   Pas de Navbar / Footer
========================================================= */

function ScannerRoute() {
  return <ScanTicket />;
}

function PageLoading() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400/30 border-t-amber-400" />
        <p className="text-sm text-neutral-500">Chargement de la page...</p>
      </div>
    </div>
  );
}

/* =========================================================
   ROUTEUR PRINCIPAL
========================================================= */

function AppRoutes() {
  return (
    <Routes>
      {/* =================================================
          ADMINISTRATION
      ================================================= */}

      <Route path="/admin">
        {/* /admin = connexion */}

        <Route index element={<AdminLogin />} />

        {/* /admin/* = espace protégé */}

        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="tickets" element={<AdminTickets />} />

          <Route path="statistics" element={<AdminStatistics />} />

          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* =================================================
          SCANNER
      ================================================= */}

      <Route path="/scanner" element={<ScannerRoute />} />

      {/* =================================================
          SITE PUBLIC
      ================================================= */}

      <Route path="*" element={<PublicRoutes />} />
    </Routes>
  );
}

/* =========================================================
   APPLICATION
========================================================= */

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />

        <Suspense fallback={<PageLoading />}>
          <div className="flex min-h-screen flex-col">
            <AppRoutes />
          </div>
        </Suspense>
      </BrowserRouter>
    </CartProvider>
  );
}
