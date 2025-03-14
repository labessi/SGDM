import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../../../middlewares/authMiddleware";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  // Vérifier l'authentification (seuls les MEDECINS peuvent voir les consultations)
  const authCheck = authMiddleware(req, ["MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    // ✅ Correction : `await` pour récupérer params correctement
    const { id } = await context.params;
    const dossierId = Number(id);

    if (isNaN(dossierId)) {
      return NextResponse.json({ error: "ID du dossier invalide." }, { status: 400 });
    }

    const consultations = await prisma.consultation.findMany({
      where: { dossierId },
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error("Erreur lors de la récupération des consultations :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  // Vérifier l'authentification (seuls les MEDECINS peuvent ajouter une consultation)
  const authCheck = authMiddleware(req, ["MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    // ✅ Correction : `await` pour récupérer params correctement
    const { id } = await context.params;
    const dossierId = Number(id);

    if (isNaN(dossierId)) {
      return NextResponse.json({ error: "ID du dossier invalide." }, { status: 400 });
    }

    const { date, motif, observations } = await req.json();

    if (!date || !motif || !observations) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    const newConsultation = await prisma.consultation.create({
      data: {
        date: new Date(date),
        motif,
        observations,
        dossierId,
      },
    });

    return NextResponse.json({ message: "Consultation ajoutée avec succès.", consultation: newConsultation });

  } catch (error) {
    console.error("Erreur lors de l'ajout de la consultation :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
