import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Fiore | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Fiore. Planes desde $14.900.000',
};

export default function FioreBrochurePage() {
  const proyecto = {
    slug: 'fiore',
    nombre: 'Fiore',
    ubicacion: 'Bucaramanga',
    descripcion: 'Remodelamos tu apartamento VIS con acabados de alta calidad. Presupuesto claro, sin sorpresas.',
    imagenPrincipal: '/proyectos/fiore.jpg.png',
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
        texto: 'Excelente servicio y acabados de primera. Muy contentos con el resultado final.',
        autor: 'Andrea Gómez',
        imagen: undefined
      }
    ],
    caracteristicas: []
  };

  return <BrochureLayout proyecto={proyecto} />;
}
