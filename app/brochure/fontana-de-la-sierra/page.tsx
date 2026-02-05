import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Fontana de la Sierra | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Fontana de la Sierra. Planes desde $14.900.000',
};

export default function FontanaDeLaSierraBrochurePage() {
  const proyecto = {
    slug: 'fontana-de-la-sierra',
    nombre: 'Fontana de la Sierra',
    ubicacion: 'Bucaramanga',
    descripcion: 'Tu apartamento VIS merece lo mejor. Remodelación con garantía y sin sobrecostos.',
    imagenPrincipal: '/proyectos/fontana-de-la-sierra.jpg.jpeg',
    imagenAntesDepues: 'https://i.imgur.com/h9oMXjD.png',
    precio: {
      basico: '$14.900.000',
      intermedio: '$30.900.000'
    },
    diasEntrega: {
      basico: '35-39 días hábiles',
      intermedio: '59-69 días hábiles'
    },
    testimonios: [
      {
        texto: 'Todo el proceso fue transparente y el resultado final es increíble. Muy satisfechos.',
        autor: 'Jorge Niño',
        imagen: undefined
      }
    ],
    caracteristicas: []
  };

  return <BrochureLayout proyecto={proyecto} />;
}
