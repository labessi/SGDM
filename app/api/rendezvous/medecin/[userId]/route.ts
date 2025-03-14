import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../../../middlewares/authMiddleware";

const prisma = new PrismaClient();

// 🟢 Récupérer les rendez-vous d’un médecin spécifique (MEDECIN uniquement)
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const authCheck = authMiddleware(req, ["MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const userId = Number(params.userId);
    
    const rendezVous = await prisma.rendezVous.findMany({
      where: { userId },
    });

    return NextResponse.json(rendezVous);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des rendez-vous." }, { status: 500 });
  }
}
