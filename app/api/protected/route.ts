import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "default_secret"; // Clé secrète du token

export async function GET(req: NextRequest) {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Accès refusé. Token manquant." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Vérifier le token
    const decoded = jwt.verify(token, SECRET_KEY);
    
    return NextResponse.json({
      message: "Accès autorisé !",
      user: decoded, // Contenu du token
    });

  } catch (error) {
    return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 403 });
  }
}
