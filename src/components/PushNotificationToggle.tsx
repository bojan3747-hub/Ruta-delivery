"use client";

import { useEffect, useState } from "react";
import { subscribeToPushAction } from "@/lib/actions/push-actions";
// Napomena: unsubscribeFromPushAction (src/lib/actions/push-actions.ts)
// namerno nije pozvana odavde u ovoj fazi — nema još UI za isključivanje
// notifikacija (brisanje iz browsera samo gasi dostavu, ne i red u bazi).
// Ostaje spremna za kasniju stranicu podešavanja profila.

// Faza 21: banner koji nudi uključivanje push notifikacija (nova ponuda,
// promena statusa porudžbine) na klijentskom portalu. Prikazuje se samo kad
// ima smisla — browser podržava Push API, korisnik još nije ni dozvolio ni
// zabranio notifikacije, i nije ranije odbio baš ovaj banner (pamti se u
// localStorage, čisto kozmetička stvar po uređaju — ne utiče na samu
// pretplatu, koja uvek živi u bazi preko push_subscriptions tabele).
//
// NAPOMENA (namerno ograničenje ove faze): Web Push u ovom obliku pouzdano
// radi na Android/Chrome. Na iPhone-u (Safari) push radi SAMO ako je sajt
// dodat na početni ekran kao PWA — van toga 'serviceWorker'/'PushManager'
// provere ispod jednostavno neće proći, pa iOS Safari korisnici ovaj banner
// uopšte neće ni videti (nema greške, samo tiho ništa).

const DISMISS_KEY = "ruta_push_banner_dismissed";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type Status = "checking" | "hidden" | "offer" | "working" | "subscribed" | "denied";

export function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("hidden");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("hidden");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (cancelled) return;
        if (existing) {
          setStatus("subscribed");
          return;
        }
        const dismissed =
          typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1";
        setStatus(dismissed ? "hidden" : "offer");
      } catch {
        setStatus("hidden");
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    setStatus("working");
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // `as BufferSource`: TS-ov lib.dom tip za PushManager.subscribe
        // očekuje Uint8Array<ArrayBuffer> striktno, a Uint8Array.from vraća
        // širi Uint8Array<ArrayBufferLike> — u praksi je uvek pravi
        // ArrayBuffer (ne SharedArrayBuffer), ovo je samo TS tipovska
        // nesuglasica, ne stvarna neusklađenost u runtime-u.
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as BufferSource,
      });
      const json = subscription.toJSON();
      const result = await subscribeToPushAction({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });
      if (result.error) {
        setError(result.error);
        setStatus("offer");
        return;
      }
      setStatus("subscribed");
    } catch {
      setError("Uključivanje obaveštenja nije uspelo. Pokušajte ponovo.");
      setStatus("offer");
    }
  }

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage može biti nedostupan (privatni režim i sl.) — banner
      // će se tad samo ponovo pojaviti sledeći put, nije kritično.
    }
    setStatus("hidden");
  }

  if (status === "checking" || status === "hidden" || status === "subscribed") {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
      <div>
        <p className="font-medium text-emerald-900">
          {status === "denied"
            ? "Obaveštenja su blokirana u browseru"
            : "Uključite obaveštenja za nove ponude i status isporuke"}
        </p>
        <p className="mt-0.5 text-emerald-700">
          {status === "denied"
            ? "Da biste ih kasnije uključili, dozvolite notifikacije za ovaj sajt u podešavanjima browsera."
            : "Javićemo vam čim stigne ponuda ili se promeni status vaše pošiljke — bez potrebe da stalno proveravate aplikaciju."}
        </p>
        {error && <p className="mt-1 text-red-700">{error}</p>}
      </div>
      {status !== "denied" && (
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleEnable}
            disabled={status === "working"}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {status === "working" ? "Uključivanje..." : "Uključi"}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
          >
            Ne sada
          </button>
        </div>
      )}
    </div>
  );
}
