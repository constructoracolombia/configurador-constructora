import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Parque Oriente | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Parque Oriente. Planes desde $14.900.000',
};

export default function ParqueOrienteBrochurePage() {
  const proyecto = {
    slug: 'parque-oriente',
    nombre: 'Parque Oriente',
    ubicacion: 'Floridablanca',
    descripcion: 'Transformamos tu VIS en Floridablanca con los mejores acabados del mercado.',
    imagenPrincipal: '/proyectos/parque-oriente.jpg.jpeg',
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
        texto: 'La mejor decisión que tomamos. El apartamento quedó espectacular y el equipo muy profesional.',
        autor: 'Patricia Duarte',
        imagen: undefined
      }
    ],
    caracteristicas: []
  };

  return <BrochureLayout proyecto={proyecto} />;
}
