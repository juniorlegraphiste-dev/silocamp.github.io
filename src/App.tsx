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
import Contact from "@/pages/Contact";
import ScanTicket from "@/pages/ScanTicket";
import TicketVerify from "@/pages/TicketVerify";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminTickets from "@/pages/admin/AdminTickets";
import AdminStatistics from "@/pages/admin/AdminStatistics";
import AdminSettings from "./pages/admin/AdminSettings";


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
              <Route
                path="/"
                element={<Home />}
              />

              <Route
                path="/evenement/:id"
                element={<EventDetail />}
              />

              <Route
                path="/billetterie"
                element={<Checkout />}
              />

              <Route
                path="/confirmation"
                element={<Confirmation />}
              />

              <Route
                path="/ticket/verify"
                element={<TicketVerify />}
              />

              <Route
                path="/scanner"
                element={<ScanTicket />}
              />

              <Route
                path="/contact"
                element={<Contact />}
              />

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

function AppRoutes() {
  return (
    <Routes>
      {/* =====================================================
          ADMIN
      ===================================================== */}

      <Route path="/admin" element={<AdminLayout />}>
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

      {/* =====================================================
          SITE PUBLIC
      ===================================================== */}

      <Route
        path="*"
        element={<PublicRoutes />}
      />
    </Routes>
  );
}

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