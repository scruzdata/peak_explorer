import { Route, RouteFeature, ImageData, GPXData, AffiliateLink } from '@/types'

// Features comunes
export const commonFeatures: RouteFeature[] = [
  { id: 'bridge', name: 'Puentes', icon: '🌉' },
  { id: 'tyrolina', name: 'Tirolinas', icon: '🪂' },
  { id: 'overhang', name: 'Desplomes', icon: '⛰️' },
  { id: 'cave', name: 'Cuevas', icon: '🕳️' },
  { id: 'waterfall', name: 'Cascadas', icon: '💧' },
  { id: 'viewpoint', name: 'Miradores', icon: '👁️' },
  { id: 'refuge', name: 'Refugios', icon: '🏠' },
  { id: 'lake', name: 'Lagos', icon: '🏞️' },
]

// Datos de ejemplo - 10 rutas de trekking
export const sampleTrekkingRoutes: Omit<Route, 'id' | 'slug' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'trekking',
    title: 'Ruta del Cares - Garganta Divina',
    summary: ' La ruta más emblemática de los Picos de Europa. Un sendero tallado en la roca que recorre la garganta del río Cares entre Caín y Poncebos.',
    difficulty: 'Moderada',
    distance: 24,
    elevation: 400,
    duration: '6-7 horas',
    approach: 'Parking en Poncebos (gratuito)',
    return: 'Mismo punto de inicio',
    features: [commonFeatures[4], commonFeatures[5], commonFeatures[0]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Bien señalizada con marcas blancas y amarillas. Seguir siempre el sendero principal.',
    status: 'Abierta',
    location: {
      region: 'Asturias',
      province: 'Asturias',
      coordinates: { lat: 43.2567, lng: -4.8500 },
    },
    routeType: 'Circular',
    dogs: 'Atados',
    parking: [
      { lat: 43.257185, lng: -4.832603 }, // Parking en Poncebos
    ],
    track: undefined, // Track cargado desde tracks.ts
    heroImage: {
      url: 'https://www.rutadelcares.es/wp-content/uploads/2021/01/ruta-del-cares-picos-de-europa-vivepicos-asturias-cantabria-18.jpg',
      alt: 'Garganta del Cares en Picos de Europa',
      width: 1200,
      height: 800,
    },
    gallery: [
      {
        url: 'https://cdn.pixabay.com/photo/2022/06/25/11/04/ruta-del-cares-7283299_1280.jpg',
        alt: 'Vista de la Garganta del Cares',
        width: 800,
        height: 600,
      },
      {
        url: 'https://www.rutadelcares.es/wp-content/uploads/2021/01/ruta-del-cares-picos-de-europa-vivepicos-asturias-cantabria-71.jpg',
        alt: 'Sendero del Cares',
        width: 800,
        height: 600,
      },
      {
        url: 'https://images.pexels.com/photos/13551541/pexels-photo-13551541.jpeg?_gl=1*3p9s4y*_ga*NDc3NTE3NDAuMTc2MzEzNjIxNw..*_ga_8JE65Q40S6*czE3NjMxMzYyMTckbzEkZzEkdDE3NjMxMzczMTAkajU2JGwwJGgw',
        alt: 'Paisaje de los Picos de Europa',
        width: 800,
        height: 600,
      },
      {
        url: 'https://www.rutadelcares.es/wp-content/uploads/2021/01/ruta-del-cares-picos-de-europa-vivepicos-asturias-cantabria-31-682x1024.jpg',
        alt: 'Vista de la Garganta del Cares',
        width: 800,
        height: 600,
      },
      {
        url: 'https://www.rutadelcares.es/wp-content/uploads/2021/01/ruta-del-cares-picos-de-europa-vivepicos-asturias-cantabria-32-768x512.jpg',
        alt: 'Sendero del Cares',
        width: 800,
        height: 600,
      },
      {
        url: 'https://www.rutadelcares.es/wp-content/uploads/2021/01/ruta-del-cares-picos-de-europa-vivepicos-asturias-cantabria-26-682x1024.jpg',
        alt: 'Paisaje de los Picos de Europa',
        width: 800,
        height: 600,
      },
      {
        url: 'https://www.rutadelcares.es/wp-content/uploads/2021/01/ruta-del-cares-picos-de-europa-vivepicos-asturias-cantabria-18.jpg',
        alt: 'Paisaje de los Picos de Europa',
        width: 800,
        height: 600,
      },
      {
        url: 'https://www.rutadelcares.es/wp-content/uploads/2021/01/ruta-del-cares-picos-de-europa-vivepicos-asturias-cantabria-70.jpg',
        alt: 'Paisaje de los Picos de Europa',
        width: 800,
        height: 600,
      },
    ],
    gpx: {
      url: '/gpx/ruta-cares.gpx',
      filename: 'ruta-cares.gpx',
      size: 245000,
    },
    equipment: [
      {
        type: 'equipment',
        title: 'Bastones de Trekking',
        url: 'https://example.com/afiliado/bastones',
        description: 'Recomendados para el descenso',
      },
    ],
    accommodations: [
      {
        type: 'accommodation',
        title: 'Hotel en Poncebos',
        url: 'https://example.com/afiliado/hotel-poncebos',
      },
    ],
    safetyTips: [
      'Llevar suficiente agua (mínimo 2L por persona)',
      'Protección solar obligatoria y/o gorra',
      'No acercarse al borde del sendero',
      'En caso de lluvia, el sendero puede ser resbaladizo',
      'Prohibido llevar perros y/o mascotas sueltos',
    ],
    storytelling: `# La Garganta Divina

La Ruta del Cares es sin duda una de las rutas de senderismo más espectaculares de España. Conocida como la "Garganta Divina", este sendero de 24 kilómetros recorre el corazón de los Picos de Europa, tallado directamente en la roca caliza.

El sendero comienza en Poncebos, un pequeño pueblo asturiano, y se adentra en un cañón de más de 200 metros de profundidad. A medida que avanzamos, el río Cares nos acompaña con su sonido constante, creando una experiencia sensorial única.

A lo largo del camino, cada curva revela nuevas perspectivas de las imponentes paredes rocosas. Los puentes colgantes añaden emoción a la ruta, mientras que los túneles excavados en la roca nos transportan a otro mundo.

Esta ruta no es solo un sendero, es una experiencia que conecta con la naturaleza en su estado más puro.`,
    seo: {
      metaTitle: 'Ruta del Cares - Garganta Divina | Peak Explorer',
      metaDescription: 'Descubre la ruta más emblemática de los Picos de Europa. 24km de sendero tallado en la roca con vistas espectaculares.',
      keywords: ['ruta del cares', 'picos de europa', 'trekking asturias', 'garganta divina'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'Circuito de los Tres Refugios - Sierra de Gredos',
    summary: 'Ruta circular que conecta tres refugios históricos en la Sierra de Gredos, pasando por lagunas glaciares y cumbres emblemáticas.',
    difficulty: 'Difícil',
    distance: 18,
    elevation: 1200,
    duration: '8-9 horas',
    approach: 'Parking en Plataforma de Gredos',
    return: 'Circular',
    features: [commonFeatures[6], commonFeatures[7], commonFeatures[5]],
    bestSeason: ['Verano', 'Otoño'],
    orientation: 'Ruta señalizada pero requiere experiencia en montaña. GPS recomendado.',
    status: 'Abierta',
    location: {
      region: 'Castilla y León',
      province: 'Ávila',
      coordinates: { lat: 40.2500, lng: -5.2500 },
    },
    parking: [
      { lat: 40.2500, lng: -5.2500 }, // Parking en Plataforma de Gredos
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1464822759844-d150ad6d0e78?w=1200&h=800&fit=crop',
      alt: 'Sierra de Gredos',
      width: 1200,
      height: 800,
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1464822759844-d150ad6d0e78?w=800&h=600&fit=crop',
        alt: 'Refugio en Sierra de Gredos',
        width: 800,
        height: 600,
      },
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        alt: 'Laguna glaciar en Gredos',
        width: 800,
        height: 600,
      },
    ],
    gpx: {
      url: '/gpx/tres-refugios.gpx',
      filename: 'tres-refugios.gpx',
      size: 189000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'Ruta de alta montaña, condiciones meteorológicas variables',
      'Equipo de montaña completo necesario',
      'Consultar condiciones antes de salir',
    ],
    storytelling: `# Los Tres Refugios

Una ruta que conecta la historia y la naturaleza de Gredos.`,
    seo: {
      metaTitle: 'Circuito de los Tres Refugios - Sierra de Gredos | Peak Explorer',
      metaDescription: 'Ruta circular de 18km conectando tres refugios históricos en la Sierra de Gredos.',
      keywords: ['sierra de gredos', 'refugios', 'trekking ávila'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'Sendero de los Pueblos Blancos - Cádiz',
    summary: 'Ruta que recorre los característicos pueblos blancos de la Sierra de Cádiz, con arquitectura andaluza y paisajes mediterráneos.',
    difficulty: 'Fácil',
    distance: 15,
    elevation: 600,
    duration: '5-6 horas',
    approach: 'Parking en Grazalema',
    return: 'Circular',
    features: [commonFeatures[5], commonFeatures[0]],
    bestSeason: ['Primavera', 'Otoño'],
    orientation: 'Bien señalizada, seguir PR-A 123',
    status: 'Abierta',
    location: {
      region: 'Andalucía',
      province: 'Cádiz',
      coordinates: { lat: 36.7581, lng: -5.3664 },
    },
    parking: [
      { lat: 36.7581, lng: -5.3664 }, // Parking en Grazalema
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
      alt: 'Pueblos Blancos de Cádiz',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/pueblos-blancos.gpx',
      filename: 'pueblos-blancos.gpx',
      size: 156000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'Protección solar esencial',
      'Agua suficiente para todo el día',
    ],
    storytelling: `# Los Pueblos Blancos

Una ruta que combina naturaleza y cultura en la Sierra de Cádiz.`,
    seo: {
      metaTitle: 'Sendero de los Pueblos Blancos - Cádiz | Peak Explorer',
      metaDescription: 'Ruta de 15km por los pueblos blancos de la Sierra de Cádiz.',
      keywords: ['pueblos blancos', 'grazalema', 'trekking cádiz'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'Ascenso al Mulhacén - Sierra Nevada',
    summary: 'Cumbre más alta de la península ibérica. Ruta exigente que requiere buena condición física y experiencia en alta montaña.',
    difficulty: 'Muy Difícil',
    distance: 22,
    elevation: 1800,
    duration: '10-12 horas',
    approach: 'Desde Capileira o Hoya del Portillo',
    return: 'Mismo punto',
    features: [commonFeatures[5], commonFeatures[6]],
    bestSeason: ['Verano'],
    orientation: 'Ruta de alta montaña, GPS esencial',
    status: 'Abierta',
    location: {
      region: 'Andalucía',
      province: 'Granada',
      coordinates: { lat: 37.0533, lng: -3.3108 },
    },
    parking: [
      { lat: 37.0533, lng: -3.3108 }, // Parking desde Capileira o Hoya del Portillo
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1464822759844-d150ad6d0e78?w=1200&h=800&fit=crop',
      alt: 'Mulhacén, Sierra Nevada',
      width: 1200,
      height: 800,
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1464822759844-d150ad6d0e78?w=800&h=600&fit=crop',
        alt: 'Cumbre del Mulhacén',
        width: 800,
        height: 600,
      },
      {
        url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop',
        alt: 'Vistas desde el Mulhacén',
        width: 800,
        height: 600,
      },
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        alt: 'Sierra Nevada en verano',
        width: 800,
        height: 600,
      },
    ],
    gpx: {
      url: '/gpx/mulhacen.gpx',
      filename: 'mulhacen.gpx',
      size: 278000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'Ruta de alta montaña, condiciones extremas',
      'Equipo completo de montaña obligatorio',
      'Consultar condiciones meteorológicas',
      'Salir temprano para evitar tormentas',
    ],
    storytelling: `# La Cumbre de España

El Mulhacén, con sus 3.479 metros, es el techo de la península ibérica.`,
    seo: {
      metaTitle: 'Ascenso al Mulhacén - Sierra Nevada | Peak Explorer',
      metaDescription: 'Ruta exigente de 22km al pico más alto de España, el Mulhacén (3.479m).',
      keywords: ['mulhacén', 'sierra nevada', 'trekking granada', 'cumbre españa'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'GR-11 Etapa 1 - Canfranc a Candanchú',
    summary: 'Primera etapa del GR-11, el sendero transpirenaico que recorre los Pirineos de este a oeste.',
    difficulty: 'Moderada',
    distance: 12,
    elevation: 500,
    duration: '4-5 horas',
    approach: 'Parking en Canfranc Estación',
    return: 'Transporte desde Candanchú',
    features: [commonFeatures[5], commonFeatures[6]],
    bestSeason: ['Verano', 'Otoño'],
    orientation: 'Bien señalizada con marcas blancas y rojas del GR-11',
    status: 'Abierta',
    location: {
      region: 'Aragón',
      province: 'Huesca',
      coordinates: { lat: 42.7500, lng: -0.5167 },
    },
    parking: [
      { lat: 42.7500, lng: -0.5167 }, // Parking en Canfranc Estación
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
      alt: 'Pirineos, GR-11',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/gr11-etapa1.gpx',
      filename: 'gr11-etapa1.gpx',
      size: 134000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'Ruta de montaña, condiciones variables',
      'Equipo adecuado según época del año',
    ],
    storytelling: `# El Sendero Transpirenaico

El GR-11 es uno de los grandes senderos de España.`,
    seo: {
      metaTitle: 'GR-11 Etapa 1 - Canfranc a Candanchú | Peak Explorer',
      metaDescription: 'Primera etapa del GR-11, sendero transpirenaico de 12km.',
      keywords: ['gr-11', 'pirineos', 'trekking huesca'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'Ruta de los Miradores - Ordesa y Monte Perdido',
    summary: 'Ruta circular que recorre los mejores miradores del Parque Nacional de Ordesa, con vistas espectaculares a las cascadas y valles.',
    difficulty: 'Difícil',
    distance: 20,
    elevation: 1000,
    duration: '7-8 horas',
    approach: 'Parking en la Pradera de Ordesa',
    return: 'Circular',
    features: [commonFeatures[4], commonFeatures[5], commonFeatures[0]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Ruta señalizada, seguir las marcas del parque',
    status: 'Abierta',
    location: {
      region: 'Aragón',
      province: 'Huesca',
      coordinates: { lat: 42.6667, lng: -0.0333 },
    },
    parking: [
      { lat: 42.6667, lng: -0.0333 }, // Parking en la Pradera de Ordesa
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1464822759844-d150ad6d0e78?w=1200&h=800&fit=crop',
      alt: 'Ordesa y Monte Perdido',
      width: 1200,
      height: 800,
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        alt: 'Cascada en Ordesa',
        width: 800,
        height: 600,
      },
      {
        url: 'https://images.unsplash.com/photo-1464822759844-d150ad6d0e78?w=800&h=600&fit=crop',
        alt: 'Valle de Ordesa',
        width: 800,
        height: 600,
      },
      {
        url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop',
        alt: 'Mirador en Ordesa',
        width: 800,
        height: 600,
      },
    ],
    gpx: {
      url: '/gpx/ordesa-miradores.gpx',
      filename: 'ordesa-miradores.gpx',
      size: 201000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'Respetar las normas del parque nacional',
      'No salirse de los senderos marcados',
      'Llevar agua y comida suficiente',
    ],
    storytelling: `# El Valle de Ordesa

Uno de los parques nacionales más bellos de España.`,
    seo: {
      metaTitle: 'Ruta de los Miradores - Ordesa | Peak Explorer',
      metaDescription: 'Ruta circular de 20km por los miradores del Parque Nacional de Ordesa.',
      keywords: ['ordesa', 'monte perdido', 'trekking huesca', 'parque nacional'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'Camino del Rey - Málaga',
    summary: 'El famoso sendero colgante sobre el desfiladero de los Gaitanes. Restaurado y seguro, ofrece vistas vertiginosas.',
    difficulty: 'Moderada',
    distance: 7.7,
    elevation: 100,
    duration: '3-4 horas',
    approach: 'Shuttle desde el parking',
    return: 'Shuttle al parking',
    features: [commonFeatures[0], commonFeatures[5]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Sendero único, imposible perderse',
    status: 'Abierta',
    location: {
      region: 'Andalucía',
      province: 'Málaga',
      coordinates: { lat: 36.9167, lng: -4.7833 },
    },
    parking: [
      { lat: 36.9167, lng: -4.7833 }, // Parking del Camino del Rey
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
      alt: 'Camino del Rey, Málaga',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/camino-rey.gpx',
      filename: 'camino-rey.gpx',
      size: 98000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'Reservar entrada con antelación',
      'Casco obligatorio (incluido en entrada)',
      'No apto para personas con vértigo',
    ],
    storytelling: `# El Sendero Más Peligroso del Mundo

El Camino del Rey, restaurado en 2015, ofrece una experiencia única.`,
    seo: {
      metaTitle: 'Camino del Rey - Málaga | Peak Explorer',
      metaDescription: 'El famoso sendero colgante sobre el desfiladero de los Gaitanes. 7.7km de experiencia única.',
      keywords: ['camino del rey', 'málaga', 'sendero colgante'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'Ruta de los Lagos de Covadonga - Asturias',
    summary: 'Ruta clásica que asciende hasta los lagos Enol y Ercina en los Picos de Europa, con vistas panorámicas.',
    difficulty: 'Fácil',
    distance: 6,
    elevation: 300,
    duration: '2-3 horas',
    approach: 'Parking en Covadonga (gratuito en temporada baja)',
    return: 'Mismo punto',
    features: [commonFeatures[7], commonFeatures[5]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Sendero bien señalizado',
    status: 'Abierta',
    location: {
      region: 'Asturias',
      province: 'Asturias',
      coordinates: { lat: 43.2833, lng: -5.0167 },
    },
    parking: [
      { lat: 43.2833, lng: -5.0167 }, // Parking en Covadonga
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
      alt: 'Lagos de Covadonga',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/lagos-covadonga.gpx',
      filename: 'lagos-covadonga.gpx',
      size: 78000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'En verano, acceso restringido con bus lanzadera',
      'Llevar ropa de abrigo, tiempo cambiante',
    ],
    storytelling: `# Los Lagos de Covadonga

Una ruta accesible que lleva a uno de los paisajes más icónicos de Asturias.`,
    seo: {
      metaTitle: 'Ruta de los Lagos de Covadonga | Peak Explorer',
      metaDescription: 'Ruta fácil de 6km a los lagos Enol y Ercina en los Picos de Europa.',
      keywords: ['lagos covadonga', 'picos de europa', 'trekking asturias'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'Circuito de las Cinco Villas - Pirineo Aragonés',
    summary: 'Ruta circular que conecta cinco pueblos del Pirineo aragonés, pasando por bosques, prados y ríos.',
    difficulty: 'Moderada',
    distance: 16,
    elevation: 700,
    duration: '6-7 horas',
    approach: 'Parking en Ansó',
    return: 'Circular',
    features: [commonFeatures[5], commonFeatures[0]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Bien señalizada con marcas PR',
    status: 'Abierta',
    location: {
      region: 'Aragón',
      province: 'Huesca',
      coordinates: { lat: 42.7667, lng: -0.8333 },
    },
    parking: [
      { lat: 42.7667, lng: -0.8333 }, // Parking en Ansó
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1464822759844-d150ad6d0e78?w=1200&h=800&fit=crop',
      alt: 'Pirineo Aragonés',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/cinco-villas.gpx',
      filename: 'cinco-villas.gpx',
      size: 167000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'Ruta de montaña, condiciones variables',
      'Equipo adecuado según época',
    ],
    storytelling: `# Las Cinco Villas

Una ruta que combina naturaleza y cultura pirenaica.`,
    seo: {
      metaTitle: 'Circuito de las Cinco Villas - Pirineo Aragonés | Peak Explorer',
      metaDescription: 'Ruta circular de 16km conectando cinco pueblos del Pirineo aragonés.',
      keywords: ['pirineo aragonés', 'ansó', 'trekking huesca'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'Sendero de la Pedriza - Madrid',
    summary: 'Ruta por el Parque Regional de la Cuenca Alta del Manzanares, con formaciones graníticas únicas y vistas a Madrid.',
    difficulty: 'Moderada',
    distance: 14,
    elevation: 500,
    duration: '5-6 horas',
    approach: 'Parking en Canto Cochino',
    return: 'Circular',
    features: [commonFeatures[5], commonFeatures[0]],
    bestSeason: ['Primavera', 'Otoño', 'Invierno'],
    orientation: 'Bien señalizada, seguir marcas del parque',
    status: 'Abierta',
    location: {
      region: 'Madrid',
      province: 'Madrid',
      coordinates: { lat: 40.7833, lng: -3.8833 },
    },
    parking: [
      { lat: 40.7833, lng: -3.8833 }, // Parking en Canto Cochino
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
      alt: 'La Pedriza, Madrid',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/pedriza.gpx',
      filename: 'pedriza.gpx',
      size: 145000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'Muy concurrida los fines de semana',
      'Llegar temprano para aparcar',
      'No salirse de los senderos marcados',
    ],
    storytelling: `# La Pedriza

Un paisaje único de formaciones graníticas a las puertas de Madrid.`,
    seo: {
      metaTitle: 'Sendero de la Pedriza - Madrid | Peak Explorer',
      metaDescription: 'Ruta de 14km por el Parque Regional de la Pedriza, con formaciones graníticas únicas.',
      keywords: ['pedriza', 'manzanares', 'trekking madrid'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'trekking',
    title: 'GR-92 Etapa Costa Brava - Girona',
    summary: 'Etapa del sendero de gran recorrido que recorre la Costa Brava, combinando playas, acantilados y pueblos costeros.',
    difficulty: 'Fácil',
    distance: 11,
    elevation: 200,
    duration: '3-4 horas',
    approach: 'Parking en Tossa de Mar',
    return: 'Transporte desde Lloret',
    features: [commonFeatures[5], commonFeatures[0]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Bien señalizada con marcas GR-92',
    status: 'Abierta',
    location: {
      region: 'Cataluña',
      province: 'Girona',
      coordinates: { lat: 41.7167, lng: 2.9333 },
    },
    parking: [
      { lat: 41.7167, lng: 2.9333 }, // Parking en Tossa de Mar
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
      alt: 'Costa Brava, Girona',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/gr92-costa-brava.gpx',
      filename: 'gr92-costa-brava.gpx',
      size: 123000,
    },
    equipment: [],
    accommodations: [],
    safetyTips: [
      'Protección solar esencial',
      'Llevar agua suficiente',
      'Cuidado con los acantilados',
    ],
    storytelling: `# La Costa Brava a Pie

Una ruta que combina mar y montaña en la Costa Brava.`,
    seo: {
      metaTitle: 'GR-92 Costa Brava - Girona | Peak Explorer',
      metaDescription: 'Etapa del GR-92 de 11km por la Costa Brava, de Tossa a Lloret.',
      keywords: ['gr-92', 'costa brava', 'trekking girona'],
    },
    views: 0,
    downloads: 0,
  },
]

// Datos de ejemplo - 5 vías ferratas
export const sampleFerratas: Omit<Route, 'id' | 'slug' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'ferrata',
    title: 'Vía Ferrata de Montserrat - Cataluña',
    summary: 'Vía ferrata técnica con vistas panorámicas al monasterio de Montserrat y toda la comarca.',
    difficulty: 'Difícil',
    ferrataGrade: 'K4',
    distance: 2.5,
    elevation: 350,
    duration: '3-4 horas',
    approach: 'Desde el parking del monasterio',
    return: 'Mismo punto',
    features: [commonFeatures[1], commonFeatures[2]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Bien equipada, seguir las marcas rojas',
    status: 'Abierta',
    location: {
      region: 'Cataluña',
      province: 'Barcelona',
      coordinates: { lat: 41.5925, lng: 1.8372 },
    },
    parking: [
      { lat: 41.5925, lng: 1.8372 }, // Parking del monasterio de Montserrat
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
      alt: 'Vía Ferrata de Montserrat',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/ferrata-montserrat.gpx',
      filename: 'ferrata-montserrat.gpx',
      size: 89000,
    },
    equipment: [
      {
        type: 'equipment',
        title: 'Kit de Vía Ferrata',
        url: 'https://example.com/afiliado/kit-ferrata',
        description: 'Arnés, casco, disipador y mosquetones',
      },
    ],
    accommodations: [],
    safetyTips: [
      'Equipo de vía ferrata obligatorio',
      'Nunca desengancharse completamente',
      'Respetar el orden en la vía',
      'Revisar el estado de los anclajes',
    ],
    storytelling: `# Montserrat Vertical

La vía ferrata de Montserrat ofrece una experiencia única escalando las icónicas agujas de esta montaña sagrada.`,
    seo: {
      metaTitle: 'Vía Ferrata de Montserrat K4 | Peak Explorer',
      metaDescription: 'Vía ferrata técnica K4 en Montserrat con vistas al monasterio. Equipo obligatorio.',
      keywords: ['vía ferrata montserrat', 'ferrata barcelona', 'k4'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'ferrata',
    title: 'Vía Ferrata de Riglos - Huesca',
    summary: 'Vía ferrata en uno de los mejores lugares de escalada de España. Las imponentes agujas de Riglos ofrecen una experiencia vertiginosa.',
    difficulty: 'Muy Difícil',
    ferrataGrade: 'K5',
    distance: 3,
    elevation: 400,
    duration: '4-5 horas',
    approach: 'Parking en Riglos',
    return: 'Mismo punto',
    features: [commonFeatures[1], commonFeatures[2]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Bien equipada, seguir las marcas',
    status: 'Abierta',
    location: {
      region: 'Aragón',
      province: 'Huesca',
      coordinates: { lat: 42.3500, lng: -0.7167 },
    },
    parking: [
      { lat: 42.3500, lng: -0.7167 }, // Parking en Riglos
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
      alt: 'Vía Ferrata de Riglos',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/ferrata-riglos.gpx',
      filename: 'ferrata-riglos.gpx',
      size: 112000,
    },
    equipment: [
      {
        type: 'equipment',
        title: 'Kit de Vía Ferrata',
        url: 'https://example.com/afiliado/kit-ferrata',
        description: 'Arnés, casco, disipador y mosquetones',
      },
    ],
    accommodations: [],
    safetyTips: [
      'Equipo de vía ferrata obligatorio',
      'Vía técnica, experiencia previa recomendada',
      'Revisar condiciones meteorológicas',
    ],
    storytelling: `# Las Agujas de Riglos

Una de las vías ferratas más técnicas de España, en un entorno único.`,
    seo: {
      metaTitle: 'Vía Ferrata de Riglos K5 | Peak Explorer',
      metaDescription: 'Vía ferrata técnica K5 en las agujas de Riglos, Huesca. Experiencia vertiginosa.',
      keywords: ['vía ferrata riglos', 'ferrata huesca', 'k5'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'ferrata',
    title: 'Vía Ferrata de la Peña - Asturias',
    summary: 'Vía ferrata con vistas espectaculares a los Picos de Europa. Perfecta para iniciarse en vías ferratas de nivel medio.',
    difficulty: 'Moderada',
    ferrataGrade: 'K3',
    distance: 2,
    elevation: 250,
    duration: '2-3 horas',
    approach: 'Parking en Arenas de Cabrales',
    return: 'Mismo punto',
    features: [commonFeatures[1]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Bien equipada y señalizada',
    status: 'Abierta',
    location: {
      region: 'Asturias',
      province: 'Asturias',
      coordinates: { lat: 43.3167, lng: -4.8333 },
    },
    parking: [
      { lat: 43.3167, lng: -4.8333 }, // Parking en Arenas de Cabrales
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
      alt: 'Vía Ferrata de la Peña',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/ferrata-pena.gpx',
      filename: 'ferrata-pena.gpx',
      size: 67000,
    },
    equipment: [
      {
        type: 'equipment',
        title: 'Kit de Vía Ferrata',
        url: 'https://example.com/afiliado/kit-ferrata',
        description: 'Arnés, casco, disipador y mosquetones',
      },
    ],
    accommodations: [],
    safetyTips: [
      'Equipo de vía ferrata obligatorio',
      'Ideal para iniciarse en vías ferratas',
    ],
    storytelling: `# La Peña de Asturias

Una vía ferrata perfecta para disfrutar de los Picos de Europa desde otra perspectiva.`,
    seo: {
      metaTitle: 'Vía Ferrata de la Peña K3 | Peak Explorer',
      metaDescription: 'Vía ferrata K3 en Asturias con vistas a los Picos de Europa. Ideal para iniciarse.',
      keywords: ['vía ferrata asturias', 'ferrata picos de europa', 'k3'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'ferrata',
    title: 'Vía Ferrata del Caminito del Rey - Málaga',
    summary: 'Vía ferrata que complementa el famoso Caminito del Rey, añadiendo secciones verticales a la experiencia.',
    difficulty: 'Difícil',
    ferrataGrade: 'K4',
    distance: 1.5,
    elevation: 200,
    duration: '2-3 horas',
    approach: 'Desde el acceso al Caminito del Rey',
    return: 'Mismo punto',
    features: [commonFeatures[1], commonFeatures[2]],
    bestSeason: ['Primavera', 'Verano', 'Otoño'],
    orientation: 'Bien equipada',
    status: 'Abierta',
    location: {
      region: 'Andalucía',
      province: 'Málaga',
      coordinates: { lat: 36.9167, lng: -4.7833 },
    },
    parking: [
      { lat: 36.9167, lng: -4.7833 }, // Parking del Caminito del Rey
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
      alt: 'Vía Ferrata del Caminito del Rey',
      width: 1200,
      height: 800,
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
        alt: 'Vista panorámica del Caminito del Rey',
        width: 1200,
        height: 800,
      },
      {
        url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
        alt: 'Pasarela del Caminito del Rey',
        width: 1200,
        height: 800,
      },
    ],
    gpx: {
      url: '/gpx/ferrata-caminito-rey.gpx',
      filename: 'ferrata-caminito-rey.gpx',
      size: 56000,
    },
    equipment: [
      {
        type: 'equipment',
        title: 'Kit de Vía Ferrata',
        url: 'https://example.com/afiliado/kit-ferrata',
        description: 'Arnés, casco, disipador y mosquetones',
      },
    ],
    accommodations: [],
    safetyTips: [
      'Equipo de vía ferrata obligatorio',
      'Reservar entrada con antelación',
      'No apto para personas con vértigo',
    ],
    storytelling: `# El Caminito Vertical

Una experiencia que combina el famoso sendero con secciones de vía ferrata.`,
    seo: {
      metaTitle: 'Vía Ferrata del Caminito del Rey K4 | Peak Explorer',
      metaDescription: 'Vía ferrata K4 complementando el Caminito del Rey en Málaga.',
      keywords: ['vía ferrata caminito del rey', 'ferrata málaga', 'k4'],
    },
    views: 0,
    downloads: 0,
  },
  {
    type: 'ferrata',
    title: 'Vía Ferrata de la Pedriza - Madrid',
    summary: 'Vía ferrata en el corazón de la Pedriza, con formaciones graníticas únicas y vistas a Madrid.',
    difficulty: 'Moderada',
    ferrataGrade: 'K2',
    distance: 1.8,
    elevation: 180,
    duration: '2 horas',
    approach: 'Parking en Canto Cochino',
    return: 'Mismo punto',
    features: [commonFeatures[1]],
    bestSeason: ['Primavera', 'Otoño', 'Invierno'],
    orientation: 'Bien equipada',
    status: 'Abierta',
    location: {
      region: 'Madrid',
      province: 'Madrid',
      coordinates: { lat: 40.7833, lng: -3.8833 },
    },
    parking: [
      { lat: 40.7833, lng: -3.8833 }, // Parking en Canto Cochino
    ],
    heroImage: {
      url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
      alt: 'Vía Ferrata de la Pedriza',
      width: 1200,
      height: 800,
    },
    gallery: [],
    gpx: {
      url: '/gpx/ferrata-pedriza.gpx',
      filename: 'ferrata-pedriza.gpx',
      size: 72000,
    },
    equipment: [
      {
        type: 'equipment',
        title: 'Kit de Vía Ferrata',
        url: 'https://example.com/afiliado/kit-ferrata',
        description: 'Arnés, casco, disipador y mosquetones',
      },
    ],
    accommodations: [],
    safetyTips: [
      'Equipo de vía ferrata obligatorio',
      'Muy concurrida los fines de semana',
      'Llegar temprano para aparcar',
    ],
    storytelling: `# La Pedriza Vertical

Una vía ferrata accesible en uno de los lugares más singulares de Madrid.`,
    seo: {
      metaTitle: 'Vía Ferrata de la Pedriza K2 | Peak Explorer',
      metaDescription: 'Vía ferrata K2 en la Pedriza, Madrid. Ideal para iniciarse.',
      keywords: ['vía ferrata pedriza', 'ferrata madrid', 'k2'],
    },
    views: 0,
    downloads: 0,
  },
]

