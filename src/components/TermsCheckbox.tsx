export function TermsCheckbox() {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name="uslovi" required className="mt-0.5 h-4 w-4" />
      <span>
        Prihvatam{" "}
        <a
          href="/opsti-uslovi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 underline hover:text-emerald-700"
        >
          Opšte uslove korišćenja
        </a>{" "}
        *
      </span>
    </label>
  );
}
