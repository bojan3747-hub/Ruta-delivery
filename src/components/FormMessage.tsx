export function FormMessage({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
      {error}
    </p>
  );
}
