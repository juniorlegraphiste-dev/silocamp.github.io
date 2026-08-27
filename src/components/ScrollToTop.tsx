import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Ne pas remonter en haut lorsqu'une section
    // doit être ciblée après une navigation.
    const sectionId = sessionStorage.getItem("silo-scroll-to");

    if (sectionId) {
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [pathname]);

  return null;
}