'use client';

import { useRouter } from 'next/navigation';
import { ImagenOptimizada } from '@/components/ImagenOptimizada';

interface BrochureProps {
  proyecto: {
    slug: string;
    nombre: string;
    ubicacion: string;
    descripcion: string;
    imagenPrincipal: string;
    imagenAntesDepues: string;
    precio: {
      basico: string;
      intermedio: string;
    };
    diasEntrega: {
      basico: string;
      intermedio: string;
    };
    testimonios: Array<{
      texto: string;
      autor: string;
      imagen?: string;
    }>;
    caracteristicas: string[];
  };
}

export default function BrochureLayout({ proyecto }: BrochureProps) {
  const router = useRouter();

  const handleCTA = () => {
    // Guardar proyecto en localStorage para pre-selección
    localStorage.setItem('proyecto-seleccionado', proyecto.slug);
    // Redirigir a página de planes
    router.push('/plan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-brand-dark to-black text-white">
      <div className="max-w-[620px] mx-auto px-4 py-8 md:max-w-[920px] lg:max-w-[1100px]">
        
        {/* HERO SECTION */}
        <section className="text-center py-10 md:py-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,184,0,0.15),transparent)] pointer-events-none -z-10" />
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
            Transformamos tu apartamento <span className="text-brand-primary">VIS</span> en tu hogar ideal
          </h1>
          
          <div className="w-full h-[280px] md:h-[360px] lg:h-[400px] rounded-[20px] my-8 border-[3px] border-brand-primary/30 shadow-2xl hover:border-brand-primary/60 hover:scale-[1.01] transition-all duration-300 overflow-hidden">
            <ImagenOptimizada
              src={proyecto.imagenPrincipal}
              alt={`Conjunto ${proyecto.nombre}`}
              width={1100}
              height={400}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="inline-block bg-gradient-to-r from-brand-primary/20 to-brand-primary/10 text-brand-primary px-6 py-3 rounded-full text-base font-bold border-[1.5px] border-brand-primary/40 shadow-lg mb-6">
            📍 {proyecto.nombre.toUpperCase()} - {proyecto.ubicacion}
          </div>
          
          <p className="text-lg md:text-xl text-brand-textSecondary max-w-[540px] mx-auto mb-8 leading-relaxed">
            {proyecto.descripcion}
          </p>

          {/* CTA PRINCIPAL - ARRIBA */}
          <button
            onClick={handleCTA}
            className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-black bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative flex items-center gap-3">
              ⚡ Arma tu presupuesto en 2 minutos
            </span>
          </button>
        </section>

        {/* ANTES Y DESPUÉS */}
        <section className="my-16">
          <h2 className="text-3xl md:text-4xl font-black mb-8 relative pl-4">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-brand-primary to-transparent rounded" />
            La transformación es real
          </h2>
          
          <div className="rounded-[20px] overflow-hidden border-[3px] border-brand-primary/30 shadow-2xl hover:border-brand-primary/60 hover:scale-[1.02] transition-all duration-300">
            <ImagenOptimizada
              src={proyecto.imagenAntesDepues}
              alt="Transformación antes y después"
              width={1100}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </section>

        {/* PLANES */}
        <section className="my-16">
          <h2 className="text-3xl md:text-4xl font-black mb-8 relative pl-4">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-brand-primary to-transparent rounded" />
            Planes disponibles
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Plan Básico */}
            <div className="bg-gradient-to-br from-brand-card to-brand-dark rounded-[20px] p-8 border-[1.5px] border-brand-border hover:border-brand-primary/30 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(255,184,0,0.1),transparent)] pointer-events-none" />
              
              <h3 className="text-2xl font-black mb-2">Plan Básico Esencial</h3>
              <div className="text-4xl font-black text-brand-primary my-4">{proyecto.precio.basico}</div>
              <div className="text-sm text-brand-textSecondary italic mb-6">Entrega: {proyecto.diasEntrega.basico}</div>
              
              <ul className="space-y-3">
                {[
                  'Estuco con esquineros',
                  'Pintura 3 manos',
                  'Enchape en cerámica',
                  'Baños funcionales',
                  'Luminarias LED'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-brand-primary font-black text-lg">✓</span>
                    <span className="text-brand-textSecondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Plan Intermedio */}
            <div className="bg-gradient-to-br from-brand-card to-brand-dark rounded-[20px] p-8 border-[1.5px] border-brand-border hover:border-brand-primary/30 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(255,184,0,0.1),transparent)] pointer-events-none" />
              
              <div className="absolute top-4 right-4 bg-brand-primary text-black text-xs font-bold px-3 py-1 rounded-full">
                MÁS POPULAR
              </div>
              
              <h3 className="text-2xl font-black mb-2">Plan Intermedio Plus</h3>
              <div className="text-4xl font-black text-brand-primary my-4">{proyecto.precio.intermedio}</div>
              <div className="text-sm text-brand-textSecondary italic mb-6">Entrega: {proyecto.diasEntrega.intermedio}</div>
              
              <ul className="space-y-3">
                {[
                  'Todo el Básico',
                  'Enchapes premium',
                  'Mueble cocina + Closets',
                  'Mesón y barra granito',
                  'Divisiones vidrio'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-brand-primary font-black text-lg">✓</span>
                    <span className="text-brand-textSecondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bonos */}
          <div className="bg-gradient-to-br from-brand-primary/15 to-brand-primary/5 rounded-[20px] p-8 border-2 border-brand-primary/50 shadow-2xl relative">
            <h3 className="text-2xl font-black text-brand-primary mb-6">🎁 Bonus incluidos en ambos planes</h3>
            <ul className="grid md:grid-cols-2 gap-3">
              {[
                'Asesoría arquitectónica completa',
                'Recorrido virtual 360°',
                'Supervisión profesional',
                'Avances semanales WhatsApp',
                'Garantía 6 meses',
                'Cero sobrecostos'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-brand-primary font-black text-lg">✓</span>
                  <span className="text-white font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* TESTIMONIOS */}
        {proyecto.testimonios.length > 0 && (
          <section className="my-16">
            <h2 className="text-3xl md:text-4xl font-black mb-8 relative pl-4">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-brand-primary to-transparent rounded" />
              Clientes felices
            </h2>

            <div className="space-y-8">
              {proyecto.testimonios.map((testimonio, idx) => (
                <div key={idx}>
                  {testimonio.imagen && (
                    <div className="w-full h-[340px] md:h-[380px] rounded-[20px] mb-4 border-2 border-brand-primary/20 shadow-xl hover:border-brand-primary/50 hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                      <ImagenOptimizada
                        src={testimonio.imagen}
                        alt={`Cliente ${testimonio.autor}`}
                        width={1100}
                        height={380}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 p-5 border-l-4 border-brand-primary rounded-xl shadow-lg relative">
                    <div className="absolute -top-2 left-3 text-6xl text-brand-primary/20 font-serif">&ldquo;</div>
                    <p className="text-brand-textSecondary italic leading-relaxed relative z-10">{testimonio.texto}</p>
                    <p className="text-brand-textSecondary/70 text-sm mt-3 font-semibold">— {testimonio.autor}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA FINAL */}
        <section className="my-16 bg-gradient-to-r from-brand-primary/10 to-transparent p-10 md:p-16 rounded-[20px] border-2 border-brand-primary/20 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            ¿Listo para transformar tu VIS en {proyecto.nombre}?
          </h2>
          <p className="text-brand-textSecondary text-lg mb-8 max-w-[600px] mx-auto">
            Personaliza tu presupuesto, elige los acabados que quieras y recibe tu cotización al instante.
          </p>
          
          <button
            onClick={handleCTA}
            className="group relative inline-flex items-center justify-center px-16 py-6 text-xl font-black text-black bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl shadow-2xl hover:shadow-brand-primary/50 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative flex items-center gap-3">
              🚀 Arma tu presupuesto ahora
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-brand-textSecondary text-sm border-t border-brand-border">
          © 2025 Constructora Colombia · Remodelaciones VIS · {proyecto.nombre}
        </footer>
      </div>
    </div>
  );
}
