import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

import type { Ticket } from "@/services/ticketService";

type TicketPDFProps = {
  ticket: Ticket;
  verificationUrl?: string;
  qrCodeDataUrl?: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#0B0A08",
    color: "#F5F0E8",
    fontFamily: "Helvetica",
  },

  container: {
    borderWidth: 1,
    borderColor: "#B8954A",
    borderRadius: 16,
    padding: 24,
  },

  header: {
    marginBottom: 24,
    textAlign: "center",
  },

  brand: {
    fontSize: 25,
    fontFamily: "Helvetica-Bold",
    color: "#D4AF62",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 10,
    color: "#B8B0A4",
  },

  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 20,
    color: "#F5F0E8",
    textAlign: "center",
  },

  eventBox: {
    padding: 14,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: "#15120E",
    borderWidth: 1,
    borderColor: "#2E2921",
  },

  eventLabel: {
    fontSize: 8,
    color: "#A9A196",
    textTransform: "uppercase",
    marginBottom: 5,
  },

  eventTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#D4AF62",
  },

  section: {
    marginBottom: 14,
  },

  label: {
    fontSize: 8,
    color: "#A9A196",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  value: {
    fontSize: 11,
    color: "#F5F0E8",
  },

  ticketNumber: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#D4AF62",
    marginTop: 4,
  },

  reservationNumber: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#C9C0B4",
    marginTop: 3,
  },

  status: {
    marginTop: 8,
    padding: 9,
    borderRadius: 8,
    backgroundColor: "#123D29",
    color: "#7BE0A7",
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },

  qrSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#2E2921",
    alignItems: "center",
    justifyContent: "center",
  },

  qr: {
    width: 150,
    height: 150,
  },

  qrText: {
    marginTop: 10,
    fontSize: 8,
    color: "#A9A196",
    textAlign: "center",
  },

  verificationUrl: {
    marginTop: 6,
    maxWidth: 430,
    fontSize: 7,
    color: "#70695F",
    textAlign: "center",
  },

  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2E2921",
    textAlign: "center",
  },

  footerText: {
    fontSize: 8,
    color: "#8F887E",
    lineHeight: 1.4,
  },

  footerBrand: {
    marginTop: 5,
    fontSize: 8,
    color: "#B8954A",
    fontFamily: "Helvetica-Bold",
  },
});

export default function TicketPDF({
  ticket,
  verificationUrl,
  qrCodeDataUrl,
}: TicketPDFProps) {
  const participantName =
    ticket.participantName ||
    [ticket.firstName, ticket.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Participant";

  const statusLabel =
    ticket.status === "VALID"
      ? "BILLET VALIDE"
      : ticket.status === "USED"
        ? "BILLET DÉJÀ UTILISÉ"
        : "BILLET ANNULÉ";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.brand}>SILO CAMP</Text>

            <Text style={styles.subtitle}>
              Camp International Silo 2026
            </Text>
          </View>

          {/* TITRE */}
          <Text style={styles.title}>
            E-BILLET DE PARTICIPATION
          </Text>

          {/* ÉVÉNEMENT */}
          <View style={styles.eventBox}>
            <Text style={styles.eventLabel}>
              Événement
            </Text>

            <Text style={styles.eventTitle}>
              {ticket.eventTitle}
            </Text>
          </View>

          {/* PARTICIPANT */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Participant
            </Text>

            <Text style={styles.value}>
              {participantName}
            </Text>
          </View>

          {/* EMAIL */}
          <View style={styles.section}>
            <Text style={styles.label}>
              E-mail
            </Text>

            <Text style={styles.value}>
              {ticket.email}
            </Text>
          </View>

          {/* TÉLÉPHONE */}
          {ticket.phone && (
            <View style={styles.section}>
              <Text style={styles.label}>
                Téléphone
              </Text>

              <Text style={styles.value}>
                {ticket.phone}
              </Text>
            </View>
          )}

          {/* DATE */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Date
            </Text>

            <Text style={styles.value}>
              {ticket.dateLabel}
            </Text>
          </View>

          {/* HEURE */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Heure
            </Text>

            <Text style={styles.value}>
              {ticket.time}
            </Text>
          </View>

          {/* DURÉE */}
          {ticket.duration && (
            <View style={styles.section}>
              <Text style={styles.label}>
                Durée
              </Text>

              <Text style={styles.value}>
                {ticket.duration}
              </Text>
            </View>
          )}

          {/* LIEU */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Lieu
            </Text>

            <Text style={styles.value}>
              {ticket.venue}, {ticket.city}
            </Text>
          </View>

          {/* NUMÉRO DU BILLET */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Numéro du billet
            </Text>

            <Text style={styles.ticketNumber}>
              {ticket.ticketNumber}
            </Text>
          </View>

          {/* NUMÉRO DE RÉSERVATION */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Numéro de réservation
            </Text>

            <Text style={styles.reservationNumber}>
              {ticket.reservationId || "—"}
            </Text>
          </View>

          {/* STATUT */}
          <Text style={styles.status}>
            {statusLabel}
          </Text>

          {/* QR CODE */}
          {qrCodeDataUrl && (
            <View style={styles.qrSection}>
              <Image
                src={qrCodeDataUrl}
                style={styles.qr}
              />

              <Text style={styles.qrText}>
                Présentez ce QR Code à l'entrée du Camp
              </Text>

              {verificationUrl && (
                <Text style={styles.verificationUrl}>
                  {verificationUrl}
                </Text>
              )}
            </View>
          )}

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Ce billet est personnel et contient un QR Code
              sécurisé permettant de vérifier son authenticité.
            </Text>

            <Text style={styles.footerBrand}>
              SiloCamp — Camp International Silo 2026
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}