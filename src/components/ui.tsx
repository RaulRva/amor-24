export function PageHeader({
  kicker,
  title,
  copy,
}: {
  kicker: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-[10px] tracking-[0.26em] text-rose uppercase">{kicker}</p>
      <h2 className="mt-1 font-serif text-[1.85rem] leading-tight">{title}</h2>
      {copy ? <p className="mt-2 text-[0.95rem] text-ink-soft">{copy}</p> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
  tone = "light",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
  padded?: boolean;
}) {
  return (
    <div
      className={`card ${tone === "dark" ? "card-dark" : ""} ${padded ? "" : "card-flush"} ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[var(--line)] bg-paper px-4 py-3.5 text-base text-ink outline-none ring-rose/30 focus:ring-2";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-24 ${props.className ?? ""}`} />;
}

export function Button({
  children,
  tone = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "ghost" | "rose" }) {
  const tones = {
    primary: "bg-ink text-paper hover:bg-rose-deep",
    ghost: "bg-transparent text-ink hover:bg-paper-2",
    rose: "bg-rose text-paper hover:bg-rose-deep",
  };
  return (
    <button
      {...props}
      className={`min-h-11 w-full rounded-full px-5 py-3 text-sm tracking-wide transition disabled:opacity-50 ${tones[tone]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <p className="text-center text-ink-soft">{children}</p>
    </Card>
  );
}
