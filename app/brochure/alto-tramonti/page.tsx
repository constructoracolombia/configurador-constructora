import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Alto Tramonti | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Alto Tramonti. Planes desde $14.900.000',
};

const TESTIMONIOS = [
  {
    texto: 'La cocina quedó increíble, mejor de lo que imaginamos. El equipo fue muy profesional y cumplieron cada detalle.',
    autor: 'Alejandro Díaz',
    imagen: '/brochure/3. Testimonio-Alejo.jpeg'
  },
  {
    texto: 'Transformaron nuestro apartamento VIS en el hogar de nuestros sueños. La asesoría arquitectónica fue clave para elegir los acabados perfectos.',
    autor: 'Liliana Sánchez',
    imagen: '/brochure/4. Testimonio-Liliana.jpeg'
  },
  {
    texto: 'El día de la entrega fue emocionante. Todo quedó impecable y respetaron el presupuesto acordado. ¡Muy recomendados!',
    autor: 'Sra. Dioselina',
    imagen: '/brochure/5. Testimonio-Dioselina.jpeg'
  }
];

export default function AltoTramontiBrochurePage() {
  const proyecto = {
    slug: 'alto-tramonti',
    nombre: 'Alto Tramonti',
    imagenPrincipal: '/brochure/1. Alto-tramonti.jpeg',
    ubicacion: 'Bucaramanga',
    descripcion: 'Remodelación profesional para tu VIS en Alto Tramonti. Acabados de lujo a tu alcance.',
    precio: {
      basico: '$14.900.000',
      intermedio: '$30.900.000'
    },
    diasEntrega: {
      basico: '35-39 días hábiles',
      intermedio: '59-69 días hábiles'
    },
    testimonios: TESTIMONIOS
  };

  return <BrochureLayout proyecto={proyecto} />;
}
