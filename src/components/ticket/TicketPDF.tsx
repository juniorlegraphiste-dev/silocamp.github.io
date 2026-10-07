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
// FONTS — POPPINS
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
  purpleMedium: "#6D3ED1",

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
// STYLES — A4 LANDSCAPE
// ============================================================

const styles = StyleSheet.create({
  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  page: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cream,
    padding: 22,
    fontFamily: "Poppins",
  },

  // ----------------------------------------------------------
  // TICKET
  // ----------------------------------------------------------

  ticket: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    flexDirection: "row",
  },

  // ----------------------------------------------------------
  // MAIN CONTENT
  // ----------------------------------------------------------

  main: {
    flex: 1,
    backgroundColor: COLORS.cream,
    paddingHorizontal: 22,
    paddingVertical: 18,
    justifyContent: "space-between",
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    color: COLORS.purple,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 2,
  },

  edition: {
    color: COLORS.textSoft,
    fontSize: 7,
    fontWeight: 500,
    letterSpacing: 1,
  },

  headerLine: {
    height: 1,
    backgroundColor: COLORS.gold,
    marginTop: 9,
    marginBottom: 10,
  },

  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  heroText: {
    flex: 1,
    paddingRight: 15,
  },

  heroTitle: {
    color: COLORS.purple,
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.08,
  },

  heroSubtitle: {
    color: COLORS.textSoft,
    fontSize: 7.5,
    fontWeight: 500,
    letterSpacing: 1.2,
    marginTop: 7,
  },

  // ----------------------------------------------------------
  // BADGES
  // ----------------------------------------------------------

  badges: {
    alignItems: "flex-end",
  },

  freeBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  freeBadgeText: {
    color: COLORS.purpleDark,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.8,
  },

  statusBadge: {
    marginTop: 5,
    backgroundColor: COLORS.greenSoft,
    borderRadius: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  statusBadgeText: {
    color: COLORS.green,
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 0.7,
  },

  statusCancelled: {
    backgroundColor: COLORS.redSoft,
  },

  statusCancelledText: {
    color: COLORS.red,
  },

  // ----------------------------------------------------------
  // EVENT
  // ----------------------------------------------------------

  eventBlock: {
    marginTop: 9,
  },

  eventLabel: {
    color: COLORS.muted,
    fontSize: 6,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  eventTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 700,
  },

  // ----------------------------------------------------------
  // DETAILS
  // ----------------------------------------------------------

  detailsGrid: {
    flexDirection: "row",
    marginTop: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },

  detailColumn: {
    flex: 1,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },

  detailColumnLast: {
    borderRightWidth: 0,
  },

  detailLabel: {
    color: COLORS.muted,
    fontSize: 5.5,
    fontWeight: 600,
    letterSpacing: 0.7,
    marginBottom: 2,
  },

  detailValue: {
    color: COLORS.text,
    fontSize: 7.5,
    fontWeight: 600,
  },

  detailValueSmall: {
    color: COLORS.text,
    fontSize: 6.8,
    fontWeight: 500,
  },

  // ----------------------------------------------------------
  // PARTICIPANT
  // ----------------------------------------------------------

  participantBox: {
    marginTop: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  participantLeft: {
    flex: 1,
  },

  participantLabel: {
    color: COLORS.goldLight,
    fontSize: 5.5,
    fontWeight: 700,
    letterSpacing: 0.9,
    marginBottom: 2,
  },

  participantName: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 700,
  },

  participantEmail: {
    color: "#D9D1E8",
    fontSize: 6,
    marginTop: 1,
  },

  ticketNumberBlock: {
    alignItems: "flex-end",
    marginLeft: 10,
  },

  ticketNumberLabel: {
    color: COLORS.goldLight,
    fontSize: 5.5,
    fontWeight: 600,
    letterSpacing: 0.7,
  },

  ticketNumber: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: 700,
    marginTop: 2,
  },

  // ----------------------------------------------------------
  // META
  // ----------------------------------------------------------

  metaGrid: {
    flexDirection: "row",
    marginTop: 7,
  },

  metaItem: {
    flex: 1,
    paddingRight: 8,
  },

  metaLabel: {
    color: COLORS.muted,
    fontSize: 5.2,
    fontWeight: 600,
    letterSpacing: 0.6,
    marginBottom: 1,
  },

  metaValue: {
    color: COLORS.text,
    fontSize: 6.8,
    fontWeight: 600,
  },

  // ----------------------------------------------------------
  // PERFORATION
  // ----------------------------------------------------------

  perforationContainer: {
    position: "relative",
    width: "100%",
    height: 18,
    marginTop: 7,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  perforationLineLeft: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLORS.gold,
    borderTopStyle: "dashed",
  },

  perforationLineRight: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLORS.gold,
    borderTopStyle: "dashed",
  },

  perforationScissors: {
    width: 28,
    textAlign: "center",
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: 700,
  },

  perforationText: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 11,
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 4.5,
    fontWeight: 500,
    letterSpacing: 0.8,
  },

  // ----------------------------------------------------------
  // QR AREA
  // ----------------------------------------------------------

  qrArea: {
    backgroundColor: COLORS.purple,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  qrInfo: {
    flex: 1,
    paddingRight: 12,
  },

  qrEyebrow: {
    color: COLORS.goldLight,
    fontSize: 5.5,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 2,
  },

  qrTitle: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 700,
  },

  qrDescription: {
    color: "#D9D1E8",
    fontSize: 5.7,
    lineHeight: 1.25,
    marginTop: 3,
  },

  qrTicketNumber: {
    color: COLORS.goldLight,
    fontSize: 5.8,
    fontWeight: 600,
    marginTop: 4,
  },

  qrFrame: {
    width: 82,
    height: 82,
    backgroundColor: COLORS.white,
    borderRadius: 7,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  qrCode: {
    width: 72,
    height: 72,
  },

  qrUnavailable: {
    color: COLORS.muted,
    fontSize: 5.5,
    textAlign: "center",
  },

  // ----------------------------------------------------------
  // FOOTER
  // ----------------------------------------------------------

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },

  footerWebsite: {
    color: COLORS.purple,
    fontSize: 6.5,
    fontWeight: 700,
  },

  footerThemes: {
    color: COLORS.muted,
    fontSize: 5.5,
    fontWeight: 500,
    letterSpacing: 0.4,
  },

  // ----------------------------------------------------------
  // RIGHT STUB
  // ----------------------------------------------------------

  stub: {
    width: 145,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },

  stubBrand: {
    color: COLORS.goldLight,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 2,
  },

  stubEdition: {
    color: "#D9D1E8",
    fontSize: 5.5,
    fontWeight: 500,
    letterSpacing: 0.8,
    textAlign: "center",
    marginTop: 2,
  },

  stubLine: {
    width: 55,
    height: 1,
    backgroundColor: COLORS.gold,
    marginVertical: 7,
  },

  stubLabel: {
    color: COLORS.white,
    fontSize: 6,
    fontWeight: 600,
    letterSpacing: 0.7,
    textAlign: "center",
  },

  stubQrFrame: {
    width: 92,
    height: 92,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },

  stubQr: {
    width: 80,
    height: 80,
  },

  stubTicketLabel: {
    color: COLORS.goldLight,
    fontSize: 5,
    fontWeight: 600,
    letterSpacing: 0.6,
    textAlign: "center",
  },

  stubTicketNumber: {
    color: COLORS.white,
    fontSize: 6,
    fontWeight: 700,
    marginTop: 2,
    textAlign: "center",
  },

  stubBottom: {
    color: "#D9D1E8",
    fontSize: 5,
    textAlign: "center",
    lineHeight: 1.3,
  },

  // ----------------------------------------------------------
  // DECORATIONS
  // ----------------------------------------------------------

  accentTop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 65,
    height: 4,
    backgroundColor: COLORS.gold,
    zIndex: 5,
  },

  accentBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 65,
    height: 4,
    backgroundColor: COLORS.gold,
    zIndex: 5,
  },

  // Perforation verticale entre le billet principal
  // et le petit coupon QR.
  verticalPerforation: {
    position: "absolute",
    right: 145,
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.gold,
    borderLeftStyle: "dashed",
    zIndex: 4,
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
  const ticketNumber = safeText(ticket.ticketNumber);

  const participantName = safeText(
    ticket.participantName
  );

  const email = safeText(ticket.email);

  const eventTitle = safeText(ticket.eventTitle);

  const dateLabel = safeText(ticket.dateLabel);
  const time = safeText(ticket.time);
  const venue = safeText(ticket.venue);
  const city = safeText(ticket.city);
  const duration = safeText(ticket.duration);

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
          {/* ACCENTS */}
          <View style={styles.accentTop} />
          <View style={styles.accentBottom} />

          {/* ==================================================
              MAIN TICKET
          ================================================== */}

          <View style={styles.main}>
            {/* HEADER */}
            <View>
              <View style={styles.headerTop}>
                <Text style={styles.brand}>
                  SILO CAMP
                </Text>

                <Text style={styles.edition}>
                  CAMP INTERNATIONAL 2026
                </Text>
              </View>

              <View style={styles.headerLine} />

              {/* HERO */}
              <View style={styles.heroRow}>
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle}>
                    VIVEZ LE FEU DU REVEIL{"\n"}
                    DANS LA PRESENCE DE DIEU
                  </Text>

                  <Text style={styles.heroSubtitle}>
                    GOSPEL • ADORATION • COMMUNION
                  </Text>
                </View>

                <View style={styles.badges}>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>
                      ENTRÉE GRATUITE
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isCancelled
                        ? styles.statusCancelled
                        : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isCancelled
                          ? styles.statusCancelledText
                          : undefined,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {/* EVENT */}
              <View style={styles.eventBlock}>
                <Text style={styles.eventLabel}>
                  ÉVÉNEMENT
                </Text>

                <Text style={styles.eventTitle}>
                  {eventTitle ||
                    "Camp International Silo 2026"}
                </Text>
              </View>

              {/* DETAILS */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>
                    DATE
                  </Text>

                  <Text style={styles.detailValue}>
                    {dateLabel || "—"}
                  </Text>
                </View>

                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>
                    HEURE
                  </Text>

                  <Text style={styles.detailValue}>
                    {time || "—"}
                  </Text>
                </View>

                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>
                    LIEU
                  </Text>

                  <Text style={styles.detailValueSmall}>
                    {venue || "—"}
                  </Text>

                  {city ? (
                    <Text
                      style={[
                        styles.detailValueSmall,
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

                <View
                  style={[
                    styles.detailColumn,
                    styles.detailColumnLast,
                  ]}
                >
                  <Text style={styles.detailLabel}>
                    DURÉE
                  </Text>

                  <Text style={styles.detailValue}>
                    {duration || "—"}
                  </Text>
                </View>
              </View>

              {/* PARTICIPANT */}
              <View style={styles.participantBox}>
                <View style={styles.participantLeft}>
                  <Text style={styles.participantLabel}>
                    PARTICIPANT
                  </Text>

                  <Text style={styles.participantName}>
                    {participantName ||
                      "Participant"}
                  </Text>

                  {email ? (
                    <Text
                      style={styles.participantEmail}
                    >
                      {email}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.ticketNumberBlock}>
                  <Text
                    style={styles.ticketNumberLabel}
                  >
                    E-TICKET
                  </Text>

                  <Text style={styles.ticketNumber}>
                    {ticketNumber || "SILOCAMP"}
                  </Text>
                </View>
              </View>

              {/* META */}
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>
                    PLACES
                  </Text>

                  <Text style={styles.metaValue}>
                    {quantity}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>
                    ENFANTS
                  </Text>

                  <Text style={styles.metaValue}>
                    {totalChildren}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>
                    RÉSERVATION
                  </Text>

                  <Text style={styles.metaValue}>
                    {reservationId || "—"}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>
                    CRÉÉ LE
                  </Text>

                  <Text style={styles.metaValue}>
                    {createdAt || "—"}
                  </Text>
                </View>
              </View>

              {/* ==================================================
                  PERFORATION HORIZONTALE
              ================================================== */}

              <View
                style={styles.perforationContainer}
              >
                <View
                  style={styles.perforationLineLeft}
                />

                <Text
                  style={styles.perforationScissors}
                >
                  ✂
                </Text>

                <View
                  style={styles.perforationLineRight}
                />

                <Text style={styles.perforationText}>
                  CONTRÔLE DU BILLET
                </Text>
              </View>

              {/* ==================================================
                  QR AREA
              ================================================== */}

              <View style={styles.qrArea}>
                <View style={styles.qrInfo}>
                  <Text style={styles.qrEyebrow}>
                    BILLET ÉLECTRONIQUE
                  </Text>

                  <Text style={styles.qrTitle}>
                    Présentez votre QR Code à l'entrée
                  </Text>

                  <Text
                    style={styles.qrDescription}
                  >
                    Scannez ce code pour vérifier
                    l'authenticité et la validité
                    de votre billet.
                  </Text>

                  <Text
                    style={styles.qrTicketNumber}
                  >
                    N° {ticketNumber || "SILOCAMP"}
                  </Text>
                </View>

                <View style={styles.qrFrame}>
                  {qrCodeDataUrl ? (
                    <Image
                      src={qrCodeDataUrl}
                      style={styles.qrCode}
                    />
                  ) : (
                    <Text
                      style={styles.qrUnavailable}
                    >
                      QR Code{"\n"}
                      indisponible
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerWebsite}>
                silocamp.org
              </Text>

              <Text style={styles.footerThemes}>
                GOSPEL • ADORATION • COMMUNION
              </Text>
            </View>
          </View>

          {/* ==================================================
              RIGHT QR STUB
          ================================================== */}

          <View style={styles.stub}>
            <View>
              <Text style={styles.stubBrand}>
                SILO
              </Text>

              <Text style={styles.stubEdition}>
                CAMP INTERNATIONAL 2026
              </Text>

              <View style={styles.stubLine} />

              <Text style={styles.stubLabel}>
                SCANNEZ À L'ENTRÉE
              </Text>
            </View>

            <View style={styles.stubQrFrame}>
              {qrCodeDataUrl ? (
                <Image
                  src={qrCodeDataUrl}
                  style={styles.stubQr}
                />
              ) : (
                <Text style={styles.qrUnavailable}>
                  QR
                </Text>
              )}
            </View>

            <View>
              <Text style={styles.stubTicketLabel}>
                NUMÉRO DU BILLET
              </Text>

              <Text style={styles.stubTicketNumber}>
                {ticketNumber || "SILOCAMP"}
              </Text>
            </View>

            <Text style={styles.stubBottom}>
              Présentez ce billet à l'entrée.
              {"\n"}
              Un seul billet par participant.
              {"\n\n"}
              silocamp.org
            </Text>
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