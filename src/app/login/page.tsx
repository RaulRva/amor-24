import { Card } from "@/components/ui";
import { ThemeReset } from "@/components/theme-reset";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <ThemeReset />
      <p className="text-[11px] tracking-[0.32em] text-ink-soft uppercase">solo para vosotros</p>
      <h1 className="mt-3 font-serif text-6xl leading-none">24</h1>
      <p className="mt-4 mb-8 max-w-sm text-ink-soft">
        Un rincón compartido: mapa, recuerdos, ahorros y lo que os recuerda el uno al otro.
      </p>
      <Card>
        <LoginForm />
      </Card>
    </div>
  );
}
