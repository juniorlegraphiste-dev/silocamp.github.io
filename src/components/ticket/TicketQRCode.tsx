"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import type { Ticket } from "@/services/ticketService";
import { getVerificationUrl } from "@/services/ticketService";

type TicketQRCodeProps = {
  ticket: Ticket;
  size?: number;
  className?: string;
};

export default function TicketQRCode({
  ticket,
  size = 220,
  className = "",
}: TicketQRCodeProps) {
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function generateQRCode() {
      try {
        const verificationUrl = getVerificationUrl(ticket);

        const dataUrl = await QRCode.toDataURL(verificationUrl, {
          width: size,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#111827",
            light: "#FFFFFF",
          },
        });

        if (!cancelled) {
          setQrCode(dataUrl);
        }
      } catch (error) {
        console.error(
          "[SiloCamp] Impossible de générer le QR Code :",
          error,
        );
      }
    }

    generateQRCode();

    return () => {
      cancelled = true;
    };
  }, [ticket, size]);

  if (!qrCode) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-gray-100 ${className}`}
        style={{
          width: size,
          height: size,
        }}
      >
        <span className="text-sm text-gray-500">
          Génération...
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex rounded-2xl bg-white p-4 shadow-sm ${className}`}
    >
      <img
        src={qrCode}
        alt={`QR Code du billet ${ticket.ticketNumber}`}
        width={size}
        height={size}
        className="block"
      />
    </div>
  );
}