import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth/login"); // Redirige immédiatement vers la page de connexion
  return null; // Empêche le rendu de tout autre contenu
}
