import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publicar trabajo",
  description:
    "Publicá tu trabajo gratis en Oficiando. Elegí la categoría, describí qué necesitás y recibí postulaciones en minutos.",
};

export default function PublicarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
