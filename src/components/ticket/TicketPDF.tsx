import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import type { Ticket } from "@/services/ticketService";

// ============================================================
// FONTS
// ============================================================

import PoppinsRegular from "@/assets/fonts/Poppins-Regular.ttf?url";
import PoppinsMedium from "@/assets/fonts/Poppins-Medium.ttf?url";
import PoppinsSemiBold from "@/assets/fonts/Poppins-SemiBold.ttf?url";
import PoppinsBold from "@/assets/fonts/Poppins-Bold.ttf?url";

Font.register({
  family: "Poppins",
  fonts: [
    {
      src: PoppinsRegular,
      fontWeight: 400,
    },
    {
      src: PoppinsMedium,
      fontWeight: 500,
    },
    {
      src: PoppinsSemiBold,
      fontWeight: 600,
    },
    {
      src: PoppinsBold,
      fontWeight: 700,
    },
  ],
});

// ============================================================
// TYPES
// ============================================================

type TicketData = Ticket;

export interface TicketPDFProps {
  ticket: TicketData;
  verificationUrl?: string;
  qrCodeDataUrl?: string;
}

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  purple: "#24104F",
  purpleDark: "#180A35",
  purpleSoft: "#3A2370",

  gold: "#C8A45D",
  goldLight: "#E5CC91",

  cream: "#F8F4EA",
  creamDark: "#EEE7D8",

  white: "#FFFFFF",

  text: "#211A2E",
  textSoft: "#675F70",
  muted: "#948C99",

  green: "#087A58",
  greenSoft: "#E9F7F1",

  red: "#B42318",
  redSoft: "#FDECEC",

  border: "#DDD5C8",
  borderLight: "#E9E2D7",
};

// ============================================================
// STYLES
// A4 LANDSCAPE
// ============================================================

