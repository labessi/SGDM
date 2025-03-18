"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Header } from "@/app/components/Header";
import { Card } from "@/app/components/Card";

interface DashboardStats {
  totalRdv: number;
  totalMedecins: number;
  totalPatients: number;
  rdvEnAttente: number;
}

interface RendezVous {
  id: number;
  patientNom: string;
  date: string;
  medecinNom: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Redirection si l'utilisateur n'est pas un admin
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    } else if (user.role !== "ADMIN") {
      router.push("/dashboard/medecin");
    }
  }, [user, router]);

  // 🔹 Chargement des données du dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.token) return;

      try {
        const res = await fetch("/api/rendezvous", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`, // ✅ Ajout du token ici
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Erreur API : ${res.status}`);
        }

        const data = await res.json();

        setStats({
          totalRdv: data.length,
          totalMedecins: new Set(data.map((rdv: any) => rdv.user.id)).size,
          totalPatients: new Set(data.map((rdv: any) => rdv.dossier.patientNom)).size,
          rdvEnAttente: data.filter((rdv: any) => rdv.status === "EN_ATTENTE").length,
        });

        setRendezVous(
          data
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
            .map((rdv: any) => ({
              id: rdv.id,
              patientNom: rdv.dossier.patientNom,
              date: rdv.date,
              medecinNom: `${rdv.user.nom} ${rdv.user.prenom}`,
            }))
        );
      } catch (err) {
        setError("Impossible de charger les données du tableau de bord.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboardData();
  }, [user]);

  if (!user || user.role !== "ADMIN") return null; // 🚀 Empêche l'affichage avant redirection

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-teal-400 to-blue-600 overflow-hidden">
      {/* ✅ Header */}
      <Header userName={`${user.nom} ${user.prenom}`} />

      {/* ✅ Contenu principal */}
      <main className="flex-1 overflow-y-auto p-6 mt-20">
        {loading && <p className="text-center text-white">Chargement...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* 📊 Statistiques Globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card title="📅 Total RDVs" subtitle={`${stats?.totalRdv || 0}`} description="Nombre total de rendez-vous" />
          <Card title="👨‍⚕️ Médecins" subtitle={`${stats?.totalMedecins || 0}`} description="Médecins actifs" />
          <Card title="🏥 Patients" subtitle={`${stats?.totalPatients || 0}`} description="Patients enregistrés" />
          <Card title="🔍 En Attente" subtitle={`${stats?.rdvEnAttente || 0}`} description="RDVs en attente" />
        </div>

        {/* 📅 Prochains Rendez-vous */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📆 Prochains Rendez-vous</h2>
          {rendezVous.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rendezVous.map((rdv) => (
                <Card
                  key={rdv.id}
                  title={`🧑‍⚕️ Patient : ${rdv.patientNom}`}
                  subtitle={`📅 ${new Date(rdv.date).toLocaleString("fr-FR")}`}
                  description={`👨‍⚕️ Médecin : ${rdv.medecinNom}`}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">Aucun rendez-vous à venir.</p>
          )}
        </div>
      </main>
    </div>
  );
}
