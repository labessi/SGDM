"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Header } from "@/app/components/Header";
import { HeaderMedecin } from "@/app/components/HeaderMedecin";

// Types pour les dossiers et consultations
interface DossierMedical {
  id: number;
  patientNom: string;
  patientAge: number;
  userId: number;
}

interface Consultation {
  id: number;
  date: string;
  motif: string;
  observations: string;
  dossierId: number;
}

interface Prescription {
  id: number;
  medicament: string;
  dosage: string;
  duree: string;
  consultationId: number;
}

export default function PatientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [dossiers, setDossiers] = useState<DossierMedical[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la création de dossiers (ADMIN uniquement)
  const [nouveauDossier, setNouveauDossier] = useState({ patientNom: "", patientAge: "" });
  
  // États pour les consultations (MEDECIN uniquement)
  const [consultationsVisibles, setConsultationsVisibles] = useState<number | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [nouvelleConsultation, setNouvelleConsultation] = useState({
    date: "",
    motif: "",
    observations: ""
  });
  
  // États pour les prescriptions (MEDECIN uniquement)
  const [consultationSelectionnee, setConsultationSelectionnee] = useState<number | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [nouvellePrescription, setNouvellePrescription] = useState({
    medicament: "",
    dosage: "",
    duree: ""
  });
  
  // Vérifier que l'utilisateur est connecté
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  // Charger les dossiers
  useEffect(() => {
    if (!user?.token) return;

    fetch("/api/dossiers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDossiers(data);
        } else {
          setError("Format de données incorrect");
        }
      })
      .catch(() => setError("Impossible de charger les dossiers."))
      .finally(() => setLoading(false));
  }, [user]);

  // Fonction pour charger les consultations d'un dossier (MEDECIN uniquement)
  const chargerConsultations = async (dossierId: number) => {
    if (!user?.token || user.role !== "MEDECIN") return;
    
    setLoadingConsultations(true);
    
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/consultations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setConsultations(data);
        setConsultationsVisibles(dossierId);
      } else {
        setError("Format de données incorrect pour les consultations");
      }
    } catch (err) {
      setError("Impossible de charger les consultations.");
    } finally {
      setLoadingConsultations(false);
    }
  };

  // Fonction pour charger les prescriptions d'une consultation (MEDECIN uniquement)
  const chargerPrescriptions = async (dossierId: number, consultationId: number) => {
    if (!user?.token || user.role !== "MEDECIN") return;
    
    setLoadingPrescriptions(true);
    
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/consultations/${consultationId}/prescriptions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setPrescriptions(data);
        setConsultationSelectionnee(consultationId);
      } else {
        setError("Format de données incorrect pour les prescriptions");
      }
    } catch (err) {
      setError("Impossible de charger les prescriptions.");
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // Fonction pour créer un nouveau dossier (ADMIN uniquement)
  const creerDossier = async () => {
    if (!user?.token || user.role !== "ADMIN") return;
    
    // Validation des données
    if (!nouveauDossier.patientNom.trim()) {
      setError("Le nom du patient est requis");
      return;
    }
    
    if (!nouveauDossier.patientAge || isNaN(Number(nouveauDossier.patientAge))) {
      setError("L'âge doit être un nombre valide");
      return;
    }
    
    try {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          patientNom: nouveauDossier.patientNom,
          patientAge: Number(nouveauDossier.patientAge)
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Réinitialiser le formulaire et rafraîchir la liste
        setNouveauDossier({ patientNom: "", patientAge: "" });
        setError(null);
        
        // Ajouter le nouveau dossier à la liste
        setDossiers([...dossiers, data.dossier]);
      } else {
        setError(data.error || "Erreur lors de la création du dossier");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    }
  };

  // Fonction pour supprimer un dossier (ADMIN uniquement)
  const supprimerDossier = async (id: number) => {
    if (!user?.token || user.role !== "ADMIN") return;
    
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/dossiers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      if (res.ok) {
        // Mettre à jour la liste des dossiers
        setDossiers(dossiers.filter(d => d.id !== id));
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la suppression du dossier");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    }
  };

  // Fonction pour ajouter une consultation (MEDECIN uniquement)
  const ajouterConsultation = async () => {
    if (!user?.token || user.role !== "MEDECIN" || !consultationsVisibles) return;
    
    // Validation des données
    if (!nouvelleConsultation.date) {
      setError("La date est requise");
      return;
    }
    
    if (!nouvelleConsultation.motif.trim()) {
      setError("Le motif est requis");
      return;
    }
    
    if (!nouvelleConsultation.observations.trim()) {
      setError("Les observations sont requises");
      return;
    }
    
    try {
      const res = await fetch(`/api/dossiers/${consultationsVisibles}/consultations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(nouvelleConsultation),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Réinitialiser le formulaire
        setNouvelleConsultation({
          date: "",
          motif: "",
          observations: ""
        });
        setError(null);
        
        // Ajouter la nouvelle consultation à la liste
        setConsultations([...consultations, data.consultation]);
      } else {
        setError(data.error || "Erreur lors de l'ajout de la consultation");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    }
  };

  // Fonction pour ajouter une prescription (MEDECIN uniquement)
  const ajouterPrescription = async () => {
    if (!user?.token || user.role !== "MEDECIN" || !consultationsVisibles || !consultationSelectionnee) return;
    
    // Validation des données
    if (!nouvellePrescription.medicament.trim()) {
      setError("Le médicament est requis");
      return;
    }
    
    if (!nouvellePrescription.dosage.trim()) {
      setError("Le dosage est requis");
      return;
    }
    
    if (!nouvellePrescription.duree.trim()) {
      setError("La durée est requise");
      return;
    }
    
    try {
      const res = await fetch(`/api/dossiers/${consultationsVisibles}/consultations/${consultationSelectionnee}/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(nouvellePrescription),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Réinitialiser le formulaire
        setNouvellePrescription({
          medicament: "",
          dosage: "",
          duree: ""
        });
        setError(null);
        
        // Ajouter la nouvelle prescription à la liste
        setPrescriptions([...prescriptions, data.prescription]);
      } else {
        setError(data.error || "Erreur lors de l'ajout de la prescription");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    }
  };

  // S'assurer que l'utilisateur est connecté
  if (!user) return <p className="text-center text-gray-700">Chargement...</p>;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-teal-400 to-blue-600 overflow-hidden">
      {/* Header selon le rôle */}
      {user.role === "ADMIN" ? <Header userName={user.nom} /> : <HeaderMedecin userName={user.nom} />}

      <main className="flex-1 overflow-y-auto p-6 mt-20">
        <h1 className="text-2xl font-bold text-white text-center mb-6">👨‍👩‍👧‍👦 Gestion des Patients</h1>

        {loading && <p className="text-center text-white font-medium">Chargement...</p>}
        {error && <p className="text-center text-red-500 bg-white p-2 rounded mb-4 font-medium">{error}</p>}

        {/* Formulaire de création de dossier (ADMIN uniquement) */}
        {user.role === "ADMIN" && (
          <div className="bg-white shadow-lg rounded-lg p-6 max-w-3xl mx-auto mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">➕ Nouveau dossier patient</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Nom du patient"
                value={nouveauDossier.patientNom}
                onChange={(e) => setNouveauDossier({ ...nouveauDossier, patientNom: e.target.value })}
                className="flex-1 border p-2 rounded text-gray-800"
              />
              <input
                type="number"
                placeholder="Âge"
                value={nouveauDossier.patientAge}
                onChange={(e) => setNouveauDossier({ ...nouveauDossier, patientAge: e.target.value })}
                className="w-full md:w-32 border p-2 rounded text-gray-800"
              />
              <button 
                onClick={creerDossier} 
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        )}

        {/* Liste des dossiers */}
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📁 Dossiers patients</h2>
          
          {dossiers.length === 0 ? (
            <p className="text-center text-gray-800 my-4 font-medium">Aucun dossier patient trouvé.</p>
          ) : (
            <div className="space-y-4">
              {dossiers.map((dossier) => (
                <div key={dossier.id} className="border rounded-lg overflow-hidden">
                  {/* En-tête du dossier */}
                  <div className="bg-gray-100 p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{dossier.patientNom}</h3>
                        <p className="text-gray-700 font-medium">{dossier.patientAge} ans</p>
                      </div>
                      <div className="flex gap-2">
                        {/* Bouton pour voir les consultations (MEDECIN uniquement) */}
                        {user.role === "MEDECIN" && (
                          <button 
                            onClick={() => {
                              if (consultationsVisibles === dossier.id) {
                                setConsultationsVisibles(null);
                                setConsultationSelectionnee(null);
                                setPrescriptions([]);
                              } else {
                                chargerConsultations(dossier.id);
                              }
                            }} 
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            {consultationsVisibles === dossier.id ? "Masquer consultations" : "Voir consultations"}
                          </button>
                        )}
                        
                        {/* Bouton pour supprimer un dossier (ADMIN uniquement) */}
                        {user.role === "ADMIN" && (
                          <button 
                            onClick={() => supprimerDossier(dossier.id)} 
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consultations (visibles uniquement pour MEDECIN si demandé) */}
                  {user.role === "MEDECIN" && consultationsVisibles === dossier.id && (
                    <div className="p-4 border-t">
                      <h4 className="font-semibold mb-3 text-gray-800">📋 Historique des consultations</h4>
                      
                      {loadingConsultations ? (
                        <p className="text-center text-gray-800 my-2 font-medium">Chargement des consultations...</p>
                      ) : consultations.length === 0 ? (
                        <p className="text-center text-gray-800 my-2 font-medium">Aucune consultation enregistrée.</p>
                      ) : (
                        <div className="space-y-3">
                          {consultations.map((consultation) => (
                            <div key={consultation.id} className="bg-gray-50 p-3 rounded border">
                              <div className="flex justify-between">
                                <div className="font-medium text-gray-800">{new Date(consultation.date).toLocaleDateString('fr-FR')}</div>
                                <div className="text-gray-700 font-medium">{consultation.motif}</div>
                              </div>
                              <div className="mt-2 text-gray-800">
                                <p className="text-sm">{consultation.observations}</p>
                              </div>
                              
                              {/* Bouton pour afficher les prescriptions */}
                              <div className="mt-3 flex justify-between items-center">
                                <button 
                                  onClick={() => {
                                    if (consultationSelectionnee === consultation.id) {
                                      setConsultationSelectionnee(null);
                                      setPrescriptions([]);
                                    } else {
                                      chargerPrescriptions(dossier.id, consultation.id);
                                    }
                                  }}
                                  className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                                >
                                  {consultationSelectionnee === consultation.id ? "Masquer prescriptions" : "Voir prescriptions"}
                                </button>
                                <div className="text-xs text-gray-700 font-medium">
                                  {new Date(consultation.date).toLocaleTimeString('fr-FR')}
                                </div>
                              </div>
                              
                              {/* Prescriptions (visibles uniquement si demandé) */}
                              {consultationSelectionnee === consultation.id && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <h5 className="text-sm font-semibold mb-2 text-gray-800">💊 Prescriptions</h5>
                                  
                                  {loadingPrescriptions ? (
                                    <p className="text-center text-gray-800 my-2 text-xs font-medium">Chargement des prescriptions...</p>
                                  ) : prescriptions.length === 0 ? (
                                    <p className="text-center text-gray-800 my-2 text-xs font-medium">Aucune prescription enregistrée.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {prescriptions.map((prescription) => (
                                        <div key={prescription.id} className="bg-blue-50 p-2 rounded text-sm">
                                          <div className="font-medium text-gray-800">{prescription.medicament}</div>
                                          <div className="flex justify-between text-xs text-gray-700 font-medium">
                                            <div>Dosage: {prescription.dosage}</div>
                                            <div>Durée: {prescription.duree}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Formulaire d'ajout de prescription */}
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <h5 className="text-sm font-semibold mb-2 text-gray-800">➕ Nouvelle prescription</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <input
                                        type="text"
                                        placeholder="Médicament"
                                        value={nouvellePrescription.medicament}
                                        onChange={(e) => setNouvellePrescription({ ...nouvellePrescription, medicament: e.target.value })}
                                        className="w-full border p-1 rounded text-sm text-gray-800"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Dosage"
                                        value={nouvellePrescription.dosage}
                                        onChange={(e) => setNouvellePrescription({ ...nouvellePrescription, dosage: e.target.value })}
                                        className="w-full border p-1 rounded text-sm text-gray-800"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Durée"
                                        value={nouvellePrescription.duree}
                                        onChange={(e) => setNouvellePrescription({ ...nouvellePrescription, duree: e.target.value })}
                                        className="w-full border p-1 rounded text-sm text-gray-800"
                                      />
                                    </div>
                                    <button 
                                      onClick={ajouterPrescription} 
                                      className="mt-2 w-full bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                                    >
                                      Ajouter prescription
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Formulaire d'ajout de consultation */}
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold mb-3 text-gray-800">➕ Nouvelle consultation</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-800">Date</label>
                            <input
                              type="datetime-local"
                              value={nouvelleConsultation.date}
                              onChange={(e) => setNouvelleConsultation({ ...nouvelleConsultation, date: e.target.value })}
                              className="w-full border p-2 rounded text-gray-800"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-800">Motif</label>
                            <input
                              type="text"
                              value={nouvelleConsultation.motif}
                              onChange={(e) => setNouvelleConsultation({ ...nouvelleConsultation, motif: e.target.value })}
                              className="w-full border p-2 rounded text-gray-800"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-800">Observations</label>
                            <textarea
                              value={nouvelleConsultation.observations}
                              onChange={(e) => setNouvelleConsultation({ ...nouvelleConsultation, observations: e.target.value })}
                              className="w-full border p-2 rounded text-gray-800"
                              rows={3}
                            />
                          </div>
                          <button 
                            onClick={ajouterConsultation} 
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            Enregistrer la consultation
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}