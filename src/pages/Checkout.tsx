import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import PhoneInput, {
  isValidPhoneNumber,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";

import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Ticket,
  Users,
} from "lucide-react";

import { useCart, type CartLine } from "@/context/CartContext";
import { Reveal } from "@/components/Reveal";

import {
  createTicket,
  checkTicketAvailability,
  getTicketByEmail,
  getTicketByPhone,
} from "@/services/ticketService";

import { generateReservationId } from "@/utils/format";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hasChildren: boolean;
  childrenUnder12: number;
  children12Plus: number;
};

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  hasChildren: false,
  childrenUnder12: 0,
  children12Plus: 0,
};

export type Order = {
  reservationId: string;
  ticketNumber: string;
  eventId: string;
  eventTitle: string;
  city: string;
  venue: string;
  dateLabel: string;
  time: string;
  lines: CartLine[];
  total: number;
  count: number;

  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  children: {
    hasChildren: boolean;
    under12: number;
    age12Plus: number;
    total: number;
  };

  createdAt: string;
  ticketId?: string;
  verificationToken?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}

function isValidEmail(email: string): boolean {
  const value = normalizeEmail(email);

  if (!value) {
    return false;
  }

  if (value.length > 254) {
    return false;
  }

  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(
    value,
  );
}

export default function Checkout() {
  const {
    event,
    quantities,
    setQuantity,
    lines,
    clear,
  } = useCart();

  const navigate = useNavigate();

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [errors, setErrors] =
    useState<Errors>({});

  const [submitError, setSubmitError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const participationCategory =
    event?.categories?.[0];

  const participationCategoryId =
    participationCategory?.id ?? "";

  const participationQuantity =
    participationCategoryId
      ? quantities[participationCategoryId] ?? 0
      : 0;

  useEffect(() => {
    if (!participationCategoryId) {
      return;
    }

    if (participationQuantity > 1) {
      setQuantity(
        participationCategoryId,
        1,
      );
    }
  }, [
    participationCategoryId,
    participationQuantity,
    setQuantity,
  ]);

  const set = (
    key: keyof FormState,
    value: string | boolean | number,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));

    setSubmitError("");
  };

  const selectChildrenOption = (
    hasChildren: boolean,
  ) => {
    setForm((current) => ({
      ...current,
      hasChildren,
      ...(hasChildren
        ? {}
        : {
            childrenUnder12: 0,
            children12Plus: 0,
          }),
    }));

    setErrors((current) => ({
      ...current,
      hasChildren: undefined,
      childrenUnder12: undefined,
      children12Plus: undefined,
    }));

    setSubmitError("");
  };

  const changeChildrenCount = (
    field:
      | "childrenUnder12"
      | "children12Plus",
    delta: number,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: Math.max(
        0,
        current[field] + delta,
      ),
    }));

    setErrors((current) => ({
      ...current,
      childrenUnder12: undefined,
      children12Plus: undefined,
    }));

    setSubmitError("");
  };

  const validate = async (): Promise<boolean> => {
    const nextErrors: Errors = {};

    const firstName =
      form.firstName.trim();

    if (!firstName) {
      nextErrors.firstName =
        "Prénom requis.";
    } else if (firstName.length < 2) {
      nextErrors.firstName =
        "Le prénom doit contenir au moins 2 caractères.";
    }

    const lastName =
      form.lastName.trim();

    if (!lastName) {
      nextErrors.lastName =
        "Nom requis.";
    } else if (lastName.length < 2) {
      nextErrors.lastName =
        "Le nom doit contenir au moins 2 caractères.";
    }

    const email =
      normalizeEmail(form.email);

    if (!email) {
      nextErrors.email =
        "E-mail requis.";
    } else if (!isValidEmail(email)) {
      nextErrors.email =
        "Adresse e-mail invalide.";
    } else {
      const existingTickets =
        await getTicketByEmail(email);

      if (existingTickets.length > 0) {
        nextErrors.email =
          "Cette adresse e-mail a déjà été utilisée pour une participation.";
      }
    }

    const phone =
      normalizePhone(form.phone);

    if (!phone) {
      nextErrors.phone =
        "Téléphone requis.";
    } else if (!isValidPhoneNumber(phone)) {
      nextErrors.phone =
        "Numéro de téléphone invalide.";
    } else {
      const digits =
        phone.replace(/\D/g, "");

      if (
        digits.length < 8 ||
        digits.length > 15
      ) {
        nextErrors.phone =
          "Numéro de téléphone invalide.";
      } else {
        const existingTickets =
          await getTicketByPhone(phone);

        if (existingTickets.length > 0) {
          nextErrors.phone =
            "Ce numéro de téléphone a déjà été utilisé pour une participation.";
        }
      }
    }

    if (form.hasChildren) {
      const totalChildren =
        form.childrenUnder12 +
        form.children12Plus;

      if (totalChildren <= 0) {
        nextErrors.childrenUnder12 =
          "Veuillez indiquer le nombre d'enfants.";
      }
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const submit = async () => {
    if (submitting) {
      return;
    }

    if (!participationCategory) {
      setSubmitError(
        "La participation n'est pas disponible pour cet événement.",
      );
      return;
    }

    if (participationQuantity <= 0) {
      setSubmitError(
        "Veuillez sélectionner votre participation.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (participationQuantity !== 1) {
      setQuantity(
        participationCategory.id,
        1,
      );

      setSubmitError(
        "Une seule place peut être réservée par participant.",
      );

      return;
    }

    if (!(await validate())) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const normalizedEmail =
      normalizeEmail(form.email);

    const normalizedPhone =
      normalizePhone(form.phone);

    const childrenUnder12 =
      form.hasChildren
        ? Math.max(
            0,
            form.childrenUnder12,
          )
        : 0;

    const children12Plus =
      form.hasChildren
        ? Math.max(
            0,
            form.children12Plus,
          )
        : 0;

    const totalChildren =
      childrenUnder12 +
      children12Plus;

    setSubmitting(true);
    setSubmitError("");

    try {
      const availability =
        await checkTicketAvailability(1);

      if (!availability.available) {
        setSubmitError(
          availability.message ??
            "Les places demandées ne sont plus disponibles.",
        );

        setSubmitting(false);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const existingEmailTickets =
        await getTicketByEmail(
          normalizedEmail,
        );

      if (existingEmailTickets.length > 0) {
        setErrors((current) => ({
          ...current,
          email:
            "Cette adresse e-mail a déjà été utilisée pour une participation.",
        }));

        setSubmitting(false);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const existingPhoneTickets =
        await getTicketByPhone(
          normalizedPhone,
        );

      if (existingPhoneTickets.length > 0) {
        setErrors((current) => ({
          ...current,
          phone:
            "Ce numéro de téléphone a déjà été utilisé pour une participation.",
        }));

        setSubmitting(false);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const firstName =
        form.firstName.trim();

      const lastName =
        form.lastName.trim();

      const participantName =
        `${firstName} ${lastName}`;

      const reservationId =
        generateReservationId();

      const ticket =
        await createTicket({
          firstName,
          lastName,
          participantName,
          email: normalizedEmail,
          phone: normalizedPhone,
          reservationId,
          eventId: event.id,
          eventTitle: event.title,
          dateLabel: event.dateLabel,
          time: event.time,
          duration: event.duration,
          venue: event.venue,
          city: event.city,
          quantity: 1,
        });

      const order: Order = {
        reservationId,

        ticketId: ticket.id,

        verificationToken:
          ticket.verificationToken,

        ticketNumber:
          ticket.ticketNumber,

        eventId: event.id,

        eventTitle: event.title,

        city: event.city,

        venue: event.venue,

        dateLabel: event.dateLabel,

        time: event.time,

        lines: [
          {
            category:
              participationCategory,
            quantity: 1,
            subtotal: 0,
          },
        ],

        total: 0,

        count: 1,

        customer: {
          firstName,
          lastName,
          email: normalizedEmail,
          phone: normalizedPhone,
        },

        children: {
          hasChildren:
            form.hasChildren,
          under12:
            childrenUnder12,
          age12Plus:
            children12Plus,
          total:
            totalChildren,
        },

        createdAt:
          new Date().toISOString(),
      };

      try {
        sessionStorage.setItem(
          "silocamp-last-order",
          JSON.stringify(order),
        );

        sessionStorage.setItem(
          "wg-last-order",
          JSON.stringify(order),
        );
      } catch (storageError) {
        console.warn(
          "[SiloCamp] Impossible de sauvegarder la réservation dans sessionStorage.",
          storageError,
        );
      }

      clear();

      navigate("/confirmation", {
        state: {
          eventId: event.id,

          ticketId: ticket.id,

          ticketNumber:
            ticket.ticketNumber,

          verificationToken:
            ticket.verificationToken,

          reservationId,

          participantName,

          email:
            normalizedEmail,

          phone:
            normalizedPhone,

          children: {
            hasChildren:
              form.hasChildren,
            under12:
              childrenUnder12,
            age12Plus:
              children12Plus,
            total:
              totalChildren,
          },
        },
      });
    } catch (error) {
      console.error(
        "[SiloCamp] Erreur lors de la création du billet :",
        error,
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la réservation.",
      );

      setSubmitting(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const cancelReservation = () => {
    if (submitting) {
      return;
    }

    const confirmed =
      window.confirm(
        "Voulez-vous vraiment annuler votre participation ?",
      );

    if (!confirmed) {
      return;
    }

    clear();

    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError("");

    navigate(
      `/evenement/${event?.slug ?? ""}`,
    );
  };

  if (!event) {
    return (
      <div className="container-px mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center py-32">
        <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <h1 className="font-display text-3xl text-cream">
            Réservation indisponible
          </h1>

          <p className="mt-3 text-sm text-cream-dim">
            L'événement demandé est introuvable.
          </p>

          <Link
            to="/evenements"
            className="btn-gold mt-6 inline-flex"
          >
            Voir les événements
          </Link>
        </div>
      </div>
    );
  }

  if (!participationCategory) {
    return (
      <div className="container-px mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center py-32">
        <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <h1 className="font-display text-3xl text-cream">
            Réservation indisponible
          </h1>

          <p className="mt-3 text-sm text-cream-dim">
            Aucune catégorie de
            participation n'est configurée
            pour cet événement.
          </p>

          <Link
            to="/evenements"
            className="btn-gold mt-6 inline-flex"
          >
            Voir les événements
          </Link>
        </div>
      </div>
    );
  }

  if (participationQuantity === 0) {
    return (
      <EmptyCart
        eventSlug={event.slug}
      />
    );
  }

  const totalChildren =
    form.hasChildren
      ? form.childrenUnder12 +
        form.children12Plus
      : 0;

  return (
    <div className="container-px mx-auto max-w-7xl pb-28 pt-28 md:pt-32 lg:pb-20">
      <Reveal className="mb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-gold-300">
          <CheckCircle2 className="h-4 w-4" />
          Étape 2 sur 2 · Confirmation
        </span>

        <h1 className="mt-5 font-display text-4xl font-medium text-cream sm:text-5xl">
          Confirmez votre{" "}
          <span className="text-gold-gradient">
            réservation
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-cream-dim">
          Vérifiez vos informations puis
          confirmez votre participation pour
          recevoir votre e-billet avec QR Code.
        </p>
      </Reveal>

      {submitError && (
        <Reveal className="mx-auto mb-8 max-w-3xl">
          <div
            role="alert"
            className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-center"
          >
            <p className="text-sm font-medium text-red-300">
              {submitError}
            </p>
          </div>
        </Reveal>
      )}

      <Steps current={2} />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
        <div className="space-y-10">
          <Section
            title="Votre réservation"
            subtitle={event.title}
          >
            <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-cream-dim">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gold-300" />

                <span>
                  {event.dateLabel} ·{" "}
                  {event.time}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold-300" />

                <span>
                  {event.venue},{" "}
                  {event.city}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-gold-400/40 bg-gold-400/5 p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-xl text-cream">
                      Participation
                    </h3>

                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                      Gratuit
                    </span>
                  </div>

                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-cream-faint">
                    Réservez gratuitement votre
                    place au Camp International
                    Silo 2026. Votre e-billet avec
                    QR Code sera généré après
                    confirmation.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-gold-400/15 px-3 py-1 text-xs text-cream-faint">
                      ✓ Accès au Camp
                    </span>

                    <span className="rounded-full border border-gold-400/15 px-3 py-1 text-xs text-cream-faint">
                      ✓ E-billet
                    </span>

                    <span className="rounded-full border border-gold-400/15 px-3 py-1 text-xs text-cream-faint">
                      ✓ QR Code
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  <div className="flex h-10 min-w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-300">
                    1 place
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section
            title="Vos informations"
            subtitle="Ces informations seront utilisées pour générer votre e-billet."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Prénom"
                value={form.firstName}
                onChange={(value) =>
                  set("firstName", value)
                }
                error={errors.firstName}
                autoComplete="given-name"
              />

              <Field
                label="Nom"
                value={form.lastName}
                onChange={(value) =>
                  set("lastName", value)
                }
                error={errors.lastName}
                autoComplete="family-name"
              />

              <Field
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(value) =>
                  set("email", value)
                }
                error={errors.email}
                autoComplete="email"
                className="sm:col-span-2"
                placeholder="exemple@email.com"
              />

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-cream">
                  Téléphone
                </label>

                <div className="phone-wrapper">
                  <PhoneInput
                    international
                    defaultCountry="MA"
                    value={
                      form.phone ||
                      undefined
                    }
                    onChange={(value) =>
                      set(
                        "phone",
                        value ?? "",
                      )
                    }
                    placeholder="Entrez votre numéro"
                    countryCallingCodeEditable={
                      false
                    }
                  />
                </div>

                {errors.phone && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-gold-400/15 bg-gold-400/5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300">
                  <Users className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <h3 className="font-display text-xl text-cream">
                    Venez-vous avec des enfants ?
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-cream-dim">
                    Cette information nous aide
                    à mieux préparer l'accueil des
                    familles.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        selectChildrenOption(
                          false,
                        )
                      }
                      className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                        !form.hasChildren
                          ? "border-gold-400 bg-gold-400/10 text-gold-300"
                          : "border-white/10 bg-white/[0.03] text-cream-dim hover:border-gold-400/30 hover:text-cream"
                      }`}
                    >
                      Non
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        selectChildrenOption(
                          true,
                        )
                      }
                      className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                        form.hasChildren
                          ? "border-gold-400 bg-gold-400/10 text-gold-300"
                          : "border-white/10 bg-white/[0.03] text-cream-dim hover:border-gold-400/30 hover:text-cream"
                      }`}
                    >
                      Oui
                    </button>
                  </div>

                  {form.hasChildren && (
                    <div className="mt-6 border-t border-gold-400/10 pt-6">
                      <div className="mb-5">
                        <h4 className="font-medium text-cream">
                          Combien d'enfants vous accompagnent ?
                        </h4>

                        <p className="mt-1 text-xs text-cream-faint">
                          Indiquez leur tranche d'âge.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <ChildrenCounter
                          label="Moins de 12 ans"
                          value={
                            form.childrenUnder12
                          }
                          onDecrease={() =>
                            changeChildrenCount(
                              "childrenUnder12",
                              -1,
                            )
                          }
                          onIncrease={() =>
                            changeChildrenCount(
                              "childrenUnder12",
                              1,
                            )
                          }
                        />

                        <ChildrenCounter
                          label="12 ans ou plus"
                          value={
                            form.children12Plus
                          }
                          onDecrease={() =>
                            changeChildrenCount(
                              "children12Plus",
                              -1,
                            )
                          }
                          onIncrease={() =>
                            changeChildrenCount(
                              "children12Plus",
                              1,
                            )
                          }
                        />
                      </div>

                      {errors.childrenUnder12 && (
                        <p className="mt-3 text-xs text-red-400">
                          {
                            errors.childrenUnder12
                          }
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                        <span className="text-sm text-cream-dim">
                          Total enfants
                        </span>

                        <span className="font-semibold text-emerald-300">
                          {totalChildren}{" "}
                          enfant
                          {totalChildren >
                          1
                            ? "s"
                            : ""}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
              <p className="text-xs leading-relaxed text-cream-faint">
                Vos informations permettent de
                générer votre e-billet personnel
                et de sécuriser votre accès grâce
                à un QR Code unique.
              </p>
            </div>
          </Section>

          <Section
            title="Confirmation de votre participation"
            subtitle="Vérifiez vos informations avant de valider votre inscription."
          >
            <div className="rounded-2xl border border-gold-400/15 bg-ink-950/40 p-6">
              <div className="space-y-5">
                <ConfirmationItem
                  title="Participation gratuite"
                  text="Votre inscription est totalement gratuite. Aucun paiement ne sera demandé."
                />

                <ConfirmationItem
                  title="Un seul billet par participant"
                  text="Chaque participant peut réserver une seule place pour le Camp International Silo 2026."
                />

                <ConfirmationItem
                  title="E-billet personnel"
                  text="Un e-billet avec QR Code unique sera généré automatiquement après validation."
                />

                <ConfirmationItem
                  title="Entrée simplifiée"
                  text="Présentez votre QR Code à l'accueil du Camp pour accéder rapidement à l'événement."
                />

                {form.hasChildren &&
                  totalChildren > 0 && (
                    <ConfirmationItem
                      title="Accompagnement familial"
                      text={`${totalChildren} enfant${
                        totalChildren >
                        1
                          ? "s"
                          : ""
                      } vous accompagnera${
                        totalChildren >
                        1
                          ? "ont"
                          : ""
                      } pendant le Camp.`}
                    />
                  )}
              </div>

              <div className="mt-6 rounded-2xl border border-gold-400/15 bg-gold-400/5 p-4">
                <p className="text-sm leading-relaxed text-cream-dim">
                  En cliquant sur{" "}
                  <span className="font-semibold text-cream">
                    « Confirmer ma participation »
                  </span>
                  , votre inscription sera
                  enregistrée et votre e-billet
                  sera généré.
                </p>
              </div>
            </div>
          </Section>
        </div>

        <aside>
          <Summary
            lines={lines}
            hasChildren={
              form.hasChildren
            }
            childrenUnder12={
              form.childrenUnder12
            }
            children12Plus={
              form.children12Plus
            }
            onSubmit={submit}
            onCancel={
              cancelReservation
            }
            submitting={submitting}
          />
        </aside>
      </div>
    </div>
  );
}

function Steps({
  current,
}: {
  current: number;
}) {
  const steps = [
    "Événement",
    "Réservation",
    "Confirmation",
  ];

  return (
    <div className="mx-auto flex max-w-2xl items-center justify-between">
      {steps.map((step, index) => {
        const stepNumber = index + 1;

        return (
          <div
            key={step}
            className="flex flex-1 items-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ${
                  stepNumber < current
                    ? "border-gold-400 bg-gold-400 text-ink-950"
                    : stepNumber === current
                      ? "border-gold-400 bg-gold-400/10 text-gold-300"
                      : "border-gold-400/20 bg-transparent text-cream-faint"
                }`}
              >
                {stepNumber < current ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">
                    {stepNumber}
                  </span>
                )}
              </div>

              <span
                className={`text-center text-[10px] font-medium uppercase tracking-[0.15em] sm:text-[11px] sm:tracking-[0.2em] ${
                  stepNumber <= current
                    ? "text-gold-300"
                    : "text-cream-faint"
                }`}
              >
                {step}
              </span>
            </div>

            {index <
              steps.length - 1 && (
              <div
                className={`mx-2 h-[2px] flex-1 rounded-full sm:mx-4 ${
                  stepNumber < current
                    ? "bg-gold-400"
                    : "bg-gold-400/15"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <section className="rounded-3xl border border-gold-400/12 bg-ink-900/40 p-6 sm:p-8">
        <div className="mb-6 border-b border-gold-400/10 pb-5">
          <h2 className="font-display text-2xl font-medium text-cream">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-cream-dim">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </section>
    </Reveal>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "email"
    | "tel";
  className?: string;
}) {
  return (
    <label
      className={`block ${
        className ?? ""
      }`}
    >
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-cream-dim">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={`w-full rounded-xl border bg-ink-950/50 px-4 py-3 text-sm text-cream placeholder:text-cream-faint transition-colors focus:outline-none ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gold-400/20 focus:border-gold-400/60"
        }`}
      />

      {error && (
        <span className="mt-1 block text-xs text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}

function ConfirmationItem({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
        ✓
      </div>

      <div>
        <h4 className="font-medium text-cream">
          {title}
        </h4>

        <p className="mt-1 text-sm leading-relaxed text-cream-dim">
          {text}
        </p>
      </div>
    </div>
  );
}

function Summary({
  lines,
  hasChildren,
  childrenUnder12,
  children12Plus,
  onSubmit,
  onCancel,
  submitting,
}: {
  lines: CartLine[];
  hasChildren: boolean;
  childrenUnder12: number;
  children12Plus: number;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const childrenTotal =
    hasChildren
      ? childrenUnder12 +
        children12Plus
      : 0;

  return (
    <div className="lg:sticky lg:top-24">
      <div className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-gold-400/12 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300">
              <Ticket className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-medium text-cream">
                Votre inscription
              </h2>

              <p className="mt-1 text-xs text-cream-faint">
                Camp International Silo
                2026
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {lines.length > 0 ? (
            lines.map((line) => (
              <div
                key={
                  line.category.id
                }
                className="flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-cream">
                      Participation
                    </span>

                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                      Gratuit
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-cream-faint">
                    1 place réservée
                  </p>
                </div>

                <span className="text-sm font-medium text-emerald-300">
                  Offerte
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-cream-faint">
              Aucune participation sélectionnée.
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-gold-400/12 p-6">
          <Row
            label="Participant"
            value="1 personne"
          />

          <Row
            label="Billet"
            value="E-billet gratuit"
          />

          <Row
            label="Accès"
            value="QR Code sécurisé"
          />

          <Row
            label="Enfants"
            value={
              hasChildren
                ? `${childrenTotal} enfant${
                    childrenTotal >
                    1
                      ? "s"
                      : ""
                  }`
                : "Aucun"
            }
          />

          {hasChildren &&
            childrenTotal > 0 && (
              <div className="rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-cream-faint">
                <div className="flex justify-between">
                  <span>
                    Moins de 12 ans
                  </span>

                  <span className="text-cream">
                    {childrenUnder12}
                  </span>
                </div>

                <div className="mt-1 flex justify-between">
                  <span>
                    12 ans ou plus
                  </span>

                  <span className="text-cream">
                    {children12Plus}
                  </span>
                </div>
              </div>
            )}

          <div className="my-2 h-px bg-gold-400/12" />

          <div className="flex items-center justify-between">
            <span className="font-display text-lg text-cream">
              Total
            </span>

            <span className="font-display text-2xl font-semibold text-emerald-300">
              Gratuit
            </span>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="btn-gold flex w-full items-center justify-center gap-2 text-base disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Confirmation...
              </>
            ) : (
              <>
                Confirmer ma participation
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="mt-3 w-full rounded-full border border-red-400/20 bg-red-400/5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler ma réservation
          </button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-cream-faint">
            1 billet par participant •
            Inscription 100 % gratuite • QR
            Code sécurisé
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-cream-dim">
      <span>{label}</span>

      <span className="text-right text-cream">
        {value}
      </span>
    </div>
  );
}

function EmptyCart({
  eventSlug,
}: {
  eventSlug: string;
}) {
  return (
    <div className="container-px mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center py-32 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold-400/20 bg-gold-400/5 text-gold-300">
        <Ticket
          className="h-9 w-9"
          strokeWidth={1.5}
        />
      </div>

      <h1 className="mt-8 font-display text-4xl text-cream">
        Aucune participation sélectionnée
      </h1>

      <p className="mt-4 max-w-lg text-lg leading-relaxed text-cream-dim">
        Vous n'avez pas encore sélectionné
        votre participation au{" "}
        <span className="font-medium text-gold-300">
          Camp International Silo 2026
        </span>
        .
      </p>

      <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
        <h3 className="flex items-center justify-center gap-2 font-display text-xl text-cream">
          <BadgeCheck className="h-6 w-6 text-emerald-400" />
          Réservation 100 % gratuite
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-cream-dim">
          Une seule place peut être réservée
          par participant. Aucun paiement n'est
          demandé.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/evenement/${eventSlug}`}
          className="btn-gold group inline-flex items-center gap-2"
        >
          Réserver gratuitement

          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>

        <Link
          to="/contact"
          className="btn-ghost group inline-flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />

          Contacter l'organisation
        </Link>
      </div>
    </div>
  );
}

function ChildrenCounter({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="text-sm font-semibold text-cream">
          {label}
        </p>

        <p className="mt-1 text-xs text-cream-faint">
          Enfant(s)
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrease}
          disabled={value === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg text-cream transition hover:border-gold-400/40 hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Retirer un enfant ${label}`}
        >
          −
        </button>

        <span className="w-6 text-center text-base font-bold text-cream">
          {value}
        </span>

        <button
          type="button"
          onClick={onIncrease}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-lg text-gold-300 transition hover:bg-gold-400/20"
          aria-label={`Ajouter un enfant ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}