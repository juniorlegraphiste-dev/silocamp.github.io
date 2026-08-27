/**
 * =========================================================
 * EVENTS — SILOCAMP
 * =========================================================
 *
 * Données des événements du Camp International Silo 2026.
 *
 * Règles SiloCamp :
 * - Un seul événement
 * - Une seule catégorie : Participation
 * - Participation 100 % gratuite
 * - 1 participant = 1 billet
 * - 1 réservation = 1 billet
 * - Capacité maximale : 1500 participants
 *
 * IMPORTANT :
 * La disponibilité réelle des billets est contrôlée
 * par ticketService.ts.
 *
 * La propriété "sold" sert uniquement à l'affichage
 * statique dans le MVP et ne constitue pas la source
 * de vérité des réservations.
 * =========================================================
 */

import hero from "@/assets/hero.jpg";
import artist from "@/assets/artist.jpg";
import stadium from "@/assets/event-stadium.jpg";
import choir from "@/assets/event-choir.jpg";
import ambiance from "@/assets/ambiance.jpg";

/* =========================================================
   TYPES
========================================================= */

export type TicketCategory = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  badge?: string;
  featured?: boolean;
  perks: string[];
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;

  city: string;
  venue: string;
  address: string;

  dateISO: string;
  dateLabel: string;
  time: string;
  doors: string;
  duration: string;

  /* =======================================================
     CAPACITÉ
  ======================================================= */

  capacity: number;

  /**
   * Nombre de billets vendus connu par les données
   * statiques du MVP.
   *
   * IMPORTANT :
   * Ce champ n'est pas utilisé comme source de vérité
   * pour les réservations.
   *
   * La vraie disponibilité est contrôlée par
   * ticketService.ts.
   */
  sold: number;

  /* =======================================================
     CONTENU
  ======================================================= */

  shortDesc: string;
  description: string[];

  /* =======================================================
     IMAGES
  ======================================================= */

  cover: string;
  gallery: string[];

  /* =======================================================
     CATÉGORIES
  ======================================================= */

  categories: TicketCategory[];

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  featured?: boolean;

  status:
    | "Inscriptions ouvertes"
    | "Complet"
    | "Dernières places";
};

/* =========================================================
   CONSTANTES SILOCAMP
========================================================= */

/**
 * Capacité maximale du Camp International Silo.
 *
 * Cette valeur doit rester cohérente avec ticketService.ts.
 */
export const MAX_TICKETS = 1500;

/**
 * Nombre maximum de billets par réservation.
 *
 * SiloCamp :
 * 1 participant = 1 billet.
 */
export const MAX_TICKETS_PER_RESERVATION = 1;

/* =========================================================
   CATÉGORIE UNIQUE
========================================================= */

export const participationCategory: TicketCategory = {
  id: "participation",

  name: "Participation",

  tagline:
    "Réservez gratuitement votre place au Camp International Silo.",

  price: 0,

  badge: "Gratuit",

  featured: true,

  perks: [
    "Accès complet au Camp International Silo",
    "E-billet numérique avec QR Code",
    "Confirmation d'inscription par e-mail",
    "Accès aux sessions de prière, enseignement et louange",
  ],
};

/* =========================================================
   LISTE DES ÉVÉNEMENTS
========================================================= */

