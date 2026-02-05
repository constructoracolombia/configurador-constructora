import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Beltramonto | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Beltramonto. Planes desde $14.900.000',
};

export default function BeltramontoBrochurePage() {
  const proyecto = {
    slug: 'beltramonto',
    nombre: 'Beltramonto',
    ubicacion: 'Bucaramanga',
    descripcion: 'Tu apartamento VIS transformado con los mejores acabados. Cotiza en minutos, sin compromiso.',
    imagenPrincipal: '/proyectos/beltramonto.jpg.jpeg',
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
        texto: 'El proceso fue muy sencillo y transparente. Desde la cotización hasta la entrega, todo fue profesional.',
        autor: 'Carlos Mendoza',
        imagen: undefined
      },
      {
        texto: 'Quedamos encantados con los acabados. La calidad es impresionante para el precio.',
        autor: 'María Fernanda Ruiz',
        imagen: undefined
      }
    ],
    caracteristicas: []
  };

  return <BrochureLayout proyecto={proyecto} />;
}
