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

export type TicketData = Ticket;

export type TicketPDFProps = {
  ticket: TicketData;
  verificationUrl?: string;
  qrCodeDataUrl?: string;
};

const COLORS = {
  purple: "#24104F",
  purpleDark: "#190B38",
  purpleMedium: "#6D3ED1",
  purpleLight: "#A78BFA",
  purpleSoft: "#F8F6FF",
  purpleBorder: "#E7DFFF",

  gold: "#C8A45D",
  goldLight: "#E7CF9A",

  green: "#047857",
  greenSoft: "#ECFDF5",
  greenBorder: "#A7F3D0",

  white: "#FFFFFF",

  text: "#171329",
  textSoft: "#4B5563",
  gray: "#6B7280",
  grayLight: "#9CA3AF",

  border: "#E5E7EB",
  background: "#F7F7FA",
};

const CalendarIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      fill="none"
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
    />
    <Path
      d="M8 3v4M16 3v4"
      fill="none"
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M3 10h18"
      fill="none"
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
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
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
    />
    <Path
      d="M12 7v5l3 2"
      fill="none"
      stroke={COLORS.purpleMedium}
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
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="10"
      r="2.5"
      fill="none"
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
    />
  </Svg>
);

const TimerIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Path
      d="M9 3h6M12 3v3"
      fill="none"
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Circle
      cx="12"
      cy="14"
      r="7"
      fill="none"
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
    />
    <Path
      d="M12 10v4l2.5 1.5"
      fill="none"
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ParticipantIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24">
    <Circle
      cx="12"
      cy="8"
      r="3.2"
      fill="none"
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
    />
    <Path
      d="M5 21c.8-4.1 3.2-6 7-6s6.2 1.9 7 6"
      fill="none"
      stroke={COLORS.purpleMedium}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24">
    <Circle
      cx="12"
      cy="12"
      r="9"
      fill={COLORS.green}
    />
    <Path
      d="M8 12.5l2.5 2.5L16.5 9"
      fill="none"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    width: "100%",
    height: "100%",
    padding: 24,
    backgroundColor: COLORS.background,
    fontFamily: "Poppins",
  },

  ticket: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  header: {
    height: 128,
    paddingHorizontal: 28,
    paddingVertical: 22,
    backgroundColor: COLORS.purple,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  brand: {
    fontSize: 27,
    fontWeight: 700,
    color: COLORS.white,
    letterSpacing: 3,
  },

  brandSub: {
    marginTop: 4,
    fontSize: 6.5,
    fontWeight: 500,
    color: COLORS.purpleLight,
    letterSpacing: 1.8,
  },

  eTicketBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: COLORS.gold,
  },

  eTicketBadgeText: {
    fontSize: 6.5,
    fontWeight: 700,
    color: COLORS.white,
    letterSpacing: 1,
  },

  headerBottom: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  headerLabel: {
    fontSize: 5.5,
    fontWeight: 600,
    color: COLORS.purpleLight,
    letterSpacing: 1.4,
  },

  headerNumber: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.white,
    letterSpacing: 1.4,
  },

  freeHeader: {
    fontSize: 6.5,
    fontWeight: 700,
    color: "#5EEAD4",
    letterSpacing: 1,
  },

  intro: {
    paddingHorizontal: 28,
    paddingTop: 19,
    paddingBottom: 15,
  },

  eyebrow: {
    fontSize: 6,
    fontWeight: 700,
    color: COLORS.purpleMedium,
    letterSpacing: 1.7,
  },

  title: {
    marginTop: 5,
    fontSize: 22,
    lineHeight: 1.1,
    fontWeight: 700,
    color: COLORS.text,
  },

  introText: {
    marginTop: 5,
    fontSize: 7,
    color: COLORS.gray,
  },

  details: {
    marginHorizontal: 28,
    padding: 13,
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },

  detailsRow: {
    flexDirection: "row",
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
    flex: 1,
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
    fontSize: 5.3,
    fontWeight: 700,
    color: COLORS.purpleMedium,
    letterSpacing: 1,
  },

  detailValue: {
    marginTop: 5,
    fontSize: 7.5,
    fontWeight: 600,
    color: COLORS.text,
  },

  detailSub: {
    marginTop: 2,
    fontSize: 6,
    color: COLORS.gray,
  },

  main: {
    flex: 1,
    marginHorizontal: 28,
    marginTop: 16,
    flexDirection: "row",
  },

  leftColumn: {
    flex: 1,
    paddingRight: 20,
  },

  rightColumn: {
    width: 180,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    alignItems: "center",
  },

  participantHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  participantLabel: {
    marginLeft: 5,
    fontSize: 6,
    fontWeight: 700,
    color: COLORS.purpleMedium,
    letterSpacing: 1.4,
  },

  participantName: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: 600,
    color: COLORS.text,
  },

  participantEmail: {
    marginTop: 3,
    fontSize: 7,
    color: COLORS.gray,
  },

  participantPhone: {
    marginTop: 2,
    fontSize: 6.5,
    color: COLORS.grayLight,
  },

  participation: {
    marginTop: 16,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    backgroundColor: COLORS.purpleSoft,
  },

  participationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  participationTitle: {
    fontSize: 9.5,
    fontWeight: 600,
    color: COLORS.text,
  },

  freeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },

  freeBadgeText: {
    fontSize: 5.5,
    fontWeight: 700,
    color: COLORS.green,
    letterSpacing: 0.7,
  },

  participationText: {
    marginTop: 6,
    fontSize: 6.8,
    lineHeight: 1.4,
    color: COLORS.gray,
  },

  benefits: {
    marginTop: 14,
  },

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  benefitIcon: {
    marginRight: 6,
  },

  benefitText: {
    fontSize: 6.8,
    color: COLORS.textSoft,
  },

  accessBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 9,
    backgroundColor: COLORS.purple,
  },

  accessLabel: {
    fontSize: 5,
    fontWeight: 700,
    color: COLORS.purpleLight,
    letterSpacing: 1.3,
  },

  accessNumber: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.white,
    letterSpacing: 1.1,
  },

  qrTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.text,
    letterSpacing: 0.9,
    textAlign: "center",
  },

  qrSubtitle: {
    marginTop: 3,
    maxWidth: 140,
    fontSize: 6,
    lineHeight: 1.3,
    color: COLORS.grayLight,
    textAlign: "center",
  },

  qrBox: {
    marginTop: 11,
    width: 142,
    height: 142,
    padding: 8,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.purpleLight,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  qr: {
    width: 124,
    height: 124,
  },

  qrNumber: {
    marginTop: 6,
    fontSize: 6,
    fontWeight: 500,
    color: COLORS.gray,
    letterSpacing: 1,
    textAlign: "center",
  },

  valid: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 15,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },

  validIcon: {
    marginRight: 4,
  },

  validText: {
    fontSize: 5.5,
    fontWeight: 700,
    color: COLORS.green,
    letterSpacing: 0.6,
  },

  bottom: {
    marginHorizontal: 28,
    marginTop: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
  },

  bottomItem: {
    flex: 1,
  },

  bottomLabel: {
    fontSize: 5.2,
    fontWeight: 700,
    color: COLORS.purpleMedium,
    letterSpacing: 0.8,
  },

  bottomValue: {
    marginTop: 3,
    fontSize: 6.5,
    fontWeight: 600,
    color: COLORS.text,
  },

  footer: {
    height: 38,
    paddingHorizontal: 28,
    backgroundColor: COLORS.purple,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerText: {
    fontSize: 5.5,
    color: COLORS.purpleLight,
  },

  footerStrong: {
    color: COLORS.white,
    fontWeight: 700,
  },

  accentBar: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 5,
    height: "100%",
    backgroundColor: COLORS.gold,
  },
});

