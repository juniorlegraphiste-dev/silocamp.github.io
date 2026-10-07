import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Svg,
  Path,
  Circle,
  Rect,
} from "@react-pdf/renderer";

import { Ticket } from "@/services/ticketService";

import PoppinsRegular from "@/assets/fonts/Poppins-Regular.ttf?url";
import PoppinsMedium from "@/assets/fonts/Poppins-Medium.ttf?url";
import PoppinsSemiBold from "@/assets/fonts/Poppins-SemiBold.ttf?url";
import PoppinsBold from "@/assets/fonts/Poppins-Bold.ttf?url";

/* =========================================================
   FONTS
========================================================= */

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

/* =========================================================
   TYPES
========================================================= */

export type TicketData = Ticket;

export type TicketPDFProps = {
  ticket: TicketData;
  verificationUrl?: string;
  qrCodeDataUrl?: string;
};

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  purple: "#24104F",
  purpleDark: "#180A35",
  purpleLight: "#7E63B7",

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

  border: "#DDD5C8",
};

/* =========================================================
   ICONS
========================================================= */

const CalendarIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      fill="none"
      stroke={COLORS.gold}
      strokeWidth="2"
    />

    <Path
      d="M8 3v4M16 3v4M3 10h18"
      fill="none"
      stroke={COLORS.gold}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const ClockIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke={COLORS.gold}
      strokeWidth="2"
    />

    <Path
      d="M12 7v5l3 2"
      fill="none"
      stroke={COLORS.gold}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LocationIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Path
      d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
      fill="none"
      stroke={COLORS.gold}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <Circle
      cx="12"
      cy="10"
      r="2.5"
      fill="none"
      stroke={COLORS.gold}
      strokeWidth="2"
    />
  </Svg>
);

const UserIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Circle
      cx="12"
      cy="8"
      r="3"
      fill="none"
      stroke={COLORS.gold}
      strokeWidth="2"
    />

    <Path
      d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6"
      fill="none"
      stroke={COLORS.gold}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={10} height={10} viewBox="0 0 24 24">
    <Circle
      cx="12"
      cy="12"
      r="10"
      fill={COLORS.green}
    />

    <Path
      d="M7.5 12.5l3 3L16.5 9"
      fill="none"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  page: {
    width: "100%",
    height: "100%",
    padding: 26,
    backgroundColor: COLORS.cream,
    fontFamily: "Poppins",
  },

  ticket: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
  },

  /* =====================================================
     MAIN LEFT SIDE
  ===================================================== */

  main: {
    flex: 1,
    padding: 25,
    backgroundColor: COLORS.cream,
    justifyContent: "space-between",
  },

  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.purple,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  logoText: {
    color: COLORS.goldLight,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1.5,
  },

  brandTitle: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.4,
  },

  brandSub: {
    marginTop: 3,
    color: COLORS.textSoft,
    fontSize: 6,
    fontWeight: 500,
    letterSpacing: 1,
  },

  freeBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: COLORS.gold,
    borderRadius: 20,
  },

  freeBadgeText: {
    color: COLORS.purpleDark,
    fontSize: 6,
    fontWeight: 700,
    letterSpacing: 0.9,
  },

  /* =====================================================
     HERO
  ===================================================== */

  hero: {
    marginTop: 10,
  },

  eyebrow: {
    color: COLORS.gold,
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 1.8,
  },

  title: {
    marginTop: 5,
    color: COLORS.purple,
    fontSize: 24,
    lineHeight: 1.08,
    fontWeight: 700,
  },

  titleAccent: {
    color: COLORS.gold,
  },

  description: {
    marginTop: 6,
    maxWidth: 440,
    color: COLORS.textSoft,
    fontSize: 7,
    lineHeight: 1.45,
  },

  /* =====================================================
     EVENT DETAILS
  ===================================================== */

  details: {
    marginTop: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
  },

  detail: {
    flex: 1,
    paddingHorizontal: 9,
  },

  detailFirst: {
    flex: 1,
    paddingLeft: 0,
    paddingRight: 9,
  },

  detailLast: {
    flex: 1.3,
    paddingLeft: 9,
    paddingRight: 0,
  },

  divider: {
    width: 1,
    backgroundColor: COLORS.border,
  },

  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailLabel: {
    marginLeft: 4,
    color: COLORS.gold,
    fontSize: 5,
    fontWeight: 700,
    letterSpacing: 1,
  },

  detailValue: {
    marginTop: 4,
    color: COLORS.purple,
    fontSize: 7.5,
    fontWeight: 600,
  },

  detailSub: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 5.8,
  },

  /* =====================================================
     PARTICIPANT
  ===================================================== */

  participant: {
    marginTop: 11,
    padding: 11,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  participantLeft: {
    flex: 1,
  },

  participantLabel: {
    flexDirection: "row",
    alignItems: "center",
  },

  participantLabelText: {
    marginLeft: 4,
    color: COLORS.gold,
    fontSize: 5,
    fontWeight: 700,
    letterSpacing: 1.2,
  },

  participantName: {
    marginTop: 4,
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: 600,
  },

  participantEmail: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 5.8,
  },

  ticketIdBlock: {
    alignItems: "flex-end",
  },

  ticketIdLabel: {
    color: COLORS.muted,
    fontSize: 5,
    fontWeight: 700,
    letterSpacing: 0.8,
  },

  ticketId: {
    marginTop: 3,
    color: COLORS.purple,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.6,
  },

  /* =====================================================
     BOTTOM INFORMATION
  ===================================================== */

  bottom: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  bottomBlock: {
    flex: 1,
  },

  bottomLabel: {
    color: COLORS.gold,
    fontSize: 4.8,
    fontWeight: 700,
    letterSpacing: 0.8,
  },

  bottomValue: {
    marginTop: 2,
    color: COLORS.textSoft,
    fontSize: 5.8,
    fontWeight: 500,
  },

  /* =====================================================
     RIGHT TICKET / QR
  ===================================================== */

  stub: {
    width: 195,
    backgroundColor: COLORS.purple,
    padding: 17,
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },

  perforation: {
    position: "absolute",
    left: -1,
    top: 17,
    bottom: 17,
    borderLeftWidth: 1,
    borderLeftColor: "#FFFFFF66",
    borderStyle: "dashed",
  },

  notchTop: {
    position: "absolute",
    left: -7,
    top: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.cream,
  },

  notchBottom: {
    position: "absolute",
    left: -7,
    bottom: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.cream,
  },

  stubTop: {
    alignItems: "center",
  },

  stubBrand: {
    color: COLORS.goldLight,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 2.5,
  },

  stubEdition: {
    marginTop: 3,
    color: COLORS.white,
    fontSize: 5.5,
    fontWeight: 600,
    letterSpacing: 1.2,
  },

  stubLine: {
    width: 120,
    marginTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF33",
  },

  qrArea: {
    alignItems: "center",
  },

  qrTitle: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.1,
  },

  qrSubtitle: {
    marginTop: 3,
    maxWidth: 135,
    color: "#FFFFFFAA",
    fontSize: 5.5,
    lineHeight: 1.3,
    textAlign: "center",
  },

  qrFrame: {
    marginTop: 9,
    width: 128,
    height: 128,
    padding: 7,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  qr: {
    width: 114,
    height: 114,
  },

  qrPlaceholder: {
    color: COLORS.purple,
    fontSize: 7,
    textAlign: "center",
  },

  qrNumber: {
    marginTop: 5,
    color: COLORS.goldLight,
    fontSize: 5.2,
    fontWeight: 500,
    letterSpacing: 0.7,
  },

  validBadge: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    backgroundColor: COLORS.greenSoft,
  },

  validText: {
    marginLeft: 4,
    color: COLORS.green,
    fontSize: 5,
    fontWeight: 700,
    letterSpacing: 0.5,
  },

  stubBottom: {
    alignItems: "center",
  },

  stubWebsite: {
    color: "#FFFFFF88",
    fontSize: 5,
  },

  stubAccess: {
    marginTop: 3,
    color: COLORS.white,
    fontSize: 5.5,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
});

/* =========================================================
   HELPERS
========================================================= */

function safeText(value?: string | number | null): string {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}

