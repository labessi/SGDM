import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../../../middlewares/authMiddleware";

const prisma = new PrismaClient();

// 🟢 Récupérer les rendez-vous d’un médecin spécifique (MEDECIN uniquement)
export async function GET(req: NextRequest) {
  const authCheck = authMiddleware(req, ["MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const userId = segments[segments.indexOf("medecin") + 1];
    const userIdNum = Number(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json({ error: "ID du médecin invalide." }, { status: 400 });
    }

    const rendezVous = await prisma.rendezVous.findMany({
      where: { userId: userIdNum },
    });

    return NextResponse.json(rendezVous);
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
