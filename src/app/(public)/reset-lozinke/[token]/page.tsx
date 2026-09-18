import { getUserByResetToken } from "@/lib/queries/password-reset";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetLozinkePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getUserByResetToken(token);

  if (!user) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Link je nevažeći</h1>
        <p className="text-neutral-600">
          Ovaj link za resetovanje lozinke je nevažeći ili je istekao.
          Zatražite novi na stranici za prijavu.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova lozinka</h1>
        <p className="mt-1 text-sm text-neutral-600">Nalog: {user.email}</p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
