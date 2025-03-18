import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware";

const prisma = new PrismaClient();

/** 🔹 Récupérer les rendez-vous */
export async function GET(req: NextRequest) {
  // Utiliser le middleware pour vérifier l'authentification
  const authCheck = authMiddleware(req, ["ADMIN", "MEDECIN"]);
  if (authCheck) return authCheck;

  // Récupérer le rôle et l'ID depuis les en-têtes (définis par le middleware)
  const userRole = req.headers.get("userRole"); // Remarquez le nom: "userRole" et non "role"
  const userId = Number(req.headers.get("userId"));

  try {
    let rendezVous;

    if (userRole === "ADMIN") {
      // 🔹 L'Admin voit tous les rendez-vous
      rendezVous = await prisma.rendezVous.findMany({
        include: { dossier: true, user: true },
      });
    } else if (userRole === "MEDECIN") {
      // 🔹 Le Médecin ne voit que ses propres rendez-vous
      rendezVous = await prisma.rendezVous.findMany({
        where: { userId },
        include: { dossier: true },
      });
    } else {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    return NextResponse.json(rendezVous);
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/** 🔹 Créer un rendez-vous (ADMIN uniquement) */
export async function POST(req: NextRequest) {
  const authCheck = authMiddleware(req, ["ADMIN"]);
  if (authCheck) return authCheck;

  try {
    const { date, motif, dossierId, userId } = await req.json();

    if (!date || !motif || !dossierId || !userId) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    const existingDossier = await prisma.dossierMedical.findUnique({ where: { id: dossierId } });
    if (!existingDossier) return NextResponse.json({ error: "Dossier médical introuvable." }, { status: 404 });

    const existingUser = await prisma.user.findUnique({ where: { id: userId, role: "MEDECIN" } });
    if (!existingUser) return NextResponse.json({ error: "Médecin introuvable." }, { status: 404 });

    // 🔥 Vérifier que le médecin n'a pas déjà un RDV à la même heure
    const conflictingRdv = await prisma.rendezVous.findFirst({
      where: {
        userId,
        date: new Date(date),
      },
    });

    if (conflictingRdv) {
      return NextResponse.json({ error: "Le médecin a déjà un rendez-vous à cette heure." }, { status: 400 });
    }

    // Créer le rendez-vous
    const newRendezVous = await prisma.rendezVous.create({
      data: { date: new Date(date), motif, dossierId, userId },
    });

    return NextResponse.json({ message: "Rendez-vous créé avec succès.", rendezVous: newRendezVous });

  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/** 🔹 Modifier un rendez-vous (MEDECIN uniquement) */
export async function PUT(req: NextRequest) {
  const authCheck = authMiddleware(req, ["MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const { rendezVousId, date, motif, status } = await req.json();

    if (!rendezVousId || (!date && !motif && !status)) {
      return NextResponse.json({ error: "ID du rendez-vous et au moins un champ requis." }, { status: 400 });
    }

    const existingRdv = await prisma.rendezVous.findUnique({ where: { id: rendezVousId } });
    if (!existingRdv) return NextResponse.json({ error: "Rendez-vous introuvable." }, { status: 404 });

    // Vérifier si le médecin a un autre RDV à la même heure
    if (date) {
      const conflictingRdv = await prisma.rendezVous.findFirst({
        where: {
          userId: existingRdv.userId,
          date: new Date(date),
          NOT: { id: rendezVousId }, // Exclure le RDV actuel
        },
      });

      if (conflictingRdv) {
        return NextResponse.json({ error: "Vous avez déjà un rendez-vous à cette heure." }, { status: 400 });
      }
    }

    const updatedRdv = await prisma.rendezVous.update({
      where: { id: rendezVousId },
      data: { date: date ? new Date(date) : existingRdv.date, motif: motif || existingRdv.motif, status: status || existingRdv.status },
    });

    return NextResponse.json({ message: "Rendez-vous mis à jour.", rendezVous: updatedRdv });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du rendez-vous :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/** 🔹 Supprimer un rendez-vous (ADMIN uniquement) */
export async function DELETE(req: NextRequest) {
  const authCheck = authMiddleware(req, ["ADMIN"]);
  if (authCheck) return authCheck;

  try {
    const { rendezVousId } = await req.json();

    if (!rendezVousId) {
      return NextResponse.json({ error: "ID du rendez-vous requis." }, { status: 400 });
    }

    await prisma.rendezVous.delete({ where: { id: rendezVousId } });

    return NextResponse.json({ message: "Rendez-vous supprimé avec succès." });

  } catch (error) {
    console.error("Erreur lors de la suppression du rendez-vous :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}