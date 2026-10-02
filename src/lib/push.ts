import webpush from "web-push";
import {
  listPushSubscriptionsForUser,
  deletePushSubscriptionById,
} from "./queries/push";

// Faza 21: slanje Web Push notifikacija klijentima (nova ponuda, promena
// statusa porudžbine) direktno preko Push API-ja iz browsera — VAPID
// protokol, bez spoljne usluge ili dodatnog naloga. Isti obrazac graceful
// degradacije kao Mapbox token i Google OAuth: ako ključevi nisu podešeni,
// `sendPushToUser` se tiho ne izvršava, nikad ne ruši akciju koja ga zove.

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:info@ruta-dostava.rs",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Putanja (relativna) na koju treba prebaciti korisnika klikom na notifikaciju. */
  url?: string;
}

/**
 * Šalje push notifikaciju na SVE aktivne pretplate datog korisnika
 * (više uređaja/browsera). Pretplate koje push servis prijavi kao
 * nevažeće (404/410 — korisnik je ugasio notifikacije ili obrisao
 * browser podatke) se automatski brišu iz baze.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!pushConfigured()) return;
  ensureConfigured();

  const subscriptions = await listPushSubscriptionsForUser(userId);
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number } | undefined)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscriptionById(sub.id);
        } else {
          // Namerno ne bacamo grešku dalje — slanje push notifikacije
          // nikad ne sme da sruši akciju (prihvatanje ponude, promenu
          // statusa...) koja ga poziva.
          console.error("Push notifikacija nije uspela:", err);
        }
      }
    })
  );
}