function truncate(
  value: string,
  max: number,
): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.substring(0, max - 3)}...`;
}

/* =========================================================
   PDF
========================================================= */

export default function TicketPDF({
  ticket,
  qrCodeDataUrl,
}: TicketPDFProps) {
  const ticketNumber = safeText(
    ticket.ticketNumber,
  );

  const participantName = safeText(
    ticket.participantName,
  );

  const eventTitle = safeText(
    ticket.eventTitle,
  );

  const dateLabel = safeText(
    ticket.dateLabel,
  );

  const time = safeText(ticket.time);

  const venue = safeText(ticket.venue);

  const city = safeText(ticket.city);

  const duration = safeText(
    ticket.duration,
  );

  const reservationId = safeText(
    ticket.reservationId,
  );

  const quantity =
    ticket.quantity ?? 1;

  const childrenUnder12 = Math.max(
    0,
    Math.floor(
      Number(
        ticket.childrenUnder12 ?? 0,
      ),
    ),
  );

  const children12Plus = Math.max(
    0,
    Math.floor(
      Number(
        ticket.children12Plus ?? 0,
      ),
    ),
  );

  const totalChildren =
    childrenUnder12 +
    children12Plus;

  const status =
    ticket.status === "CANCELLED"
      ? "ANNULÉ"
      : ticket.status === "USED"
        ? "UTILISÉ"
        : "CONFIRMÉ";

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
          {/* =================================================
              MAIN TICKET
          ================================================= */}

          <View
            style={styles.main}
            wrap={false}
          >
            {/* HEADER */}

            <View style={styles.top}>
              <View style={styles.brandGroup}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>
                    SILO
                  </Text>
                </View>

                <View>
                  <Text style={styles.brandTitle}>
                    CAMP INTERNATIONAL SILO
                  </Text>

                  <Text style={styles.brandSub}>
                    GOSPEL • ADORATION • COMMUNION
                  </Text>
                </View>
              </View>

              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>
                  ENTRÉE GRATUITE
                </Text>
              </View>
            </View>

            {/* HERO */}

            <View style={styles.hero}>
              <Text style={styles.eyebrow}>
                CAMP INTERNATIONAL SILO 2026
              </Text>

              <Text style={styles.title}>
                VIVEZ LE FEU DU REVEIL{"\n"}
                <Text style={styles.titleAccent}>
                  DANS LA PRESENCE DE DIEU
                </Text>
              </Text>

              <Text style={styles.description}>
                Un temps de communion,
                d'enseignement, de prière,
                de louange et d'adoration
                autour de Jésus-Christ.
              </Text>
            </View>

            {/* EVENT DETAILS */}

            <View
              style={styles.details}
              wrap={false}
            >
              <View style={styles.detailFirst}>
                <View
                  style={
                    styles.detailLabelRow
                  }
                >
                  <CalendarIcon />

                  <Text
                    style={styles.detailLabel}
                  >
                    DATE
                  </Text>
                </View>

                <Text
                  style={styles.detailValue}
                >
                  {dateLabel}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detail}>
                <View
                  style={
                    styles.detailLabelRow
                  }
                >
                  <ClockIcon />

                  <Text
                    style={styles.detailLabel}
                  >
                    HEURE
                  </Text>
                </View>

                <Text
                  style={styles.detailValue}
                >
                  {time}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detail}>
                <View
                  style={
                    styles.detailLabelRow
                  }
                >
                  <LocationIcon />

                  <Text
                    style={styles.detailLabel}
                  >
                    LIEU
                  </Text>
                </View>

                <Text
                  style={styles.detailValue}
                >
                  {truncate(venue, 28)}
                </Text>

                <Text
                  style={styles.detailSub}
                >
                  {city}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailLast}>
                <View
                  style={
                    styles.detailLabelRow
                  }
                >
                  <ClockIcon />

                  <Text
                    style={styles.detailLabel}
                  >
                    DURÉE
                  </Text>
                </View>

                <Text
                  style={styles.detailValue}
                >
                  {duration}
                </Text>
              </View>
            </View>

            {/* PARTICIPANT */}

            <View
              style={styles.participant}
              wrap={false}
            >
              <View
                style={styles.participantLeft}
              >
                <View
                  style={styles.participantLabel}
                >
                  <UserIcon />

                  <Text
                    style={
                      styles.participantLabelText
                    }
                  >
                    PARTICIPANT
                  </Text>
                </View>

                <Text
                  style={styles.participantName}
                >
                  {participantName}
                </Text>

                {ticket.email && (
                  <Text
                    style={
                      styles.participantEmail
                    }
                  >
                    {ticket.email}
                  </Text>
                )}
              </View>

              <View
                style={styles.ticketIdBlock}
              >
                <Text
                  style={styles.ticketIdLabel}
                >
                  NUMÉRO DU BILLET
                </Text>

                <Text
                  style={styles.ticketId}
                >
                  {ticketNumber}
                </Text>
              </View>
            </View>

            {/* CHILDREN / RESERVATION */}

            <View
              style={styles.bottom}
              wrap={false}
            >
              <View style={styles.bottomBlock}>
                <Text
                  style={styles.bottomLabel}
                >
                  PLACES
                </Text>

                <Text
                  style={styles.bottomValue}
                >
                  {quantity}{" "}
                  {quantity > 1
                    ? "places"
                    : "place"}
                </Text>
              </View>

              <View style={styles.bottomBlock}>
                <Text
                  style={styles.bottomLabel}
                >
                  ENFANTS
                </Text>

                <Text
                  style={styles.bottomValue}
                >
                  {totalChildren}
                  {totalChildren > 0
                    ? ` (${childrenUnder12} <12 / ${children12Plus} 12+)`
                    : ""}
                </Text>
              </View>

              <View style={styles.bottomBlock}>
                <Text
                  style={styles.bottomLabel}
                >
                  TARIF
                </Text>

                <Text
                  style={styles.bottomValue}
                >
                  Gratuit
                </Text>
              </View>

              <View style={styles.bottomBlock}>
                <Text
                  style={styles.bottomLabel}
                >
                  STATUT
                </Text>

                <Text
                  style={styles.bottomValue}
                >
                  {status}
                </Text>
              </View>

              <View style={styles.bottomBlock}>
                <Text
                  style={styles.bottomLabel}
                >
                  RÉSERVATION
                </Text>

                <Text
                  style={styles.bottomValue}
                >
                  {truncate(
                    reservationId,
                    20,
                  )}
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              PERFORATED QR STUB
          ================================================= */}

          <View
            style={styles.stub}
            wrap={false}
          >
            {/* PERFORATION */}

            <View style={styles.perforation} />

            <View style={styles.notchTop} />

            <View
              style={styles.notchBottom}
            />

            {/* STUB HEADER */}

            <View style={styles.stubTop}>
              <Text style={styles.stubBrand}>
                SILO
              </Text>

              <Text
                style={styles.stubEdition}
              >
                CAMP INTERNATIONAL 2026
              </Text>

              <View style={styles.stubLine} />
            </View>

            {/* QR */}

            <View
              style={styles.qrArea}
            >
              <Text style={styles.qrTitle}>
                SCANNEZ À L'ENTRÉE
              </Text>

              <Text
                style={styles.qrSubtitle}
              >
                Présentez ce QR Code
                pour vérifier votre
                billet.
              </Text>

              <View
                style={styles.qrFrame}
              >
                {qrCodeDataUrl ? (
                  <Image
                    src={qrCodeDataUrl}
                    style={styles.qr}
                  />
                ) : (
                  <Text
                    style={
                      styles.qrPlaceholder
                    }
                  >
                    QR CODE
                  </Text>
                )}
              </View>

              <Text
                style={styles.qrNumber}
              >
                {ticketNumber}
              </Text>

              <View
                style={styles.validBadge}
              >
                <CheckIcon />

                <Text
                  style={styles.validText}
                >
                  BILLET {status}
                </Text>
              </View>
            </View>

            {/* STUB FOOTER */}

            <View
              style={styles.stubBottom}
            >
              <Text
                style={styles.stubWebsite}
              >
                www.silocamp.org
              </Text>

              <Text
                style={styles.stubAccess}
              >
                GOSPEL • ADORATION • COMMUNION
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}