import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Morada del Viento | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Morada del Viento. Planes desde $14.900.000',
};

export default function MoradaDelVientoBrochurePage() {
  const proyecto = {
    slug: 'morada-del-viento',
    nombre: 'Morada del Viento',
    ubicacion: 'Bucaramanga',
    descripcion: 'Haz realidad el hogar que siempre soñaste. Remodelación completa para tu VIS.',
    imagenPrincipal: '/proyectos/morada-del-viento.jpg.jpeg',
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
        texto: 'Excelente calidad en los acabados. Muy recomendados para cualquier proyecto.',
        autor: 'Diana Ramírez',
        imagen: undefined
      }
    ],
    caracteristicas: []
  };

  return <BrochureLayout proyecto={proyecto} />;
}
