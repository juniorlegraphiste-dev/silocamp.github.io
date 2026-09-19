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

import {
  BrowserRouter,
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
import Annulation from "@/pages/Annulation";
import Contact from "@/pages/Contact";
import ScanTicket from "@/pages/ScanTicket";
import TicketVerify from "@/pages/TicketVerify";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminTickets from "@/pages/admin/AdminTickets";
import AdminStatistics from "@/pages/admin/AdminStatistics";
import AdminSettings from "@/pages/admin/AdminSettings";

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

              <Route
                path="/"
                element={<Home />}
              />

              {/* =================================================
                  ÉVÉNEMENT
              ================================================= */}

              <Route
                path="/evenement/:id"
                element={<EventDetail />}
              />

              {/* =================================================
                  BILLETTERIE
              ================================================= */}

              <Route
                path="/billetterie"
                element={<Checkout />}
              />

              {/* =================================================
                  CONFIRMATION
              ================================================= */}

              <Route
                path="/confirmation"
                element={<Confirmation />}
              />

              {/* =================================================
                  ANNULATION DE BILLET
              ================================================= */}

              <Route
                path="/annulation"
                element={<Annulation />}
              />

              {/* =================================================
                  VÉRIFICATION DE BILLET
              ================================================= */}

              <Route
                path="/ticket/verify"
                element={<TicketVerify />}
              />

              {/* =================================================
                  CONTACT
              ================================================= */}

              <Route
                path="/contact"
                element={<Contact />}
              />

              {/* =================================================
                  ROUTE PAR DÉFAUT
              ================================================= */}

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

/* =========================================================
   SCANNER
   Pas de Navbar / Footer
========================================================= */

function ScannerRoute() {
  return <ScanTicket />;
}

/* =========================================================
   ROUTES ADMIN
========================================================= */

function AdminRoutes() {
  return (
    <Routes>
      {/* =================================================
          CONNEXION ADMIN
      ================================================= */}

      <Route
        path="/admin"
        element={<AdminLogin />}
      />

      {/* =================================================
          ESPACE ADMIN PROTÉGÉ
      ================================================= */}

      <Route
        path="/admin"
        element={<AdminLayout />}
      >
        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="tickets"
          element={<AdminTickets />}
        />

        <Route
          path="statistics"
          element={<AdminStatistics />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />
      </Route>
    </Routes>
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

        <Route
          index
          element={<AdminLogin />}
        />

        {/* /admin/* = espace protégé */}

        <Route element={<AdminLayout />}>
          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="tickets"
            element={<AdminTickets />}
          />

          <Route
            path="statistics"
            element={<AdminStatistics />}
          />

          <Route
            path="settings"
            element={<AdminSettings />}
          />
        </Route>
      </Route>

      {/* =================================================
          SCANNER
      ================================================= */}

      <Route
        path="/scanner"
        element={<ScannerRoute />}
      />

      {/* =================================================
          SITE PUBLIC
      ================================================= */}

      <Route
        path="*"
        element={<PublicRoutes />}
      />
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

        <div className="flex min-h-screen flex-col">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}