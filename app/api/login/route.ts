import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "default_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 🔹 Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    // 🔹 Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
    }

    // 🔹 Générer un Token JWT (expire en 1h)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // 🔹 Générer un Refresh Token (expire en 7 jours)
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // 🔹 Sauvegarder le Refresh Token en base
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    // 🔹 Stocker le token JWT dans un cookie sécurisé
    const cookieStore = await cookies(); // ✅ Ajout de `await`
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // Expiration en 1 heure
      path: "/",
    });

    return NextResponse.json({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      token, // ✅ Ajout du token dans la réponse
      refreshToken,
      message: "Connexion réussie !",
    });

  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion." },
      { status: 500 }
    );
  }
}
