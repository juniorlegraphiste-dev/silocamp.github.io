/**
 * =========================================================
 * CART CONTEXT — SILOCAMP
 * =========================================================
 *
 * Gestion globale de la réservation.
 *
 * Règles SiloCamp :
 * - Un seul événement sélectionné
 * - Une seule catégorie : Participation
 * - Un participant = 1 seule place
 * - Une réservation = 1 seul billet
 * - Participation 100 % gratuite
 * - Persistance avec localStorage
 *
 * IMPORTANT :
 * La limite globale des 1500 billets est contrôlée
 * dans ticketService.ts au moment de la création du billet.
 * =========================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  events,
  getEventById,
  type TicketCategory,
} from "@/data/events";

/* =========================================================
   TYPES
========================================================= */

export type CartLine = {
  category: TicketCategory;
  quantity: 1;
  subtotal: 0;
};

type CartContextValue = {
  /* Événement sélectionné */
  eventId: string;

  /* Modifier l'événement */
  setEvent: (id: string) => void;

  /* Quantités sélectionnées */
  quantities: Record<string, number>;

  /* Modifier directement une quantité */
  setQuantity: (catId: string, quantity: number) => void;

  /* Ajouter une place */
  increment: (catId: string) => void;

  /* Retirer une place */
  decrement: (catId: string) => void;

  /* Vider la réservation */
  clear: () => void;

  /* Nombre total de billets */
  count: 0 | 1;

  /* Total de la réservation */
  total: 0;

  /* Lignes de réservation */
  lines: CartLine[];

  /* Événement actuellement sélectionné */
  event: (typeof events)[number];
};

/* =========================================================
   CONTEXT
========================================================= */

const CartContext = createContext<CartContextValue | null>(null);

/* =========================================================
   LOCAL STORAGE
========================================================= */

const STORAGE_KEY = "silocamp-cart-v1";

type StoredCart = {
  eventId: string;
  quantities: Record<string, number>;
};

/* =========================================================
   PANIER VIDE PAR DÉFAUT
========================================================= */

function getDefaultCart(): StoredCart {
  return {
    eventId: events[0]?.id ?? "",
    quantities: {},
  };
}

/* =========================================================
   CHARGEMENT DU PANIER
========================================================= */

function loadCart(): StoredCart {
  /*
   * Protection SSR / environnement sans window.
   */
  if (typeof window === "undefined") {
    return getDefaultCart();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return getDefaultCart();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return getDefaultCart();
    }

    const stored = parsed as Partial<StoredCart>;

    /*
     * Vérification de l'événement.
     */
    if (
      typeof stored.eventId !== "string" ||
      !getEventById(stored.eventId)
    ) {
      return getDefaultCart();
    }

    /*
     * Vérification des quantités.
     */
    if (
      !stored.quantities ||
      typeof stored.quantities !== "object" ||
      Array.isArray(stored.quantities)
    ) {
      return {
        eventId: stored.eventId,
        quantities: {},
      };
    }

    /*
     * SiloCamp :
     *
     * Une réservation = une seule place.
     *
     * Une seule catégorie est conservée.
     */
    const entries = Object.entries(stored.quantities);

    const selectedEntry = entries.find(([, value]) => {
      const numericValue =
        typeof value === "number" ? value : Number(value);

      return Number.isFinite(numericValue) && numericValue > 0;
    });

    if (!selectedEntry) {
      return {
        eventId: stored.eventId,
        quantities: {},
      };
    }

    const [categoryId] = selectedEntry;

    /*
     * Vérifier que la catégorie appartient bien
     * à l'événement sélectionné.
     */
    const selectedEvent = getEventById(stored.eventId);

    const categoryExists = selectedEvent?.categories.some(
      (category) => category.id === categoryId,
    );

    if (!categoryExists) {
      return {
        eventId: stored.eventId,
        quantities: {},
      };
    }

    /*
     * Une seule catégorie + une seule place.
     */
    return {
      eventId: stored.eventId,
      quantities: {
        [categoryId]: 1,
      },
    };
  } catch (error) {
    console.error(
      "Erreur lors du chargement du panier SiloCamp :",
      error,
    );

    return getDefaultCart();
  }
}

