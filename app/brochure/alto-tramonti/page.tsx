import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Alto Tramonti | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Alto Tramonti. Planes desde $14.900.000',
};

export default function AltoTramontiBrochurePage() {
  const proyecto = {
    slug: 'alto-tramonti',
    nombre: 'Alto Tramonti',
    ubicacion: 'Bucaramanga',
    descripcion: 'Remodelación profesional para tu VIS en Alto Tramonti. Acabados de lujo a tu alcance.',
    imagenPrincipal: '/proyectos/alto-tramonti.jpg.jpeg',
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
        texto: 'Profesionalismo de principio a fin. El resultado superó nuestras expectativas.',
        autor: 'Claudia Pinzón',
        imagen: undefined
      }
    ],
    caracteristicas: []
  };

  return <BrochureLayout proyecto={proyecto} />;
}
