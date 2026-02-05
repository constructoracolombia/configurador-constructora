'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Testimonio {
  texto: string;
  autor: string;
  imagen: string;
}

interface BrochureProps {
  proyecto: {
    slug: string;
    nombre: string;
    imagenPrincipal: string;
    ubicacion: string;
    descripcion: string;
    precio: {
      basico: string;
      intermedio: string;
    };
    diasEntrega: {
      basico: string;
      intermedio: string;
    };
    testimonios: Testimonio[];
  };
}

export default function BrochureLayout({ proyecto }: BrochureProps) {
  const router = useRouter();

  const handleCTA = () => {
    localStorage.setItem('proyecto-seleccionado', proyecto.slug);
    router.push('/plan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-[620px] mx-auto px-4 py-8 md:max-w-[920px] lg:max-w-[1100px]">
        
        {/* HERO */}
        <section className="text-center py-10 md:py-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,215,0,0.15),transparent)] pointer-events-none -z-10" />
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
            Transformamos tu apartamento <span className="text-[#FFD700]">VIS</span> en tu hogar ideal
          </h1>
          
          <div className="relative w-full h-[280px] md:h-[360px] lg:h-[400px] my-8 rounded-[20px] overflow-hidden border-[3px] border-yellow-500/30 shadow-2xl hover:border-yellow-500/60 hover:scale-[1.01] transition-all duration-300">
            <Image 
              src={proyecto.imagenPrincipal}
              alt={`Conjunto ${proyecto.nombre}`}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          <div className="inline-block bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 text-[#FFD700] px-6 py-3 rounded-full text-base font-bold border-[1.5px] border-yellow-500/40 shadow-lg mb-6">
            📍 {proyecto.nombre.toUpperCase()} - {proyecto.ubicacion}
          </div>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-[540px] mx-auto mb-8 leading-relaxed">
            {proyecto.descripcion}
          </p>

          {/* CTA PRINCIPAL */}
          <button
            onClick={handleCTA}
            className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-black bg-gradient-to-r from-[#FFD700] to-[#FFC700] rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
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
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-[#FFD700] to-transparent rounded" />
            La transformación es real
          </h2>
          
          <div className="relative w-full h-[300px] md:h-[400px] rounded-[20px] overflow-hidden border-[3px] border-yellow-500/30 shadow-2xl hover:border-yellow-500/60 hover:scale-[1.02] transition-all duration-300">
            <Image 
              src="/brochure/2. Transformacion.png"
              alt="Transformación antes y después"
              fill
              className="object-contain bg-white"
            />
          </div>
        </section>

        {/* PLANES */}
        <section className="my-16">
          <h2 className="text-3xl md:text-4xl font-black mb-8 relative pl-4">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-[#FFD700] to-transparent rounded" />
            Planes disponibles
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Plan Básico */}
            <div className="bg-gradient-to-br from-[#0d0d0d] to-[#111] rounded-[20px] p-8 border-[1.5px] border-white/10 hover:border-yellow-500/30 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(255,215,0,0.1),transparent)] pointer-events-none" />
              
              <h3 className="text-2xl font-black mb-2">Plan Básico Esencial</h3>
              <div className="text-4xl font-black text-[#FFD700] my-4">{proyecto.precio.basico}</div>
              <div className="text-sm text-gray-400 italic mb-6">Entrega: {proyecto.diasEntrega.basico}</div>
              
              <ul className="space-y-3">
                {['Estuco + pintura 3 manos', 'Enchape cerámica', 'Baños completos', 'Nichos iluminados', 'Luminarias LED'].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-[#FFD700] font-black text-lg">✓</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Plan Intermedio */}
            <div className="bg-gradient-to-br from-[#0d0d0d] to-[#111] rounded-[20px] p-8 border-[1.5px] border-white/10 hover:border-yellow-500/30 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(255,215,0,0.1),transparent)] pointer-events-none" />
              
              <div className="absolute top-4 right-4 bg-[#FFD700] text-black text-xs font-bold px-3 py-1 rounded-full">
                MÁS POPULAR
              </div>
              
              <h3 className="text-2xl font-black mb-2">Plan Intermedio Plus</h3>
              <div className="text-4xl font-black text-[#FFD700] my-4">{proyecto.precio.intermedio}</div>
              <div className="text-sm text-gray-400 italic mb-6">Entrega: {proyecto.diasEntrega.intermedio}</div>
              
              <ul className="space-y-3">
                {['Todo el Básico', 'Enchapes premium', 'Mueble cocina + Closets', 'Mesón y barra granito', 'Divisiones vidrio'].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-[#FFD700] font-black text-lg">✓</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bonos */}
          <div className="bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 rounded-[20px] p-8 border-2 border-yellow-500/50 shadow-2xl relative">
            <h3 className="text-2xl font-black text-[#FFD700] mb-6">🎁 Bonus incluidos en ambos planes</h3>
            <ul className="grid md:grid-cols-2 gap-3">
              {['Asesoría arquitectónica completa', 'Recorrido virtual 360°', 'Supervisión profesional', 'Avances semanales WhatsApp', 'Garantía 6 meses', 'Cero sobrecostos'].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-[#FFD700] font-black text-lg">✓</span>
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
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-[#FFD700] to-transparent rounded" />
              Clientes felices
            </h2>

            <div className="space-y-8">
              {proyecto.testimonios.map((testimonio, idx) => (
                <div key={idx}>
                  <div className="relative w-full h-[340px] md:h-[380px] mb-4 rounded-[20px] overflow-hidden border-2 border-yellow-500/20 shadow-xl hover:border-yellow-500/50 hover:scale-[1.02] transition-all duration-300">
                    <Image 
                      src={testimonio.imagen}
                      alt={`Cliente ${testimonio.autor}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 p-5 border-l-4 border-[#FFD700] rounded-xl shadow-lg relative">
                    <div className="absolute -top-2 left-3 text-6xl text-yellow-500/20 font-serif leading-none">&ldquo;</div>
                    <p className="text-gray-200 italic leading-relaxed relative z-10 pl-6">{testimonio.texto}</p>
                    <p className="text-gray-400 text-sm mt-3 font-semibold pl-6">— {testimonio.autor}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA FINAL */}
        <section className="my-16 bg-gradient-to-r from-yellow-500/10 to-transparent p-10 md:p-16 rounded-[20px] border-2 border-yellow-500/20 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            ¿Listo para transformar tu VIS en {proyecto.nombre}?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-[600px] mx-auto">
            Personaliza tu presupuesto, elige los acabados que quieras y recibe tu cotización al instante.
          </p>
          
          <button
            onClick={handleCTA}
            className="group relative inline-flex items-center justify-center px-16 py-6 text-xl font-black text-black bg-gradient-to-r from-[#FFD700] to-[#FFC700] rounded-2xl shadow-2xl hover:shadow-yellow-500/50 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
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
        <footer className="text-center py-8 text-gray-500 text-sm border-t border-white/5">
          © 2025 ConstructoraColombia · Remodelaciones VIS · {proyecto.nombre}
        </footer>
      </div>
    </div>
  );
}
