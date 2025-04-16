import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../../../../../middlewares/authMiddleware";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const authCheck = authMiddleware(req, ["MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.indexOf("dossiers") + 1];
    const consultationId = segments[segments.indexOf("consultations") + 1];

    const dossierId = Number(id);
    const consultationIdNumber = Number(consultationId);

    if (!id || isNaN(dossierId) || !consultationId || isNaN(consultationIdNumber)) {
      return NextResponse.json({ error: "IDs invalides. Vérifiez l'URL." }, { status: 400 });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { consultationId: consultationIdNumber },
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error("Erreur lors de la récupération des prescriptions :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = authMiddleware(req, ["MEDECIN"]);
  if (authCheck) return authCheck;

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.indexOf("dossiers") + 1];
    const consultationId = segments[segments.indexOf("consultations") + 1];

    const dossierId = Number(id);
    const consultationIdNumber = Number(consultationId);

    if (!id || isNaN(dossierId) || !consultationId || isNaN(consultationIdNumber)) {
      return NextResponse.json({ error: "IDs invalides. Vérifiez l'URL." }, { status: 400 });
    }

    const { medicament, dosage, duree } = await req.json();

    if (!medicament || !dosage || !duree) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    const newPrescription = await prisma.prescription.create({
      data: {
        medicament,
        dosage,
        duree,
        consultationId: consultationIdNumber,
      },
    });

    return NextResponse.json({
      message: "Prescription ajoutée avec succès.",
      prescription: newPrescription,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la prescription :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
