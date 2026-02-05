import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Ciudadela Verde | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Ciudadela Verde. Planes desde $14.900.000',
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

export default function CiudadelaVerdePage() {
  const proyecto = {
    slug: 'ciudadela-verde',
    nombre: 'Ciudadela Verde',
    imagenPrincipal: '/brochure/1. CV.jpeg',
    ubicacion: 'Floridablanca',
    descripcion: 'Descarga los planes, personaliza lo que quieras y habla con nosotros. Rápido, confiable y sin sobrecostos.',
    precio: {
      basico: '$14.900.000',
      intermedio: '$29.900.000'
    },
    diasEntrega: {
      basico: '35-39 días hábiles',
      intermedio: '59-69 días hábiles'
    },
    testimonios: TESTIMONIOS
  };

  return <BrochureLayout proyecto={proyecto} />;
}
