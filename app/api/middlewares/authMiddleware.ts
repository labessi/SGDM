import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "default_secret";

export function authMiddleware(req: NextRequest, allowedRoles: string[]) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;

    if (!decoded || !decoded.role) {
      return NextResponse.json({ error: "Token invalide" }, { status: 403 });
    }

    // Vérifier si l'utilisateur a le bon rôle
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Ajouter les infos utilisateur dans la requête (utile pour d'autres vérifications)
    req.headers.set("userId", decoded.id.toString());
    req.headers.set("userRole", decoded.role);

    return null; // ✅ L'utilisateur est autorisé
  } catch (error) {
    return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 403 });
  }
}