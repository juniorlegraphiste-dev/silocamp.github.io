import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  /**
   * Vérifie si l'administrateur possède déjà une session.
   */
  useEffect(() => {
    let mounted = true;

    fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        const data = await response
          .json()
          .catch(() => null);

        if (
          mounted &&
          response.ok &&
          data?.authenticated === true
        ) {
          setAuthenticated(true);
        }
      })
      .catch(() => {
        // Pas de session :
        // on reste sur la page de connexion.
      })
      .finally(() => {
        if (mounted) {
          setChecking(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Écran de chargement pendant la vérification
   * de la session existante.
   */
  if (checking) {
    return (
      <div className="min-h-screen bg-[#080807] flex items-center justify-center text-cream">
        <div className="flex items-center gap-3 text-sm text-cream/60">
          <Loader2 className="w-5 h-5 animate-spin" />
          Vérification de la session...
        </div>
      </div>
    );
  }

  /**
   * Si l'administrateur est déjà connecté,
   * redirection vers le dashboard.
   */
  if (authenticated) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  /**
   * Connexion administrateur.
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            login: username.trim(),
            password,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        data?.authenticated !== true
      ) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Identifiant ou mot de passe incorrect."
        );
      }

      /**
       * Connexion réussie.
       * On vide le mot de passe du formulaire
       * avant la navigation.
       */
      setPassword("");

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de se connecter."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080807] text-cream flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

        {/* Logo / identité */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C8A45D]/30 bg-[#C8A45D]/10">
            <ShieldCheck className="h-8 w-8 text-[#C8A45D]" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            SiloCamp
          </h1>

          <p className="mt-2 text-sm text-cream/50">
            Administration
          </p>
        </div>

        {/* Carte */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 shadow-2xl backdrop-blur-xl">

          <div className="mb-7">
            <h2 className="text-xl font-semibold">
              Connexion administrateur
            </h2>

            <p className="mt-2 text-sm leading-6 text-cream/50">
              Connectez-vous pour accéder au
              tableau de bord SiloCamp.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Identifiant */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-cream/80"
              >
                Identifiant
              </label>

              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Votre identifiant"
                required
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-cream outline-none transition placeholder:text-cream/25 focus:border-[#C8A45D]/60 focus:ring-2 focus:ring-[#C8A45D]/10 disabled:opacity-50"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-cream/80"
              >
                Mot de passe
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/30" />

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Votre mot de passe"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-black/30 py-3.5 pl-11 pr-4 text-sm text-cream outline-none transition placeholder:text-cream/25 focus:border-[#C8A45D]/60 focus:ring-2 focus:ring-[#C8A45D]/10 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8A45D] px-5 py-3.5 text-sm font-semibold text-[#080807] transition hover:bg-[#d8b66f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-cream/30">
          SiloCamp · Camp International Silo 2026
        </p>
      </div>
    </div>
  );
}