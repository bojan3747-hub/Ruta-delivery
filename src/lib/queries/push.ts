import { pool } from "../db";

// Faza 21: CRUD za Web Push pretplate. Jedan korisnik može imati više
// pretplata (telefon + laptop, na primer) — zato se čuva lista po
// `user_id`, a jedinstvenost je na `endpoint` (jedan browser-profil =
// jedan endpoint kod push servisa, tipično Google-ov FCM za Chrome).

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string }
): Promise<void> {
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint)
     DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
    [userId, sub.endpoint, sub.p256dh, sub.auth]
  );
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
}

export async function listPushSubscriptionsForUser(
  userId: string
): Promise<PushSubscriptionRow[]> {
  const result = await pool.query<PushSubscriptionRow>(
    "SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1",
    [userId]
  );
  return result.rows;
}

export async function deletePushSubscriptionById(id: string): Promise<void> {
  await pool.query("DELETE FROM push_subscriptions WHERE id = $1", [id]);
}
