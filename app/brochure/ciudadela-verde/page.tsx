import BrochureLayout from '@/components/BrochureLayout';

export const metadata = {
  title: 'Remodelación VIS Ciudadela Verde | Constructora Colombia',
  description: 'Transforma tu apartamento VIS en Ciudadela Verde. Planes desde $14.900.000',
};

export default function CiudadelaVerdePage() {
  const proyecto = {
    slug: 'ciudadela-verde',
    nombre: 'Ciudadela Verde',
    ubicacion: 'Bucaramanga',
    descripcion: 'Descarga los planes, personaliza lo que quieras y habla con nosotros. Rápido, confiable y sin sobrecostos.',
    imagenPrincipal: 'https://i.imgur.com/T76ebsG.jpeg',
    imagenAntesDepues: 'https://i.imgur.com/h9oMXjD.png',
    precio: {
      basico: '$14.900.000',
      intermedio: '$29.900.000'
    },
    diasEntrega: {
      basico: '35-39 días hábiles',
      intermedio: '59-69 días hábiles'
    },
    testimonios: [
      {
        texto: 'La cocina quedó increíble, mejor de lo que imaginamos. El equipo fue muy profesional y cumplieron cada detalle.',
        autor: 'Alejandro Díaz',
        imagen: 'https://i.imgur.com/hajUIM1.jpeg'
      },
      {
        texto: 'Transformaron nuestro apartamento VIS en el hogar de nuestros sueños. La asesoría arquitectónica fue clave.',
        autor: 'Liliana Sánchez',
        imagen: 'https://i.imgur.com/85vQ1ge.jpeg'
      },
      {
        texto: 'El día de la entrega fue emocionante. Todo quedó impecable y respetaron el presupuesto acordado.',
        autor: 'Sra. Dioselina',
        imagen: 'https://i.imgur.com/OJFfuDC.jpeg'
      }
    ],
    caracteristicas: []
  };

  return <BrochureLayout proyecto={proyecto} />;
}
