import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../../../../middlewares/authMiddleware";

const prisma = new PrismaClient();

// 🔴 Désactivation de la mise à jour d'une consultation
export async function PUT(req: NextRequest) {
  return NextResponse.json({ error: "Modification des consultations interdite." }, { status: 403 });
}

// 🔴 Désactivation de la suppression d'une consultation
export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: "Suppression des consultations interdite." }, { status: 403 });
}
