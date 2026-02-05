import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Montebello | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Montebello. Planes desde $14.900.000',
};

export default function MontebelloBrochurePage() {
  const proyecto = {
    slug: 'montebello',
    nombre: 'Montebello',
    ubicacion: 'Bucaramanga',
    descripcion: 'Dale a tu apartamento VIS en Montebello el upgrade que merece. Cotiza ahora.',
    imagenPrincipal: '/proyectos/montebello.jpg.jpeg',
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
        texto: 'Increíble transformación. Los vecinos no pueden creer que sea el mismo apartamento.',
        autor: 'Fernando Castro',
        imagen: undefined
      }
    ],
    caracteristicas: []
  };

  return <BrochureLayout proyecto={proyecto} />;
}
