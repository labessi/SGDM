"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { HeaderMedecin } from "@/app/components/HeaderMedecin";
import CalendarView from "@/app/components/Calendar";

// Interface du rendez-vous reçu de l'API
interface RendezVousAPI {
  id: number;
  dossier: { patientNom: string };
  date: string;
}

// Interface pour le format du calendrier
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

export default function MedecinDashboard() {
  const { user } = useAuth();
  const [rendezVous, setRendezVous] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    fetch("/api/rendezvous", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`, // ✅ Ajout du token ici
      },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data: RendezVousAPI[]) => {
        const formattedRdv = data.map((rdv: RendezVousAPI) => ({
          id: rdv.id,
          title: `🧑‍⚕️ ${rdv.dossier.patientNom}`,
          start: new Date(rdv.date),
          end: new Date(new Date(rdv.date).getTime() + 30 * 60 * 1000), // Durée 30 min
        }));

        setRendezVous(formattedRdv);

        // ✅ Filtrer les rendez-vous du jour pour la notification
        const today = new Date().toISOString().split("T")[0];
        const todayAppointments = formattedRdv.filter((rdv: CalendarEvent) =>
          rdv.start.toISOString().startsWith(today)
        );

        const upcomingAppointments = formattedRdv.slice(0, 3); // Limite à 3 rendez-vous futurs

        // ✅ Créer des notifications
        const notificationsList = [];
        if (todayAppointments.length > 0) {
          notificationsList.push(`📅 Vous avez ${todayAppointments.length} rendez-vous aujourd'hui.`);
        } else {
          notificationsList.push("✅ Aucun rendez-vous prévu aujourd'hui.");
        }

        if (upcomingAppointments.length > 0) {
          notificationsList.push(
            `🔜 Prochains RDVs : ${upcomingAppointments
              .map((rdv: CalendarEvent) => rdv.title)
              .join(", ")}`
          );
        }

        setNotifications(notificationsList);
      })
      .catch(() => setError("Impossible de charger les données."))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-teal-400 to-blue-600 overflow-hidden">
      {/* ✅ Header */}
      <HeaderMedecin userName={user?.nom || "Médecin"} />

      {/* ✅ Contenu principal */}
      <main className="flex-1 overflow-y-auto p-6 mt-20 flex flex-col items-center">
        
        {/* 🔔 Boîte de notifications */}
        <div className="bg-white shadow-lg rounded-lg p-4 w-full max-w-3xl mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🔔 Notifications</h3>
          {notifications.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700">
              {notifications.map((notif, index) => (
                <li key={index}>{notif}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Aucune notification pour l'instant.</p>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Avenir, sans-serif" }}>
          📆 Mon Calendrier
        </h2>

        {/* 🔄 Affichage du chargement */}
        {loading && <p className="text-center text-gray-700">Chargement...</p>}

        {/* ❌ Affichage des erreurs */}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* 📆 Affichage du calendrier (moins large) */}
        {!loading && !error && (
          <div className="bg-white p-4 shadow-md rounded-lg w-full max-w-4xl">
            <CalendarView events={rendezVous} />
          </div>
        )}
      </main>
    </div>
  );
}
