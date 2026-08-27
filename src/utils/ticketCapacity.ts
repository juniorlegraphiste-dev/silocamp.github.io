import { supabase } from "@/lib/supabase";

export type TicketReservationResult = {
  success: boolean;
  message?: string;
  reserved?: number;
  total_reserved?: number;
  remaining?: number;
};

export async function reserveTickets(
  quantity: number,
): Promise<TicketReservationResult> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {
      success: false,
      message: "Quantité de billets invalide.",
    };
  }

  if (quantity > 10) {
    return {
      success: false,
      message: "Vous ne pouvez réserver que 10 billets maximum.",
    };
  }

  const { data, error } = await supabase.rpc("reserve_tickets", {
    requested_quantity: quantity,
  });

  if (error) {
    console.error("Erreur réservation :", error);

    return {
      success: false,
      message: "Une erreur est survenue lors de la réservation.",
    };
  }

  return data as TicketReservationResult;
}

export async function getTicketsRemaining(): Promise<number> {
  const { data, error } = await supabase
    .from("ticket_inventory")
    .select("total_tickets, reserved_tickets")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Erreur récupération billets :", error);

    return 0;
  }

  return data.total_tickets - data.reserved_tickets;
}
