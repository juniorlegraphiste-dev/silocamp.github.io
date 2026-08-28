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
    fontSize: 24,
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
    marginBottom: 18,
    color: "#F5F0E8",
  },

  section: {
    marginBottom: 16,
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

  status: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#123D29",
    color: "#7BE0A7",
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },

  qrSection: {
    marginTop: 24,
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
});

export default function TicketPDF({
  ticket,
  verificationUrl,
  qrCodeDataUrl,
}: TicketPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.brand}>SILO CAMP</Text>

            <Text style={styles.subtitle}>
              Camp International Silo 2026
            </Text>
          </View>

          <Text style={styles.title}>
            E-BILLET DE PARTICIPATION
          </Text>

          <View style={styles.section}>
            <Text style={styles.label}>
              Participant
            </Text>

            <Text style={styles.value}>
              {ticket.participantName}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              E-mail
            </Text>

            <Text style={styles.value}>
              {ticket.email}
            </Text>
          </View>

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

          <View style={styles.section}>
            <Text style={styles.label}>
              Événement
            </Text>

            <Text style={styles.value}>
              {ticket.eventTitle}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Date
            </Text>

            <Text style={styles.value}>
              {ticket.dateLabel}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Heure
            </Text>

            <Text style={styles.value}>
              {ticket.time}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Lieu
            </Text>

            <Text style={styles.value}>
              {ticket.venue}, {ticket.city}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Numéro du billet
            </Text>

            <Text style={styles.ticketNumber}>
              {ticket.ticketNumber}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Réservation
            </Text>

            <Text style={styles.value}>
              {ticket.reservationId || "—"}
            </Text>
          </View>

          <Text style={styles.status}>
            BILLET VALIDE
          </Text>

          {qrCodeDataUrl && (
            <View style={styles.qrSection}>
              <Image
                src={qrCodeDataUrl}
                style={styles.qr}
              />

              <Text style={styles.qrText}>
                Présentez ce QR Code à l'entrée
              </Text>

              {verificationUrl && (
                <Text style={styles.qrText}>
                  {verificationUrl}
                </Text>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Ce billet est personnel et contient un QR Code
              sécurisé permettant de vérifier son authenticité.
            </Text>

            <Text style={styles.footerText}>
              SiloCamp — Camp International Silo 2026
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}