const styles = StyleSheet.create({
  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  page: {
    backgroundColor: "#EDE9E1",
    padding: 22,
    fontFamily: "Poppins",
  },

  // ----------------------------------------------------------
  // TICKET GLOBAL
  // ----------------------------------------------------------

  ticket: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 15,
    overflow: "hidden",
    position: "relative",
    flexDirection: "row",
  },

  // ----------------------------------------------------------
  // LEFT / MAIN SECTION
  // ----------------------------------------------------------

  main: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: COLORS.cream,
    justifyContent: "space-between",
  },

  // ----------------------------------------------------------
  // TOP HEADER
  // ----------------------------------------------------------

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  brandGroup: {
    flex: 1,
  },

  brand: {
    color: COLORS.purple,
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: 2,
    lineHeight: 1,
  },

  brandSub: {
    color: COLORS.text,
    fontSize: 7,
    fontWeight: 600,
    letterSpacing: 0.7,
    marginTop: 3,
  },

  themes: {
    color: COLORS.gold,
    fontSize: 5.5,
    fontWeight: 600,
    letterSpacing: 0.8,
    marginTop: 4,
  },

  // ----------------------------------------------------------
  // FREE BADGE
  // ----------------------------------------------------------

  freeBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 1,
  },

  freeBadgeText: {
    color: COLORS.purpleDark,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.7,
  },

  // ----------------------------------------------------------
  // EDITION
  // ----------------------------------------------------------

  edition: {
    color: COLORS.purple,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.8,
    marginTop: 7,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // ----------------------------------------------------------
  // HERO
  // ----------------------------------------------------------

  hero: {
    marginTop: 8,
  },

  heroTitle: {
    color: COLORS.purple,
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.08,
  },

  heroDescription: {
    color: COLORS.textSoft,
    fontSize: 6.8,
    fontWeight: 400,
    lineHeight: 1.35,
    marginTop: 4,
    maxWidth: 470,
  },

  // ----------------------------------------------------------
  // EVENT DETAILS
  // ----------------------------------------------------------

  eventGrid: {
    flexDirection: "row",
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
  },

  eventColumn: {
    paddingRight: 13,
    marginRight: 13,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },

  eventColumnLast: {
    borderRightWidth: 0,
    marginRight: 0,
    paddingRight: 0,
  },

  eventLabel: {
    color: COLORS.muted,
    fontSize: 5.2,
    fontWeight: 700,
    letterSpacing: 0.7,
    marginBottom: 2,
  },

  eventValue: {
    color: COLORS.text,
    fontSize: 7,
    fontWeight: 600,
  },

  eventValueSmall: {
    color: COLORS.text,
    fontSize: 6.4,
    fontWeight: 500,
  },

  // ----------------------------------------------------------
  // PARTICIPANT
  // ----------------------------------------------------------

  participantSection: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  participantInfo: {
    flex: 1,
    paddingRight: 15,
  },

  participantLabel: {
    color: COLORS.muted,
    fontSize: 5.3,
    fontWeight: 700,
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  participantName: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 700,
  },

  participantEmail: {
    color: COLORS.textSoft,
    fontSize: 6.5,
    marginTop: 1,
  },

  ticketNumberSection: {
    width: 145,
    alignItems: "flex-end",
  },

  ticketNumberLabel: {
    color: COLORS.muted,
    fontSize: 5.3,
    fontWeight: 700,
    letterSpacing: 0.7,
    marginBottom: 2,
  },

  ticketNumber: {
    color: COLORS.purple,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.2,
  },

  // ----------------------------------------------------------
  // BOTTOM INFORMATION
  // ----------------------------------------------------------

  bottomGrid: {
    flexDirection: "row",
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  bottomColumn: {
    flex: 1,
    paddingRight: 10,
  },

  bottomColumnReservation: {
    flex: 1.25,
  },

  bottomLabel: {
    color: COLORS.muted,
    fontSize: 5.1,
    fontWeight: 700,
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  bottomValue: {
    color: COLORS.text,
    fontSize: 6.4,
    fontWeight: 600,
  },

  bottomValueGreen: {
    color: COLORS.green,
  },

  // ----------------------------------------------------------
  // MAIN FOOTER
  // ----------------------------------------------------------

  mainFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },

  mainFooterWebsite: {
    color: COLORS.purple,
    fontSize: 6,
    fontWeight: 700,
  },

  mainFooterText: {
    color: COLORS.muted,
    fontSize: 5.2,
    fontWeight: 500,
  },

  // ----------------------------------------------------------
  // RIGHT COUPON / STUB
  // ----------------------------------------------------------

  stub: {
    width: 155,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 13,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },

  stubBrand: {
    color: COLORS.goldLight,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: 2,
    textAlign: "center",
  },

  stubEdition: {
    color: COLORS.white,
    fontSize: 6.3,
    fontWeight: 600,
    letterSpacing: 0.7,
    textAlign: "center",
    marginTop: 2,
  },

  stubLine: {
    width: 45,
    height: 1,
    backgroundColor: COLORS.gold,
    marginVertical: 5,
  },

  stubScan: {
    color: COLORS.goldLight,
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 0.8,
    textAlign: "center",
  },

  // ----------------------------------------------------------
  // QR
  // ----------------------------------------------------------

  stubQrFrame: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.white,
    borderRadius: 7,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },

  stubQr: {
    width: 88,
    height: 88,
  },

  qrUnavailable: {
    color: COLORS.muted,
    fontSize: 6,
    textAlign: "center",
  },

  // ----------------------------------------------------------
  // STUB TEXT
  // ----------------------------------------------------------

  stubDescription: {
    color: "#D9D1E8",
    fontSize: 5.5,
    lineHeight: 1.3,
    textAlign: "center",
    maxWidth: 120,
  },

  stubTicketLabel: {
    color: COLORS.goldLight,
    fontSize: 5,
    fontWeight: 600,
    letterSpacing: 0.6,
    textAlign: "center",
    marginTop: 5,
  },

  stubTicketNumber: {
    color: COLORS.white,
    fontSize: 6.2,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 2,
  },

  // ----------------------------------------------------------
  // CONFIRMED BADGE
  // ----------------------------------------------------------

  confirmedBadge: {
    backgroundColor: COLORS.greenSoft,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },

  confirmedText: {
    color: COLORS.green,
    fontSize: 5.7,
    fontWeight: 700,
    letterSpacing: 0.6,
  },

  // ----------------------------------------------------------
  // STUB FOOTER
  // ----------------------------------------------------------

  stubWebsite: {
    color: COLORS.goldLight,
    fontSize: 5.8,
    fontWeight: 600,
    textAlign: "center",
    marginTop: 4,
  },

  stubThemes: {
    color: "#D9D1E8",
    fontSize: 4.8,
    fontWeight: 500,
    letterSpacing: 0.35,
    textAlign: "center",
    marginTop: 2,
  },

  // ----------------------------------------------------------
  // VERTICAL PERFORATION
  // ----------------------------------------------------------

  verticalPerforation: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 155,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.gold,
    borderLeftStyle: "dashed",
  },

  // ----------------------------------------------------------
  // DECORATIVE GOLD BARS
  // ----------------------------------------------------------

  goldTop: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 60,
    height: 4,
    backgroundColor: COLORS.gold,
  },

  goldBottom: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 60,
    height: 4,
    backgroundColor: COLORS.gold,
  },
});

