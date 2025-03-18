"use client";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export function Header({ userName }: { userName: string }) {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between bg-white shadow-md px-6 py-4 fixed w-full top-0 left-0 z-10">
      {/* 🔹 Logo SGDM */}
      <Link href="/dashboard/admin">
      <Image src="/logo.webp" alt="SGDM Logo" width={50} height={50} className="rounded-full" />
</Link>
      {/* 🔹 Message de bienvenue */}
      <h2 className="text-xl font-semibold text-gray-800" style={{ fontFamily: "Avenir, sans-serif" }}>
        Bienvenue, {userName}
      </h2>

      {/* 🔹 Actions rapides */}
      <div className="flex space-x-4">
        <Link href="/rdv">
          <button className="bg-teal-400 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Gérer RDV
          </button>
        </Link>
        <Link href="/patients">
          <button className="bg-teal-400 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            Dossiers
          </button>
        </Link>
        {/* 🔹 Déconnexion */}
        <button
          onClick={() => {
            logout();
            router.push("/auth/login");
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
