import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 pt-20 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">🔍</span>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-primary">Página no encontrada</h1>
          <p className="text-sm text-secondary max-w-xs leading-relaxed">
            La página que buscás no existe o fue movida.
          </p>
        </div>
        <Link
          href="/"
          className="mt-2 text-sm font-semibold text-brand"
        >
          ← Volver al inicio
        </Link>
      </main>
      <BottomNav />
    </>
  );
}
