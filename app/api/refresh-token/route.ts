import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "default_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh Token manquant." }, { status: 401 });
    }

    // Vérifier le Refresh Token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as jwt.JwtPayload;

    // Générer un nouveau Token JWT
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      token: newToken,
      message: "Token renouvelé avec succès.",
    });

  } catch (error) {
    return NextResponse.json({ error: "Refresh Token invalide ou expiré." }, { status: 403 });
  }
}
