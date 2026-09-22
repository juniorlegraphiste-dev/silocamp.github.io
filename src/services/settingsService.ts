export type PublicEventSettings = {
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  capacity: number;
  registrationsOpen: boolean;
};

const DEFAULT_SETTINGS: PublicEventSettings = {
  eventName: "Camp International Silo 2026",
  eventDate: "2026-09-22",
  eventTime: "09:00",
  eventLocation: "Casablanca, Maroc",
  capacity: 1200,
  registrationsOpen: true,
};

export async function getPublicEventSettings(): Promise<PublicEventSettings> {
  try {
    const response = await fetch("/api/public/settings", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data?.ok || !data?.settings) {
      throw new Error(
        "Les paramètres de l'événement sont invalides.",
      );
    }

    return {
      ...DEFAULT_SETTINGS,
      ...data.settings,
      capacity: Number(
        data.settings.capacity ?? DEFAULT_SETTINGS.capacity,
      ),
      registrationsOpen: Boolean(
        data.settings.registrationsOpen,
      ),
    };
  } catch (error) {
    console.error(
      "[SiloCamp] Impossible de charger les paramètres publics :",
      error,
    );

    return DEFAULT_SETTINGS;
  }
}