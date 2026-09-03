import { Ticket } from "@/services/ticketService";
import PoppinsRegular from "@/assets/fonts/Poppins-Regular.ttf?url";
import PoppinsMedium from "@/assets/fonts/Poppins-Medium.ttf?url";
import PoppinsSemiBold from "@/assets/fonts/Poppins-SemiBold.ttf?url";
import PoppinsBold from "@/assets/fonts/Poppins-Bold.ttf?url";
import {
  Document,
  Font,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

export type TicketData = Ticket;

export type TicketPDFProps = {
  ticket: TicketData;
  verificationUrl?: string;
  qrCodeDataUrl?: string;
};

const COLORS = {
  purple: "#5B2A86",
  purpleDark: "#32164F",
  purpleDeep: "#24132F",
  gold: "#D4AF63",
  goldDark: "#9B752D",
  white: "#FFFFFF",
  background: "#F7F5FC",
  text: "#18213A",
  muted: "#6B7280",
  light: "#E8E4EF",
  softPurple: "#F3EFF8",
  softGold: "#FFFCF5",
  green: "#237A52",
};

const styles = StyleSheet.create({
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: COLORS.softGold,
    alignItems: "center",
    justifyContent: "center",
  },

  page: {
    width: "100%",
    minHeight: "100%",
    backgroundColor: COLORS.background,
    fontFamily: "Poppins",
    color: COLORS.text,
  },

  outer: {
    padding: 24,
    minHeight: "100%",
  },

  ticket: {
    minHeight: 744,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.light,
  },

  header: {
    backgroundColor: COLORS.purpleDark,
    paddingHorizontal: 28,
    paddingVertical: 25,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  brandBlock: {
    width: "72%",
  },

  brand: {
    color: COLORS.gold,
    fontFamily: "Poppins",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },

  eventTitle: {
    marginTop: 8,
    color: COLORS.white,
    fontFamily: "Poppins",
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.15,
  },

  eventSubtitle: {
    marginTop: 7,
    color: "#D9D0E3",
    fontFamily: "Poppins",
    fontSize: 9,
    fontWeight: 400,
  },

  headerBadge: {
    width: 74,
    height: 74,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#7B559D",
    backgroundColor: "#432260",
    alignItems: "center",
    justifyContent: "center",
  },

  headerBadgeText: {
    color: COLORS.gold,
    fontFamily: "Poppins",
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
    lineHeight: 1.4,
  },

  headerBadgeMain: {
    marginTop: 4,
    color: COLORS.white,
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: 800,
  },

  headerBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  freeBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },

  freeBadgeText: {
    color: COLORS.purpleDeep,
    fontFamily: "Poppins",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  secureBadge: {
    marginLeft: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#765A91",
    paddingHorizontal: 13,
    paddingVertical: 6,
  },

  secureBadgeText: {
    color: "#E8E0EF",
    fontFamily: "Poppins",
    fontSize: 8,
    fontWeight: 600,
  },

  content: {
    padding: 26,
  },

  columns: {
    flexDirection: "row",
    gap: 22,
  },

  leftColumn: {
    width: "64%",
  },

  rightColumn: {
    width: "36%",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionLabel: {
    color: COLORS.goldDark,
    fontFamily: "Poppins",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  participantName: {
    marginTop: 7,
    color: COLORS.text,
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: 700,
  },

  participantEmail: {
    marginTop: 4,
    color: COLORS.muted,
    fontFamily: "Poppins",
    fontSize: 9,
    fontWeight: 400,
  },

  participantPhone: {
    marginTop: 3,
    color: COLORS.muted,
    fontFamily: "Poppins",
    fontSize: 9,
    fontWeight: 400,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.light,
    marginVertical: 20,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  infoItem: {
    width: "50%",
    paddingRight: 12,
    marginBottom: 18,
  },

  infoValue: {
    marginTop: 5,
    color: COLORS.text,
    fontFamily: "Poppins",
    fontSize: 10,
    fontWeight: 600,
    lineHeight: 1.35,
  },

  infoValueMono: {
    marginTop: 5,
    color: COLORS.purple,
    fontFamily: "Poppins",
    fontSize: 8,
    fontWeight: 700,
    lineHeight: 1.35,
  },

  accessBox: {
    marginTop: 3,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.softGold,
    borderWidth: 1,
    borderColor: "#EBD9A9",
  },

  accessRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  accessIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F4E8C8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  accessIconCheck: {
    width: 12,
    height: 12,
  },

  accessTitle: {
    color: COLORS.text,
    fontFamily: "Poppins",
    fontSize: 9,
    fontWeight: 700,
  },

  accessText: {
    marginTop: 3,
    color: COLORS.muted,
    fontFamily: "Poppins",
    fontSize: 7.5,
    fontWeight: 400,
    lineHeight: 1.4,
  },

  qrPanel: {
    width: 150,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.light,
    alignItems: "center",
  },

  qrImage: {
    width: 124,
    height: 124,
  },

  qrFallback: {
    width: 124,
    height: 124,
    backgroundColor: COLORS.softPurple,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },

  qrFallbackText: {
    color: COLORS.purple,
    fontFamily: "Poppins",
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
    lineHeight: 1.4,
  },

  qrTitle: {
    marginTop: 10,
    color: COLORS.purpleDark,
    fontFamily: "Poppins",
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  qrSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontFamily: "Poppins",
    fontSize: 7,
    fontWeight: 400,
    textAlign: "center",
    lineHeight: 1.35,
  },

  ticketNumberBox: {
    marginTop: 15,
    width: 150,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORS.softPurple,
  },

  ticketNumberLabel: {
    color: COLORS.muted,
    fontFamily: "Poppins",
    fontSize: 6.5,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  ticketNumber: {
    marginTop: 4,
    color: COLORS.purple,
    fontFamily: "Poppins",
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
  },

  verificationText: {
    marginTop: 10,
    color: COLORS.muted,
    fontFamily: "Poppins",
    fontSize: 6.5,
    fontWeight: 400,
    textAlign: "center",
    lineHeight: 1.4,
  },

  footer: {
    marginTop: 4,
    paddingHorizontal: 26,
    paddingVertical: 17,
    backgroundColor: COLORS.purpleDeep,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerBrand: {
    color: COLORS.gold,
    fontFamily: "Poppins",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.8,
  },

  footerText: {
    color: "#CFC4DA",
    fontFamily: "Poppins",
    fontSize: 7,
    fontWeight: 400,
  },

  footerStatus: {
    color: COLORS.white,
    fontFamily: "Poppins",
    fontSize: 7,
    fontWeight: 700,
  },

  bottomLine: {
    marginTop: 10,
    height: 1,
    backgroundColor: "#4A315D",
  },

  footerSmall: {
    marginTop: 8,
    color: "#9F91AA",
    fontFamily: "Poppins",
    fontSize: 6.5,
    fontWeight: 400,
  },
});

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

function safeText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();

  return text || fallback;
}

function formatStatus(status: Ticket["status"]): string {
  switch (status) {
    case "VALID":
      return "Billet valide";

    case "USED":
      return "Billet utilisé";

    case "CANCELLED":
      return "Billet annulé";

    default:
      return "Statut inconnu";
  }
}

function formatDate(value: string | Date): string {
  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return safeText(value);
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return safeText(value);
  }
}

function CheckIcon() {
  return (
    <Svg width="12" height="12" viewBox="0 0 24 24">
      <Path
        d="M5 12.5l4 4L19 7"
        stroke={COLORS.goldDark}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24">
      <Path
        d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        stroke={COLORS.goldDark}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LocationIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24">
      <Path
        d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"
        stroke={COLORS.goldDark}
        strokeWidth="1.8"
        fill="none"
      />
      <Path
        d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke={COLORS.goldDark}
        strokeWidth="1.8"
        fill="none"
      />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24">
      <Path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke={COLORS.goldDark}
        strokeWidth="1.8"
        fill="none"
      />
      <Path
        d="M12 7v5l3 2"
        stroke={COLORS.goldDark}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DurationIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24">
      <Path
        d="M8 3h8M8 21h8M9 3v4c0 2 3 3 3 5s-3 3-3 5v4M15 3v4c0 2-3 3-3 5s3 3 3 5v4"
        stroke={COLORS.goldDark}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TicketIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24">
      <Path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 1 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 1 0 0-4V7Z"
        stroke={COLORS.goldDark}
        strokeWidth="1.7"
        fill="none"
        strokeLinejoin="round"
      />
      <Path
        d="M9 8v8M15 8v8"
        stroke={COLORS.goldDark}
        strokeWidth="1.5"
        strokeDasharray="1 2"
      />
    </Svg>
  );
}

function ReservationIcon() {
  return (
    <Svg width="14" height="14" viewBox="0 0 24 24">
      <Path
        d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke={COLORS.goldDark}
        strokeWidth="1.8"
        fill="none"
      />
      <Path
        d="M8 8h8M8 12h5M8 16h3"
        stroke={COLORS.goldDark}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function TicketPDF({ ticket, verificationUrl, qrCodeDataUrl }: TicketPDFProps) {
  return (
    <Document
      title={`E-billet ${ticket.ticketNumber}`}
      author="SiloCamp"
      subject="E-billet Camp International Silo 2026"
      creator="SiloCamp"
    >
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.outer}>
          <View style={styles.ticket}>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.brandBlock}>
                  <Text style={styles.brand}>SILO CAMP</Text>

                  <Text style={styles.eventTitle}>
                    {safeText(
                      ticket.eventTitle,
                      "Camp International Silo 2026",
                    )}
                  </Text>

                  <Text style={styles.eventSubtitle}>
                    Votre e-billet officiel · Accès événement
                  </Text>
                </View>

                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>E-BILLET</Text>

                  <Text style={styles.headerBadgeMain}>01</Text>
                </View>
              </View>

              <View style={styles.headerBottom}>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>
                    Participation gratuite
                  </Text>
                </View>

                <View style={styles.secureBadge}>
                  <Text style={styles.secureBadgeText}>QR Code sécurisé</Text>
                </View>
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.columns}>
                <View style={styles.leftColumn}>
                  <Text style={styles.sectionLabel}>Participant</Text>

                  <Text style={styles.participantName}>
                    {safeText(ticket.participantName)}
                  </Text>

                  <Text style={styles.participantEmail}>
                    {safeText(ticket.email)}
                  </Text>

                  {ticket.phone && (
                    <Text style={styles.participantPhone}>
                      {safeText(ticket.phone)}
                    </Text>
                  )}

                  <View style={styles.separator} />

                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <View style={styles.infoHeader}>
                        <View style={styles.infoIcon}>
                          <CalendarIcon />
                        </View>

                        <Text style={styles.sectionLabel}>DATE</Text>
                      </View>

                      <Text style={styles.infoValue}>
                        Samedi 12 Décembre 2026
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <View style={styles.infoHeader}>
                        <View style={styles.infoIcon}>
                          <ClockIcon />
                        </View>

                        <Text style={styles.sectionLabel}>HEURE</Text>
                      </View>

                      <Text style={styles.infoValue}>09h00</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <View style={styles.infoHeader}>
                        <View style={styles.infoIcon}>
                          <LocationIcon />
                        </View>

                        <Text style={styles.sectionLabel}>LIEU</Text>
                      </View>

                      <Text style={styles.infoValue}>
                        Le Carré d'Or Casablanca
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <View style={styles.infoHeader}>
                        <View style={styles.infoIcon}>
                          <DurationIcon />
                        </View>

                        <Text style={styles.sectionLabel}>DURÉE</Text>
                      </View>

                      <Text style={styles.infoValue}>9 heures</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <View style={styles.infoHeader}>
                        <View style={styles.infoIcon}>
                          <ReservationIcon />
                        </View>

                        <Text style={styles.sectionLabel}>RÉSERVATION</Text>
                      </View>

                      <Text style={styles.infoValueMono}>CIS-FSG97-2026</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <View style={styles.infoHeader}>
                        <View style={styles.infoIcon}>
                          <TicketIcon />
                        </View>

                        <Text style={styles.sectionLabel}>BILLET</Text>
                      </View>

                      <Text style={styles.infoValueMono}>
                        SILO-2026-CD853D6
                      </Text>
                    </View>
                  </View>

                  <View style={styles.accessBox}>
                    <View style={styles.accessRow}>
                      <View style={styles.accessIcon}>
                        <CheckIcon />
                      </View>
                      <View>
                        <Text style={styles.accessTitle}>Accès confirmé</Text>

                        <Text style={styles.accessText}>
                          Présentez ce billet et son QR Code à l'entrée du Camp.
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.rightColumn}>
                  <View style={styles.qrPanel}>
                    {qrCodeDataUrl ? (
                      <Image src={qrCodeDataUrl} style={styles.qrImage} />
                    ) : (
                      <View style={styles.qrFallback}>
                        <Text style={styles.qrFallbackText}>
                          QR Code indisponible
                        </Text>
                      </View>
                    )}

                    <Text style={styles.qrTitle}>Scanner à l'entrée</Text>

                    <Text style={styles.qrSubtitle}>
                      Ce QR Code permet de vérifier l'authenticité de votre
                      billet.
                    </Text>
                  </View>

                  <View style={styles.ticketNumberBox}>
                    <Text style={styles.ticketNumberLabel}>
                      Numéro du billet
                    </Text>

                    <Text style={styles.ticketNumber}>
                      {safeText(ticket.ticketNumber)}
                    </Text>
                  </View>

                  <Text style={styles.verificationText}>
                    Statut : {formatStatus(ticket.status)}
                  </Text>

                  {verificationUrl && (
                    <Text
                      style={{
                        marginTop: 4,
                        color: COLORS.muted,
                        fontSize: 5.5,
                        textAlign: "center",
                        maxWidth: 145,
                      }}
                    >
                      Vérification sécurisée SiloCamp
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerRow}>
                <Text style={styles.footerBrand}>SILO CAMP</Text>

                <Text style={styles.footerStatus}>
                  {formatStatus(ticket.status)}
                </Text>
              </View>

              <View style={styles.bottomLine} />

              <Text style={styles.footerSmall}>
                Billet généré le {formatDate(ticket.createdAt)} · Participation
                gratuite · Conservez ce document pour votre accès.
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default TicketPDF;
