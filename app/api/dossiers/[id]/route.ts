import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../../middlewares/authMiddleware";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  const authCheck = authMiddleware(req, ["MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.indexOf("dossiers") + 1];
    const dossierId = Number(id);

    if (isNaN(dossierId)) {
      return NextResponse.json({ error: "ID du dossier invalide." }, { status: 400 });
    }

    const { patientNom, patientAge } = await req.json();

    if (!patientNom || !patientAge) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    const updatedDossier = await prisma.dossierMedical.update({
      where: { id: dossierId },
      data: { patientNom, patientAge },
    });

    return NextResponse.json({
      message: "Dossier mis à jour avec succès.",
      dossier: updatedDossier,
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du dossier :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = authMiddleware(req, ["ADMIN"]);
  if (authCheck) return authCheck;

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.indexOf("dossiers") + 1];
    const dossierId = Number(id);

    if (isNaN(dossierId)) {
      return NextResponse.json({ error: "ID du dossier invalide." }, { status: 400 });
    }

    await prisma.dossierMedical.delete({
      where: { id: dossierId },
    });

    return NextResponse.json({ message: "Dossier supprimé avec succès." });

  } catch (error) {
    console.error("Erreur lors de la suppression du dossier :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
