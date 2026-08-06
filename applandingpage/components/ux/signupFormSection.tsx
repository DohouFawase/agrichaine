"use client";

import { useState } from "react";

const roleOptions = [
  { value: "producteur", label: "Producteur" },
  { value: "acheteur", label: "Acheteur" },
  { value: "transporteur", label: "Transporteur" },
  { value: "indecis", label: "Je ne sais pas encore" },
];

export default function SignupFormSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    role: "",
    ville: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: brancher l'appel API (ex: POST vers ton backend Laravel)
    setSubmitted(true);
  }

  return (
    <section id="inscription" className="signup-form-section">
      <h2>Rejoignez les 100 premiers testeurs d&apos;Onabaya</h2>
      <p>
        Laissez votre email (et votre profil : producteur, acheteur ou
        transporteur) pour être averti dès que l&apos;application est
        disponible au téléchargement. Nous ne partagerons jamais vos
        informations.
      </p>

      {submitted ? (
        <div className="signup-form-success">
          <p>
            Merci ! Vous faites partie des premiers à tester Onabaya. On vous
            écrit dès que c&apos;est prêt.
          </p>
        </div>
      ) : (
        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-form-field">
            <label htmlFor="nom">Nom</label>
            <input
              id="nom"
              name="nom"
              type="text"
              value={formData.nom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-form-field">
            <label htmlFor="role">Je suis plutôt…</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Sélectionnez une option
              </option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="signup-form-field">
            <label htmlFor="ville">Ville</label>
            <input
              id="ville"
              name="ville"
              type="text"
              value={formData.ville}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="signup-form-submit">
            Rejoindre la liste d&apos;attente
          </button>
        </form>
      )}
    </section>
  );
}