// ============================================================
// HELPERS
// ============================================================

function safeText(value?: string | number | null): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function formatCreatedAt(
  value?: string | Date | null
): string {
  if (!value) {
    return "";
  }

  try {
    const date =
      value instanceof Date
        ? value
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function getStatusLabel(
  status?: Ticket["status"]
): string {
  switch (status) {
    case "CANCELLED":
      return "ANNULÉ";

    case "USED":
      return "UTILISÉ";

    case "VALID":
    default:
      return "CONFIRMÉ";
  }
}

// ============================================================
// TICKET PDF
// ============================================================

export default function TicketPDF({
  ticket,
  qrCodeDataUrl,
}: TicketPDFProps) {
  const ticketNumber = safeText(
    ticket.ticketNumber
  );

  const participantName = safeText(
    ticket.participantName
  );

  const email = safeText(ticket.email);

  const eventTitle = safeText(
    ticket.eventTitle
  );

  const dateLabel = safeText(
    ticket.dateLabel
  );

  const time = safeText(ticket.time);

  const venue = safeText(ticket.venue);

  const city = safeText(ticket.city);

  const duration = safeText(
    ticket.duration
  );

  const reservationId = safeText(
    ticket.reservationId
  );

  const quantity = ticket.quantity ?? 1;

  const childrenUnder12 =
    ticket.childrenUnder12 ?? 0;

  const children12Plus =
    ticket.children12Plus ?? 0;

  const totalChildren =
    childrenUnder12 + children12Plus;

  const statusLabel = getStatusLabel(
    ticket.status
  );

  const createdAt = formatCreatedAt(
    ticket.createdAt
  );

  const isCancelled =
    ticket.status === "CANCELLED";

  const isUsed =
    ticket.status === "USED";

  return (
    <Document
      title={`SiloCamp - ${ticketNumber}`}
      author="SiloCamp"
      subject={`E-billet — ${eventTitle}`}
      creator="SiloCamp"
    >
      <Page
        size="A4"
        orientation="landscape"
        style={styles.page}
        wrap={false}
      >
        <View
          style={styles.ticket}
          wrap={false}
        >
          {/* GOLD DECORATION */}
          <View style={styles.goldTop} />
          <View style={styles.goldBottom} />

          {/* ==================================================
              MAIN LEFT SECTION
          ================================================== */}

          <View style={styles.main}>
            {/* HEADER */}
            <View>
              <View style={styles.header}>
                <View style={styles.brandGroup}>
                  <Text style={styles.brand}>
                    SILO
                  </Text>

                  <Text style={styles.brandSub}>
                    CAMP INTERNATIONAL SILO
                  </Text>

                  <Text style={styles.themes}>
                    GOSPEL • ADORATION • COMMUNION
                  </Text>
                </View>

                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>
                    ENTRÉE GRATUITE
                  </Text>
                </View>
              </View>

              {/* EDITION */}
              <Text style={styles.edition}>
                CAMP INTERNATIONAL SILO 2026
              </Text>

              {/* HERO */}
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>
                  VIVEZ LE FEU DU DANS{"\n"}
                  LA PRESENCE DE DIEU
                </Text>

                <Text style={styles.heroDescription}>
                  Un temps de communion,
                  d'enseignement, de prière,
                  de louange et d'adoration
                  autour de Jésus-Christ.
                </Text>
              </View>

              {/* ==================================================
                  DATE / HEURE / LIEU / DURÉE
              ================================================== */}

              <View style={styles.eventGrid}>
                {/* DATE */}
                <View style={styles.eventColumn}>
                  <Text style={styles.eventLabel}>
                    DATE
                  </Text>

                  <Text style={styles.eventValue}>
                    {dateLabel || "Samedi 12 décembre 2026"}
                  </Text>
                </View>

                {/* HEURE */}
                <View style={styles.eventColumn}>
                  <Text style={styles.eventLabel}>
                    HEURE
                  </Text>

                  <Text style={styles.eventValue}>
                    {time || "09:00"}
                  </Text>
                </View>

                {/* LIEU */}
                <View style={styles.eventColumn}>
                  <Text style={styles.eventLabel}>
                    LIEU
                  </Text>

                  <Text style={styles.eventValueSmall}>
                    {venue || "Le Carré d'or, Oasis, Casablanca"}
                  </Text>

                  {city ? (
                    <Text
                      style={[
                        styles.eventValueSmall,
                        {
                          marginTop: 1,
                          color: COLORS.textSoft,
                        },
                      ]}
                    >
                      {city}
                    </Text>
                  ) : null}
                </View>

                {/* DURÉE */}
                <View
                  style={[
                    styles.eventColumn,
                    styles.eventColumnLast,
                  ]}
                >
                  <Text style={styles.eventLabel}>
                    DURÉE
                  </Text>

                  <Text style={styles.eventValue}>
                    {duration || "9 heures"}
                  </Text>
                </View>
              </View>

              {/* ==================================================
                  PARTICIPANT
              ================================================== */}

              <View style={styles.participantSection}>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantLabel}>
                    PARTICIPANT
                  </Text>

                  <Text style={styles.participantName}>
                    {participantName || "Participant"}
                  </Text>

                  {email ? (
                    <Text
                      style={styles.participantEmail}
                    >
                      {email}
                    </Text>
                  ) : null}
                </View>

                <View
                  style={styles.ticketNumberSection}
                >
                  <Text
                    style={styles.ticketNumberLabel}
                  >
                    NUMÉRO DU BILLET
                  </Text>

                  <Text style={styles.ticketNumber}>
                    {ticketNumber || "SILO-2026"}
                  </Text>
                </View>
              </View>

              {/* ==================================================
                  BOTTOM INFORMATION
              ================================================== */}

              <View style={styles.bottomGrid}>
                {/* PLACES */}
                <View style={styles.bottomColumn}>
                  <Text style={styles.bottomLabel}>
                    PLACES
                  </Text>

                  <Text style={styles.bottomValue}>
                    {quantity} place
                    {quantity > 1 ? "s" : ""}
                  </Text>
                </View>

                {/* ENFANTS */}
                <View style={styles.bottomColumn}>
                  <Text style={styles.bottomLabel}>
                    ENFANTS
                  </Text>

                  <Text style={styles.bottomValue}>
                    {totalChildren}{" "}
                    {totalChildren > 1
                      ? "enfants"
                      : "enfant"}
                  </Text>

                  <Text
                    style={[
                      styles.bottomValue,
                      {
                        color: COLORS.muted,
                        fontSize: 5,
                        marginTop: 1,
                      },
                    ]}
                  >
                    ({childrenUnder12} &lt;12 /{" "}
                    {children12Plus} 12+)
                  </Text>
                </View>

                {/* TARIF */}
                <View style={styles.bottomColumn}>
                  <Text style={styles.bottomLabel}>
                    TARIF
                  </Text>

                  <Text style={styles.bottomValue}>
                    Gratuit
                  </Text>
                </View>

                {/* STATUT */}
                <View style={styles.bottomColumn}>
                  <Text style={styles.bottomLabel}>
                    STATUT
                  </Text>

                  <Text
                    style={[
                      styles.bottomValue,
                      !isCancelled && !isUsed
                        ? styles.bottomValueGreen
                        : undefined,
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>

                {/* RÉSERVATION */}
                <View
                  style={[
                    styles.bottomColumn,
                    styles.bottomColumnReservation,
                  ]}
                >
                  <Text style={styles.bottomLabel}>
                    RÉSERVATION
                  </Text>

                  <Text style={styles.bottomValue}>
                    {reservationId || "—"}
                  </Text>
                </View>
              </View>
            </View>

            {/* MAIN FOOTER */}
            <View style={styles.mainFooter}>
              <Text style={styles.mainFooterWebsite}>
                www.silocamp.org
              </Text>

              <Text style={styles.mainFooterText}>
                GOSPEL • ADORATION • COMMUNION
              </Text>

              <Text style={styles.mainFooterText}>
                {createdAt}
              </Text>
            </View>
          </View>

          {/* ==================================================
              RIGHT COUPON
          ================================================== */}

          <View style={styles.stub}>
            {/* TOP */}
            <View>
              <Text style={styles.stubBrand}>
                SILO
              </Text>

              <Text style={styles.stubEdition}>
                CAMP INTERNATIONAL 2026
              </Text>

              <View style={styles.stubLine} />

              <Text style={styles.stubScan}>
                SCANNEZ À L'ENTRÉE
              </Text>
            </View>

            {/* QR */}
            <View style={styles.stubQrFrame}>
              {qrCodeDataUrl ? (
                <Image
                  src={qrCodeDataUrl}
                  style={styles.stubQr}
                />
              ) : (
                <Text style={styles.qrUnavailable}>
                  QR CODE
                </Text>
              )}
            </View>

            {/* DESCRIPTION */}
            <Text style={styles.stubDescription}>
              Présentez ce QR Code pour
              vérifier votre billet.
            </Text>

            {/* NUMBER */}
            <View>
              <Text style={styles.stubTicketLabel}>
                NUMÉRO DU BILLET
              </Text>

              <Text style={styles.stubTicketNumber}>
                {ticketNumber || "SILO-2026"}
              </Text>
            </View>

            {/* STATUS */}
            <View
              style={[
                styles.confirmedBadge,
                isCancelled
                  ? {
                      backgroundColor:
                        COLORS.redSoft,
                    }
                  : undefined,
              ]}
            >
              <Text
                style={[
                  styles.confirmedText,
                  isCancelled
                    ? {
                        color: COLORS.red,
                      }
                    : undefined,
                ]}
              >
                {statusLabel}
              </Text>
            </View>

            {/* FOOTER */}
            <View>
              <Text style={styles.stubWebsite}>
                www.silocamp.org
              </Text>

              <Text style={styles.stubThemes}>
                GOSPEL • ADORATION • COMMUNION
              </Text>
            </View>
          </View>

          {/* ==================================================
              VERTICAL PERFORATION
          ================================================== */}

          <View
            style={styles.verticalPerforation}
          />
        </View>
      </Page>
    </Document>
  );
}