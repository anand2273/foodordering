export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="py-16 text-center text-slate-600" role="status">
      {label}
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
      role="alert"
    >
      {message}
    </div>
  );
}
