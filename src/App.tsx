/**
 * App — point d'entrée de l'application.
 * ------------------------------------------------------------
 * - HashRouter : navigation fiable pour un build en fichier
 *   unique servi statiquement (pas de configuration serveur).
 * - CartProvider : état global du panier de billetterie.
 * - Transitions de page fluides (framer-motion) + remontée en
 *   haut de page à chaque navigation.
 */
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import EventDetail from "@/pages/EventDetail";
import Checkout from "@/pages/Checkout";
import Confirmation from "@/pages/Confirmation";
import Contact from "./pages/Contact";
import ScrollToTop from "./components/ScrollToTop";
import ScanTicket from "@/pages/ScanTicket";
import TicketVerify from "@/pages/TicketVerify";

const EASE = [0.22, 1, 0.36, 1] as const;

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={{ duration: 0.4, ease: EASE }}
      >
        <Routes location={location}>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/evenement/:id" element={<EventDetail />} />
          <Route path="/billetterie" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/ticket/verify" element={<TicketVerify />} />
          <Route path="/scanner" element={<ScanTicket />} />

          <Route path="/contact" element={<Contact />} />

          <Route path="*" element={<Home />} />
        </Routes>
      </motion.main>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <CartProvider>
      <HashRouter>
        <ScrollToTop />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <AnimatedRoutes />
          <Footer />
        </div>
      </HashRouter>
    </CartProvider>
  );
}
