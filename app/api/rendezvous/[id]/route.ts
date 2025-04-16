import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../../middlewares/authMiddleware";

const prisma = new PrismaClient();

// Modifier un rendez-vous (ADMIN & MEDECIN)
export async function PUT(req: NextRequest) {
  const authCheck = authMiddleware(req, ["ADMIN", "MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.indexOf("rendezvous") + 1];
    const rendezVousId = Number(id);

    if (isNaN(rendezVousId)) {
      return NextResponse.json({ error: "ID du rendez-vous invalide." }, { status: 400 });
    }

    const { date, motif, status } = await req.json();
    if (!date || !motif || !status) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    const updatedRendezVous = await prisma.rendezVous.update({
      where: { id: rendezVousId },
      data: { date: new Date(date), motif, status },
    });

    return NextResponse.json({
      message: "Rendez-vous mis à jour avec succès.",
      rendezVous: updatedRendezVous,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rendez-vous :", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rendez-vous." },
      { status: 500 }
    );
  }
}

// Supprimer un rendez-vous (ADMIN & MEDECIN)
export async function DELETE(req: NextRequest) {
  const authCheck = authMiddleware(req, ["ADMIN", "MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.indexOf("rendezvous") + 1];
    const rendezVousId = Number(id);

    if (isNaN(rendezVousId)) {
      return NextResponse.json({ error: "ID du rendez-vous invalide." }, { status: 400 });
    }

    await prisma.rendezVous.delete({
      where: { id: rendezVousId },
    });

    return NextResponse.json({ message: "Rendez-vous annulé avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'annulation du rendez-vous :", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation du rendez-vous." },
      { status: 500 }
    );
  }
}
