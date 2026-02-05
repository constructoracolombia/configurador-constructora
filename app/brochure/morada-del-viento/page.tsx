import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Morada del Viento | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Morada del Viento. Planes desde $14.900.000',
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

export default function MoradaDelVientoBrochurePage() {
  const proyecto = {
    slug: 'morada-del-viento',
    nombre: 'Morada del Viento',
    imagenPrincipal: '/brochure/1. Morada-viento.jpeg',
    ubicacion: 'Bucaramanga',
    descripcion: 'Haz realidad el hogar que siempre soñaste. Remodelación completa para tu VIS.',
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
