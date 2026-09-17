import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import { CartProvider } from "@/context/CartContext";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

import AdminLayout from "@/components/admin/AdminLayout";

import Home from "@/pages/Home";
import EventDetail from "@/pages/EventDetail";
import Checkout from "@/pages/Checkout";
import Confirmation from "@/pages/Confirmation";
import Contact from "@/pages/Contact";

import ScanTicket from "@/pages/ScanTicket";
import TicketVerify from "@/pages/TicketVerify";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminTickets from "@/pages/admin/AdminTickets";
import AdminStatistics from "@/pages/admin/AdminStatistics";
import AdminSettings from "@/pages/admin/AdminSettings";

/* ============================================================
   ANIMATIONS
   ============================================================ */

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

/* ============================================================
   ROUTES PUBLIQUES
   ============================================================

   Navbar + contenu + Footer

   IMPORTANT :
   /scanner n'est PAS placé ici.

   Cela permet de ne pas afficher la Navbar ni le Footer
   sur l'espace de contrôle des billets.
   ============================================================ */

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
              {/* ==================================================
                  ACCUEIL
                  ================================================== */}

              <Route
                path="/"
                element={<Home />}
              />

              {/* ==================================================
                  DÉTAIL ÉVÉNEMENT
                  ================================================== */}

              <Route
                path="/evenement/:id"
                element={<EventDetail />}
              />

              {/* ==================================================
                  BILLETTERIE
                  ================================================== */}

              <Route
                path="/billetterie"
                element={<Checkout />}
              />

              {/* ==================================================
                  CONFIRMATION
                  ================================================== */}

              <Route
                path="/confirmation"
                element={<Confirmation />}
              />

              {/* ==================================================
                  VÉRIFICATION PUBLIQUE DU BILLET
                  ================================================== */}

              <Route
                path="/ticket/verify"
                element={<TicketVerify />}
              />

              {/* ==================================================
                  CONTACT
                  ================================================== */}

              <Route
                path="/contact"
                element={<Contact />}
              />

              {/* ==================================================
                  ROUTE PUBLIQUE PAR DÉFAUT
                  ================================================== */}

              <Route
                path="*"
                element={<Home />}
              />
            </Routes>
          </motion.main>
        </AnimatePresence>
      </div>

      <Footer />
    </>
  );
}

/* ============================================================
   ROUTE SCANNER
   ============================================================

   Cette route est volontairement séparée de PublicRoutes.

   /scanner affiche uniquement ScanTicket.

   Pas de Navbar.
   Pas de Footer.
   ============================================================ */

function ScannerRoute() {
  return <ScanTicket />;
}

/* ============================================================
   ROUTES ADMIN + SITE
   ============================================================ */

function AppRoutes() {
  return (
    <Routes>
      {/* ========================================================
          ADMINISTRATION
          ======================================================== */}

      <Route
        path="/admin"
        element={<AdminLayout />}
      >
        {/* ======================================================
            IMPORTANT :

            /admin
            ↓
            /admin/dashboard

            replace=true évite d'ajouter /admin dans
            l'historique du navigateur.
            ====================================================== */}

        <Route
          index
          element={
            <Navigate
              to="dashboard"
              replace
            />
          }
        />

        {/* ======================================================
            DASHBOARD
            ====================================================== */}

        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        {/* ======================================================
            PARTICIPANTS / BILLETS
            ====================================================== */}

        <Route
          path="tickets"
          element={<AdminTickets />}
        />

        {/* ======================================================
            STATISTIQUES
            ====================================================== */}

        <Route
          path="statistics"
          element={<AdminStatistics />}
        />

        {/* ======================================================
            PARAMÈTRES
            ====================================================== */}

        <Route
          path="settings"
          element={<AdminSettings />}
        />
      </Route>

      {/* ========================================================
          SCANNER

          Aucun Navbar / Footer
          ======================================================== */}

      <Route
        path="/scanner"
        element={<ScannerRoute />}
      />

      {/* ========================================================
          SITE PUBLIC

          Toutes les autres routes passent par PublicRoutes.
          ======================================================== */}

      <Route
        path="*"
        element={<PublicRoutes />}
      />
    </Routes>
  );
}

/* ============================================================
   APPLICATION
   ============================================================ */

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />

        <div className="flex min-h-screen flex-col">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}