function safeText(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function formatCreatedAt(value?: string | Date | null): string {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export default function TicketPDF({
  ticket,
  qrCodeDataUrl,
}: TicketPDFProps) {
  const ticketNumber = safeText(ticket.ticketNumber);
  const participantName = safeText(ticket.participantName);
  const eventTitle = safeText(ticket.eventTitle);
  const dateLabel = safeText(ticket.dateLabel);
  const time = safeText(ticket.time);
  const venue = safeText(ticket.venue);
  const city = safeText(ticket.city);
  const duration = safeText(ticket.duration);
  const reservationId = safeText(ticket.reservationId);
  const quantity = ticket.quantity ?? 1;

  return (
    <Document
      title={`SiloCamp - ${ticketNumber}`}
      author="SiloCamp"
      subject={`E-billet — ${eventTitle}`}
      creator="SiloCamp"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.ticket}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.brand}>SILOCAMP</Text>

                <Text style={styles.brandSub}>
                  CAMP INTERNATIONAL SILO · 3e ÉDITION · 2026
                </Text>
              </View>

              <View style={styles.eTicketBadge}>
                <Text style={styles.eTicketBadgeText}>
                  E-BILLET
                </Text>
              </View>
            </View>

            <View style={styles.headerBottom}>
              <View>
                <Text style={styles.headerLabel}>
                  NUMÉRO DE BILLET
                </Text>

                <Text style={styles.headerNumber}>
                  {ticketNumber}
                </Text>
              </View>

              <Text style={styles.freeHeader}>
                PARTICIPATION GRATUITE
              </Text>
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={styles.eyebrow}>
              VOTRE ACCÈS
            </Text>

            <Text style={styles.title}>
              {eventTitle}
            </Text>

            <Text style={styles.introText}>
              Votre billet officiel pour le Camp International Silo.
            </Text>
          </View>

          <View style={styles.details}>
            <View style={styles.detailsRow}>
              <View style={styles.detailFirst}>
                <View style={styles.detailLabelRow}>
                  <CalendarIcon />

                  <Text style={styles.detailLabel}>
                    DATE
                  </Text>
                </View>

                <Text style={styles.detailValue}>
                  {dateLabel}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detail}>
                <View style={styles.detailLabelRow}>
                  <ClockIcon />

                  <Text style={styles.detailLabel}>
                    HEURE
                  </Text>
                </View>

                <Text style={styles.detailValue}>
                  {time}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detail}>
                <View style={styles.detailLabelRow}>
                  <LocationIcon />

                  <Text style={styles.detailLabel}>
                    LIEU
                  </Text>
                </View>

                <Text style={styles.detailValue}>
                  {venue}
                </Text>

                <Text style={styles.detailSub}>
                  {city}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailLast}>
                <View style={styles.detailLabelRow}>
                  <TimerIcon />

                  <Text style={styles.detailLabel}>
                    DURÉE
                  </Text>
                </View>

                <Text style={styles.detailValue}>
                  {duration}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.main}>
            <View style={styles.leftColumn}>
              <View style={styles.participantHeader}>
                <ParticipantIcon />

                <Text style={styles.participantLabel}>
                  PARTICIPANT
                </Text>
              </View>

              <Text style={styles.participantName}>
                {participantName}
              </Text>

              {ticket.email && (
                <Text style={styles.participantEmail}>
                  {ticket.email}
                </Text>
              )}

              {ticket.phone && (
                <Text style={styles.participantPhone}>
                  {ticket.phone}
                </Text>
              )}

              <View style={styles.participation}>
                <View style={styles.participationTop}>
                  <Text style={styles.participationTitle}>
                    Participation
                  </Text>

                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>
                      GRATUIT
                    </Text>
                  </View>
                </View>

                <Text style={styles.participationText}>
                  Votre inscription est confirmée. Présentez votre QR Code à l'entrée pour accéder à l'événement.
                </Text>
              </View>

              <View style={styles.benefits}>
                <View style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <CheckIcon />
                  </View>

                  <Text style={styles.benefitText}>
                    E-billet électronique
                  </Text>
                </View>

                <View style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <CheckIcon />
                  </View>

                  <Text style={styles.benefitText}>
                    QR Code unique et sécurisé
                  </Text>
                </View>

                <View style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <CheckIcon />
                  </View>

                  <Text style={styles.benefitText}>
                    Accès gratuit à l'événement
                  </Text>
                </View>
              </View>

              <View style={styles.accessBox}>
                <Text style={styles.accessLabel}>
                  RÉFÉRENCE D'ACCÈS
                </Text>

                <Text style={styles.accessNumber}>
                  {ticketNumber}
                </Text>
              </View>
            </View>

            <View style={styles.rightColumn}>
              <Text style={styles.qrTitle}>
                SCANNEZ À L'ENTRÉE
              </Text>

              <Text style={styles.qrSubtitle}>
                Présentez ce QR Code à l'équipe d'accueil.
              </Text>

              {qrCodeDataUrl ? (
                <View style={styles.qrBox}>
                  <Image
                    src={qrCodeDataUrl}
                    style={styles.qr}
                  />
                </View>
              ) : (
                <View style={styles.qrBox}>
                  <Text style={styles.qrNumber}>
                    QR CODE
                  </Text>
                </View>
              )}

              <Text style={styles.qrNumber}>
                {ticketNumber}
              </Text>

              <View style={styles.valid}>
                <View style={styles.validIcon}>
                  <CheckIcon />
                </View>

                <Text style={styles.validText}>
                  BILLET VALIDE
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottom}>
            <View style={styles.bottomItem}>
              <Text style={styles.bottomLabel}>
                PLACES
              </Text>

              <Text style={styles.bottomValue}>
                {quantity} {quantity > 1 ? "places" : "place"}
              </Text>
            </View>

            <View style={styles.bottomItem}>
              <Text style={styles.bottomLabel}>
                TARIF
              </Text>

              <Text style={styles.bottomValue}>
                Gratuit
              </Text>
            </View>

            <View style={styles.bottomItem}>
              <Text style={styles.bottomLabel}>
                STATUT
              </Text>

              <Text style={styles.bottomValue}>
                {ticket.status === "CANCELLED"
                  ? "ANNULÉ"
                  : ticket.status === "USED"
                    ? "UTILISÉ"
                    : "CONFIRMÉ"}
              </Text>
            </View>

            <View style={styles.bottomItem}>
              <Text style={styles.bottomLabel}>
                ACCÈS
              </Text>

              <Text style={styles.bottomValue}>
                QR CODE
              </Text>
            </View>

            <View style={styles.bottomItem}>
              <Text style={styles.bottomLabel}>
                RÉSERVATION
              </Text>

              <Text style={styles.bottomValue}>
                {reservationId}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              <Text style={styles.footerStrong}>
                SILOCAMP
              </Text>
              {"  "}Camp International Silo 2026
            </Text>

            <Text style={styles.footerText}>
              {formatCreatedAt(ticket.createdAt)}
            </Text>
          </View>

          <View style={styles.accentBar} />
        </View>
      </Page>
    </Document>
  );
}