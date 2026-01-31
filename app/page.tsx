"use client";

import { useRouter } from "next/navigation";
import { proyectos } from "@/lib/data/catalogo";
import { useCotizador } from "@/lib/store/cotizador";
import { ImagenOptimizada } from "@/components/ImagenOptimizada";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const setProyecto = useCotizador((state) => state.setProyecto);

  const handleCotizar = (proyecto: (typeof proyectos)[number]) => {
    setProyecto(proyecto.id);
    router.push(`/plan?proyecto=${encodeURIComponent(proyecto.id)}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-brand-primary px-4 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Cotiza tu Remodelación en 3 Minutos
          </h1>
          <p className="mt-4 text-lg text-white/90 md:text-xl">
            Elige tu proyecto y personaliza tu apartamento VIS
          </p>
        </div>
      </section>

      {/* Proyectos Grid */}
      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {proyectos.map((proyecto) => (
                <Card key={proyecto.id} className="overflow-hidden">
                  <ImagenOptimizada
                    src={proyecto.imagen}
                    alt={proyecto.nombre}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">{proyecto.nombre}</CardTitle>
                    <p className="text-sm text-gray-600">{proyecto.ubicacion}</p>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                      onClick={() => handleCotizar(proyecto)}
                    >
                      Cotizar mi apartamento
                    </Button>
                  </CardFooter>
                </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