export const events: EventItem[] = [
  {
    id: "cis-casablanca-2026",

    slug: "camp-international-silo-2026",

    title: "Camp International Silo 2026",

    city: "Casablanca",

    venue: "Le Carré d'Or",

    address:
      "Le Carré d'Or, Route de l'Oasis, Casablanca 20000",

    /* =====================================================
       DATE & HORAIRE
    ===================================================== */

    /*
     * IMPORTANT :
     * L'heure affichée sur le site est 09h00.
     *
     * On garde donc 09:00 dans dateISO pour éviter
     * toute incohérence entre les données et l'interface.
     */
    dateISO: "2026-12-12T09:00:00+01:00",

    dateLabel: "Samedi 12 Décembre 2026",

    time: "09h00",

    doors: "08h00",

    duration: "9 heures",

    /* =====================================================
       CAPACITÉ
    ===================================================== */

    capacity: MAX_TICKETS,

    /*
     * Valeur statique pour le MVP.
     *
     * La vraie quantité réservée est gérée par
     * ticketService.ts.
     */
    sold: 0,

    /* =====================================================
       DESCRIPTION
    ===================================================== */

    shortDesc:
      "Le Camp International Silo est un rassemblement de foi réunissant des participants de plusieurs pays autour de la prière, de l'enseignement et de la louange.",

    description: [
      "Le Camp International Silo est un rassemblement exceptionnel qui réunit des participants venus de différents pays autour d'un même objectif : vivre des moments intenses de communion, d'enseignement, de prière et de louange.",

      "Après votre inscription, un e-billet personnel avec QR Code vous sera envoyé afin de faciliter votre accès le jour de l'événement.",
    ],

    /* =====================================================
       IMAGES
    ===================================================== */

    cover: hero,

    gallery: [
      stadium,
      artist,
      choir,
      ambiance,
    ],

    /* =====================================================
       CATÉGORIE UNIQUE
    ===================================================== */

    categories: [participationCategory],

    /* =====================================================
       ÉVÉNEMENT MIS EN AVANT
    ===================================================== */

    featured: true,

    /* =====================================================
       STATUT INITIAL
    ===================================================== */

    status: "Inscriptions ouvertes",
  },
];

/* =========================================================
   ÉVÉNEMENT MIS EN AVANT
========================================================= */

export const featuredEvent = events[0];

/* =========================================================
   RÉCUPÉRER UN ÉVÉNEMENT
========================================================= */

export function getEventById(
  id: string,
): EventItem | undefined {
  return events.find(
    (event) =>
      event.id === id ||
      event.slug === id,
  );
}

/* =========================================================
   CATÉGORIES DE BILLETS
========================================================= */

/**
 * Compatibilité avec les anciens composants
 * qui utilisent encore "ticketTiers".
 *
 * SiloCamp ne possède qu'une seule catégorie :
 *
 * Participation — Gratuit
 */
export const ticketTiers: TicketCategory[] = [
  participationCategory,
];

/* =========================================================
   NOMBRE DE BILLETS RESTANTS
========================================================= */

/**
 * Retourne le nombre de billets restants selon
 * les données statiques de l'événement.
 *
 * IMPORTANT :
 * Pour la réservation réelle, utiliser
 * ticketService.ts.
 */
export function getRemainingTickets(
  event: EventItem,
): number {
  return Math.max(
    0,
    event.capacity - event.sold,
  );
}

/* =========================================================
   ÉVÉNEMENT COMPLET
========================================================= */

/**
 * Vérifie si l'événement est complet selon
 * les données statiques.
 */
export function isEventFull(
  event: EventItem,
): boolean {
  return event.sold >= event.capacity;
}

/* =========================================================
   VÉRIFICATION D'UNE RÉSERVATION
========================================================= */

/**
 * Vérifie si une quantité peut être réservée
 * selon les règles SiloCamp.
 *
 * Règle :
 * 1 participant = 1 billet.
 */
export function canReserveTickets(
  event: EventItem,
  quantity: number,
): boolean {
  /*
   * Quantité invalide.
   */
  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return false;
  }

  /*
   * SiloCamp :
   * une réservation ne peut contenir
   * qu'un seul billet.
   */
  if (
    quantity >
    MAX_TICKETS_PER_RESERVATION
  ) {
    return false;
  }

  /*
   * Vérification de la capacité statique.
   */
  return (
    event.sold + quantity <=
    event.capacity
  );
}

/* =========================================================
   STATUT AUTOMATIQUE
========================================================= */

/**
 * Retourne le statut d'un événement selon
 * son nombre de places restantes.
 *
 * Cette fonction utilise les données statiques
 * de "sold".
 *
 * Pour les réservations réelles, ticketService.ts
 * reste la source de vérité.
 */
export function getEventStatus(
  event: EventItem,
): EventItem["status"] {
  const remaining =
    getRemainingTickets(event);

  /*
   * Plus aucune place.
   */
  if (remaining <= 0) {
    return "Complet";
  }

  /*
   * Moins de 10 % des places disponibles.
   */
  if (
    remaining <=
    Math.ceil(event.capacity * 0.1)
  ) {
    return "Dernières places";
  }

  return "Inscriptions ouvertes";
}