/* =========================================================
   PROVIDER
========================================================= */

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  /*
   * Chargement initial.
   */
  const [initialCart] = useState<StoredCart>(() => loadCart());

  const [eventId, setEventIdState] = useState(
    initialCart.eventId,
  );

  const [quantities, setQuantities] = useState<
    Record<string, number>
  >(initialCart.quantities);

  /* =======================================================
     ÉVÉNEMENT ACTUEL
  ======================================================= */

  const event = useMemo(() => {
    return getEventById(eventId) ?? events[0];
  }, [eventId]);

  /* =======================================================
     PERSISTANCE LOCAL STORAGE
  ======================================================= */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          eventId,
          quantities,
        }),
      );
    } catch (error) {
      console.error(
        "Erreur lors de la sauvegarde du panier SiloCamp :",
        error,
      );
    }
  }, [eventId, quantities]);

  /* =======================================================
     CHANGER D'ÉVÉNEMENT
  ======================================================= */

  const setEvent = useCallback((id: string) => {
    const selectedEvent = getEventById(id);

    if (!selectedEvent) {
      console.warn(`Événement introuvable : ${id}`);

      return;
    }

    /*
     * Changer d'événement réinitialise
     * complètement la réservation.
     */
    setEventIdState(id);

    setQuantities({});
  }, []);

  /* =======================================================
     MODIFIER UNE QUANTITÉ
  ======================================================= */

  const setQuantity = useCallback(
    (catId: string, quantity: number) => {
      setQuantities(() => {
        /*
         * Quantité <= 0 :
         * on vide la réservation.
         */
        if (!Number.isFinite(quantity) || quantity <= 0) {
          return {};
        }

        /*
         * Vérifier que la catégorie appartient
         * bien à l'événement actuel.
         */
        const currentEvent = getEventById(eventId);

        const categoryExists =
          currentEvent?.categories.some(
            (category) => category.id === catId,
          );

        if (!categoryExists) {
          return {};
        }

        /*
         * SiloCamp :
         *
         * Une seule catégorie
         * Une seule place.
         */
        return {
          [catId]: 1,
        };
      });
    },
    [eventId],
  );

  /* =======================================================
     AJOUTER UNE PLACE
  ======================================================= */

  const increment = useCallback(
    (catId: string) => {
      const currentEvent = getEventById(eventId);

      const categoryExists =
        currentEvent?.categories.some(
          (category) => category.id === catId,
        );

      if (!categoryExists) {
        return;
      }

      /*
       * Une seule réservation autorisée.
       */
      setQuantities({
        [catId]: 1,
      });
    },
    [eventId],
  );

  /* =======================================================
     RETIRER UNE PLACE
  ======================================================= */

  const decrement = useCallback((catId: string) => {
    setQuantities((previous) => {
      if (!previous[catId]) {
        return previous;
      }

      return {};
    });
  }, []);

  /* =======================================================
     VIDER LA RÉSERVATION
  ======================================================= */

  const clear = useCallback(() => {
    setQuantities({});
  }, []);

  /* =======================================================
     CALCUL DES LIGNES
  ======================================================= */

  const { lines, total, count } = useMemo(() => {
    /*
     * SiloCamp fonctionne avec :
     *
     * 0 ou 1 billet.
     */
    if (!event) {
      return {
        lines: [] as CartLine[],
        total: 0 as const,
        count: 0 as const,
      };
    }

    /*
     * Trouver la première catégorie réellement
     * sélectionnée.
     */
    const selectedCategory = event.categories.find(
      (category) => quantities[category.id] > 0,
    );

    if (!selectedCategory) {
      return {
        lines: [] as CartLine[],
        total: 0 as const,
        count: 0 as const,
      };
    }

    /*
     * Une seule place.
     *
     * Participation gratuite :
     * subtotal = 0.
     */
    const line: CartLine = {
      category: selectedCategory,
      quantity: 1,
      subtotal: 0,
    };

    return {
      lines: [line],
      total: 0 as const,
      count: 1 as const,
    };
  }, [event, quantities]);

  /* =======================================================
     VALEUR DU CONTEXT
  ======================================================= */

  const value: CartContextValue = {
    eventId,

    setEvent,

    quantities,

    setQuantity,

    increment,

    decrement,

    clear,

    count,

    total,

    lines,

    event,
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/* =========================================================
   HOOK useCart
========================================================= */

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart doit être utilisé dans un CartProvider",
    );
  }

  return context;
}