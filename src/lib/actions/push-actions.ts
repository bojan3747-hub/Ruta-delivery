"use server";

import { getCurrentUser } from "../auth";
import {
  savePushSubscription,
  deletePushSubscriptionByEndpoint,
} from "../queries/push";

// Faza 21: akcije koje poziva PushNotificationToggle (klijentski komponent)
// posle uspešne pretplate/odjave preko browser Push API-ja. Namerno ne
// proveravamo ovde ulogu korisnika (CLIENT) — isti mehanizam će kasnije
// prirodno poslužiti i za dostavljače, bez izmene ovih akcija; za sada se
// samo klijentski dashboard poziva na njih (vidi /klijent/layout.tsx).

export async function subscribeToPushAction(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Morate biti prijavljeni." };
  }
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return { error: "Nevažeća pretplata." };
  }

  await savePushSubscription(user.id, {
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });
  return {};
}

export async function unsubscribeFromPushAction(endpoint: string): Promise<{ error?: string }> {
  if (!endpoint) return { error: "Nevažeća pretplata." };
  await deletePushSubscriptionByEndpoint(endpoint);
  return {};
}
