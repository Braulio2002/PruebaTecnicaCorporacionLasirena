import { PrismaClient, EstadoPelicula, EstadoTurno, IdiomaType, FormatoType, Turno } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.turno.deleteMany();
  await prisma.pelicula.deleteMany();
  console.log('🗑️  Datos existentes eliminados');

  // Crear películas de ejemplo
  const peliculas = await Promise.all([
    prisma.pelicula.create({
      data: {
        titulo: 'Avatar: El Camino del Agua',
        sinopsis: 'Jake Sully vive con su nueva familia formada en el planeta de Pandora. Una vez que una amenaza familiar regresa para terminar lo que se empezó anteriormente, Jake debe trabajar con Neytiri y el ejército de la raza Navi para proteger su planeta.',
        duracionMin: 192,
        clasificacion: 'PG-13',
        generos: ['Acción', 'Aventura', 'Ciencia Ficción'],
        estado: EstadoPelicula.ACTIVO,
        fechaEstreno: new Date('2022-12-16'),
        imagen: 'https://image.tmdb.org/t/p/w500/avatar2.jpg',
        creadoPor: 'admin'
      }
    }),
    prisma.pelicula.create({
      data: {
        titulo: 'Top Gun: Maverick',
        sinopsis: 'Después de más de 30 años de servicio como uno de los mejores aviadores de la Armada, Pete "Maverick" Mitchell está donde pertenece, empujando los límites como un valiente piloto de prueba.',
        duracionMin: 131,
        clasificacion: 'PG-13',
        generos: ['Acción', 'Drama'],
        estado: EstadoPelicula.ACTIVO,
        fechaEstreno: new Date('2022-05-27'),
        imagen: 'https://image.tmdb.org/t/p/w500/topgun.jpg',
        creadoPor: 'admin'
      }
    }),
    prisma.pelicula.create({
      data: {
        titulo: 'Spider-Man: No Way Home',
        sinopsis: 'Peter Parker es desenmascarado y ya no puede separar su vida normal de los enormes riesgos de ser un superhéroe. Cuando pide ayuda al Doctor Strange, los riesgos se vuelven aún más peligrosos.',
        duracionMin: 148,
        clasificacion: 'PG-13',
        generos: ['Acción', 'Aventura', 'Ciencia Ficción'],
        estado: EstadoPelicula.ACTIVO,
        fechaEstreno: new Date('2021-12-17'),
        imagen: 'https://image.tmdb.org/t/p/w500/spiderman.jpg',
        creadoPor: 'admin'
      }
    }),
    prisma.pelicula.create({
      data: {
        titulo: 'The Batman',
        sinopsis: 'En su segundo año luchando contra el crimen, Batman descubre la corrupción en Gotham City que se conecta con su propia familia mientras se enfrenta a un asesino conocido como el Acertijo.',
        duracionMin: 176,
        clasificacion: 'PG-13',
        generos: ['Acción', 'Crimen', 'Drama'],
        estado: EstadoPelicula.ACTIVO,
        fechaEstreno: new Date('2022-03-04'),
        imagen: 'https://image.tmdb.org/t/p/w500/batman.jpg',
        creadoPor: 'admin'
      }
    }),
    prisma.pelicula.create({
      data: {
        titulo: 'Dune',
        sinopsis: 'Paul Atreides, un joven brillante y talentoso nacido con un gran destino más allá de su comprensión, debe viajar al planeta más peligroso del universo para asegurar el futuro de su familia y su pueblo.',
        duracionMin: 155,
        clasificacion: 'PG-13',
        generos: ['Acción', 'Aventura', 'Drama', 'Ciencia Ficción'],
        estado: EstadoPelicula.ACTIVO,
        fechaEstreno: new Date('2021-10-22'),
        imagen: 'https://image.tmdb.org/t/p/w500/dune.jpg',
        creadoPor: 'admin'
      }
    })
  ]);

  console.log(`✅ ${peliculas.length} películas creadas`);

  // Crear turnos de ejemplo para cada película
  const hoy = new Date();
  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1);
  const pasadoMañana = new Date(hoy);
  pasadoMañana.setDate(hoy.getDate() + 2);

  const salas = ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Sala 5'];
  const horarios = [
    { hora: 14, minuto: 0 },
    { hora: 16, minuto: 30 },
    { hora: 19, minuto: 0 },
    { hora: 21, minuto: 30 }
  ];
  const idiomas = [IdiomaType.DOBLADO, IdiomaType.SUBTITULADO];
  const formatos = [FormatoType.DOS_D, FormatoType.TRES_D, FormatoType.IMAX];
  const precios = [8.50, 10.00, 12.50, 15.00];
  const aforos = [100, 150, 200, 250, 300];

  const turnos: Turno[] = [];

  for (const pelicula of peliculas) {
    // Crear turnos para hoy, mañana y pasado mañana
    const fechas = [hoy, mañana, pasadoMañana];
    
    for (const fecha of fechas) {
      // 2-3 turnos por día por película
      const numTurnos = Math.floor(Math.random() * 2) + 2;
      const horariosSeleccionados = horarios.slice(0, numTurnos);
      
      for (let i = 0; i < horariosSeleccionados.length; i++) {
        const horario = horariosSeleccionados[i];
        const sala = salas[i % salas.length];
        
        const inicio = new Date(fecha);
        inicio.setHours(horario.hora, horario.minuto, 0, 0);
        
        const fin = new Date(inicio);
        fin.setMinutes(fin.getMinutes() + pelicula.duracionMin + 15); // +15 min para limpieza
        
        const turno = await prisma.turno.create({
          data: {
            peliculaId: pelicula.id,
            sala: sala,
            inicio: inicio,
            fin: fin,
            precio: precios[Math.floor(Math.random() * precios.length)],
            idioma: idiomas[Math.floor(Math.random() * idiomas.length)],
            formato: formatos[Math.floor(Math.random() * formatos.length)],
            aforo: aforos[Math.floor(Math.random() * aforos.length)],
            estado: EstadoTurno.ACTIVO,
            creadoPor: 'admin'
          }
        });
        
        turnos.push(turno);
      }
    }
  }

  console.log(`✅ ${turnos.length} turnos creados`);
  console.log('🎉 Seed completado exitosamente!');
  
  // Mostrar resumen
  console.log('\n📊 Resumen de datos creados:');
  for (const pelicula of peliculas) {
    const turnosPelicula = turnos.filter(t => t.peliculaId === pelicula.id);
    console.log(`  - ${pelicula.titulo}: ${turnosPelicula.length} turnos`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });