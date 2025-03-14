import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Vérifier l'authentification (seuls ADMIN et MEDECIN peuvent voir les dossiers)
  const authCheck = authMiddleware(req, ["ADMIN", "MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const dossiers = await prisma.dossierMedical.findMany();
    return NextResponse.json(dossiers);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des dossiers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Vérifier l'authentification (ADMIN et MEDECIN peuvent créer un dossier)
  const authCheck = authMiddleware(req, ["ADMIN", "MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const { patientNom, patientAge } = await req.json();
    const userId = Number(req.headers.get("userId")); // Récupérer l'ID du créateur du dossier

    if (!patientNom || !patientAge) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    const newDossier = await prisma.dossierMedical.create({
      data: {
        patientNom,
        patientAge,
        userId, // Associer le dossier au créateur
      },
    });

    return NextResponse.json({ message: "Dossier médical créé avec succès.", dossier: newDossier });

  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création du dossier." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Vérifier l'authentification (ADMIN et MEDECIN peuvent modifier un dossier)
  const authCheck = authMiddleware(req, ["ADMIN", "MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const { patientNom, patientAge } = await req.json();
    const url = new URL(req.url);
    const dossierId = Number(url.pathname.split("/").pop());

    if (!dossierId || !patientNom || !patientAge) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    const updatedDossier = await prisma.dossierMedical.update({
      where: { id: dossierId },
      data: { patientNom, patientAge },
    });

    return NextResponse.json({ message: "Dossier mis à jour avec succès.", dossier: updatedDossier });

  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du dossier." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Vérifier l'authentification (seuls les ADMIN peuvent supprimer un dossier)
  const authCheck = authMiddleware(req, ["ADMIN"]);
  if (authCheck) return authCheck;

  try {
    const url = new URL(req.url);
    const dossierId = Number(url.pathname.split("/").pop());

    if (!dossierId) {
      return NextResponse.json({ error: "ID du dossier requis." }, { status: 400 });
    }

    await prisma.dossierMedical.delete({
      where: { id: dossierId },
    });

    return NextResponse.json({ message: "Dossier supprimé avec succès." });

  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression du dossier." }, { status: 500 });
  }
}
