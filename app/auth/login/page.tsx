"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard/admin"); // ✅ Redirection après connexion
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-b from-teal-400 to-blue-600">
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20 text-white text-2xl italic font-[Tiempos, serif]">
        "Facilitons ensemble la gestion médicale"
      </div>

      <div className="bg-white shadow-xl rounded-xl p-10 w-full max-w-md border border-gray-200 relative z-10">
        <div className="text-center mb-6">
          <Image src="/logo.webp" alt="SGDM Logo" width={100} height={100} className="mx-auto rounded-full object-cover" />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">SGDM</h1>
          <p className="text-gray-600 text-sm">Système de Gestion Médicale</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {error && <p className="text-center text-red-500">{error}</p>}

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 transition"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
