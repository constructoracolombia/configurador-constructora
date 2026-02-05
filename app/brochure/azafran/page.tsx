import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Azafrán | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Azafrán. Planes desde $14.900.000',
};

export default function AzafranBrochurePage() {
  const proyecto = {
    slug: 'azafran',
    nombre: 'Azafrán',
    ubicacion: 'Bucaramanga',
    descripcion: 'Tu nuevo hogar comienza aquí. Acabados premium para tu apartamento VIS en Azafrán.',
    imagenPrincipal: '/proyectos/azafran.jpg.jpeg',
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
        texto: 'Cumplieron con todo lo prometido. El apartamento quedó hermoso y la entrega fue puntual.',
        autor: 'Roberto Vargas',
        imagen: undefined
      }
    ],
    caracteristicas: []
  };

  return <BrochureLayout proyecto={proyecto} />;
}
