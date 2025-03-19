"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Header } from "@/app/components/Header";
import { HeaderMedecin } from "@/app/components/HeaderMedecin";

// Interface des rendez-vous
interface RendezVous {
  id: number;
  date: string;
  motif: string;
  status: string;
  dossier: { patientNom: string };
  user: { nom: string; prenom: string };
}

export default function RdvPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    date: string;
    motif: string;
    status: string;
  }>({
    date: "",
    motif: "",
    status: ""
  });
  const [newRdv, setNewRdv] = useState({ 
    date: "", 
    motif: "", 
    dossierId: "", 
    userId: "" 
  });

  // 🚨 Vérifier que l'utilisateur est connecté
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  // Charger les rendez-vous
  useEffect(() => {
    if (!user?.token) return; // ✅ Vérification

    fetch("/api/rendezvous", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => setRendezVous(data))
      .catch(() => setError("Impossible de charger les rendez-vous."))
      .finally(() => setLoading(false));
  }, [user]);

  // Préparer le formulaire d'édition
  const handleEditClick = (rdv: RendezVous) => {
    setEditingId(rdv.id);
    setEditForm({
      date: rdv.date,
      motif: rdv.motif,
      status: rdv.status
    });
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingId(null);
  };

  // Modifier un RDV
  const handleUpdate = async (id: number) => {
    if (!user?.token) return;

    const res = await fetch(`/api/rendezvous/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setEditingId(null);
      refreshData();
    } else {
      console.error("Erreur lors de la mise à jour du RDV");
      try {
        const errorData = await res.json();
        setError(errorData.error || "Erreur lors de la mise à jour du RDV");
      } catch (e) {
        setError("Erreur lors de la mise à jour du RDV");
      }
    }
  };

  // Supprimer un RDV
  const handleDelete = async (id: number) => {
    if (!user?.token) return;
    
    if (!confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) {
      return;
    }

    const res = await fetch(`/api/rendezvous/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (res.ok) {
      refreshData();
    } else {
      console.error("Erreur lors de la suppression du RDV");
      try {
        const errorData = await res.json();
        setError(errorData.error || "Erreur lors de la suppression du RDV");
      } catch (e) {
        setError("Erreur lors de la suppression du RDV");
      }
    }
  };

  // Créer un RDV (Admin uniquement)
  const handleCreate = async () => {
    if (!user?.token) return;

    // Vérifier que tous les champs sont remplis
    if (!newRdv.date || !newRdv.motif || !newRdv.dossierId || !newRdv.userId) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      // Conversion des chaînes en nombres pour les IDs
      const formData = {
        date: newRdv.date,
        motif: newRdv.motif,
        dossierId: parseInt(newRdv.dossierId, 10),
        userId: parseInt(newRdv.userId, 10)
      };

      const res = await fetch("/api/rendezvous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setNewRdv({ date: "", motif: "", dossierId: "", userId: "" });
        refreshData();
        setError(null);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Erreur lors de la création du RDV");
      }
    } catch (e) {
      console.error("Erreur lors de la création du RDV:", e);
      setError("Erreur lors de la création du RDV. Vérifiez les valeurs saisies.");
    }
  };

  // Rafraîchir les données
  const refreshData = async () => {
    setLoading(true);
    fetch("/api/rendezvous", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`,
      },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => setRendezVous(data))
      .catch(() => setError("Impossible de charger les rendez-vous."))
      .finally(() => setLoading(false));
  };

  // ✅ 🚨 S'assurer que `user` n'est jamais `null`
  if (!user) return <p className="text-center text-gray-700">Chargement...</p>;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-teal-400 to-blue-600 overflow-hidden">
      {/* Header selon le rôle */}
      {user.role === "ADMIN" ? <Header userName={user.nom} /> : <HeaderMedecin userName={user.nom} />}

      <main className="flex-1 overflow-y-auto p-6 mt-20">
        <h1 className="text-2xl font-bold text-white text-center mb-6">📅 Mes Rendez-vous</h1>

        {loading && <p className="text-center text-white">Chargement...</p>}
        {error && <p className="text-center text-red-500 bg-white p-2 rounded mb-4">{error}</p>}

        {/* Formulaire d'ajout de RDV (Admin uniquement) */}
        {user.role === "ADMIN" && (
          <div className="bg-white shadow-lg rounded-lg p-6 max-w-3xl mx-auto mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">➕ Ajouter un Rendez-vous</h2>
            <input
              type="datetime-local"
              value={newRdv.date}
              onChange={(e) => setNewRdv({ ...newRdv, date: e.target.value })}
              className="w-full border p-2 mb-2 text-gray-800"
            />
            <input
              type="text"
              placeholder="Motif"
              value={newRdv.motif}
              onChange={(e) => setNewRdv({ ...newRdv, motif: e.target.value })}
              className="w-full border p-2 mb-2 text-gray-800"
            />
            <input
              type="number"
              placeholder="ID du dossier patient"
              value={newRdv.dossierId}
              onChange={(e) => setNewRdv({ ...newRdv, dossierId: e.target.value })}
              className="w-full border p-2 mb-2 text-gray-800"
            />
            <input
              type="number"
              placeholder="ID du médecin"
              value={newRdv.userId}
              onChange={(e) => setNewRdv({ ...newRdv, userId: e.target.value })}
              className="w-full border p-2 mb-2 text-gray-800"
            />
            <button onClick={handleCreate} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700">
              Ajouter
            </button>
          </div>
        )}

        {/* Liste des rendez-vous */}
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
          {rendezVous.length > 0 ? (
            <table className="w-full border-collapse border border-gray-200 text-gray-900">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">📅 Date</th>
                  <th className="border p-2">👨‍⚕️ Patient</th>
                  {user.role === "ADMIN" && <th className="border p-2">👨‍⚕️ Médecin</th>}
                  <th className="border p-2">🔍 Motif</th>
                  <th className="border p-2">📌 Statut</th>
                  <th className="border p-2">⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {rendezVous.map((rdv) => (
                  <>
                    <tr key={rdv.id} className="text-center">
                      <td className="border p-2">{new Date(rdv.date).toLocaleString("fr-FR")}</td>
                      <td className="border p-2">{rdv.dossier.patientNom}</td>
                      {user.role === "ADMIN" && (
                        <td className="border p-2">{`${rdv.user.nom} ${rdv.user.prenom}`}</td>
                      )}
                      <td className="border p-2">{rdv.motif}</td>
                      <td className="border p-2">{rdv.status}</td>
                      <td className="border p-2">
                        <button 
                          onClick={() => handleEditClick(rdv)} 
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Modifier
                        </button>
                        <button 
                          onClick={() => handleDelete(rdv.id)} 
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 ml-2"
                        >
                          Annuler
                        </button>
                      </td>
                    </tr>
                    {/* Formulaire d'édition intégré sous la ligne du rendez-vous */}
                    {editingId === rdv.id && (
                      <tr>
                        <td colSpan={user.role === "ADMIN" ? 6 : 5} className="border p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-sm font-medium mb-1">Date et heure</label>
                              <input
                                type="datetime-local"
                                value={editForm.date}
                                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                className="w-full border p-2 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Motif</label>
                              <input
                                type="text"
                                value={editForm.motif}
                                onChange={(e) => setEditForm({...editForm, motif: e.target.value})}
                                className="w-full border p-2 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Statut</label>
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                className="w-full border p-2 rounded"
                              >
                                <option value="PLANIFIE">Planifié</option>
                                <option value="CONFIRME">Confirmé</option>
                                <option value="ANNULE">Annulé</option>
                                <option value="COMPLETE">Terminé</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-3">
                            <button
                              onClick={() => handleUpdate(rdv.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-700"
                            >
                              Annuler
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-600">Aucun rendez-vous trouvé.</p>
          )}
        </div>
      </main>
    </div>
  );
}