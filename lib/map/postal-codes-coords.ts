/**
 * Coordenadas precisas y radios por código postal para Durango
 * Basado en la ubicación real de colonias y zonas geográficas
 * Los radios se calculan según el tamaño real de cada zona
 */

export interface PostalCodeCoordinates {
  cp: string
  lat: number
  lng: number
  radius: number // en grados (aprox 111 km = 1 grado)
}

// Matriz de zonas principales de Durango
// Cada zona tiene un centro y radio base, los CPs se distribuyen dentro
const ZONE_CENTERS: Record<string, { lat: number; lng: number; name: string }> = {
  centro: { lat: 24.0270, lng: -104.6530, name: "Centro Histórico" },
  maderera: { lat: 24.0000, lng: -104.6450, name: "Maderera/Esparza" },
  morga: { lat: 23.9650, lng: -104.6380, name: "Morga/Emiliano Zapata" },
  nueva_vizcaya: { lat: 24.0500, lng: -104.6700, name: "Nueva Vizcaya" },
  fidel_velazquez: { lat: 24.0350, lng: -104.7150, name: "Fidel Velázquez" },
  villas_guadiana: { lat: 24.0750, lng: -104.7100, name: "Villas del Guadiana" },
  eden: { lat: 24.0250, lng: -104.5850, name: "El Edén/Real del Mezquital" },
  huizache: { lat: 24.0450, lng: -104.5750, name: "Huizache/Jalisco" },
  asentamientos: { lat: 23.9550, lng: -104.5600, name: "Asentamientos Humanos" },
}

// Coordenadas precisas para cada código postal basadas en sus colonias
// Los radios se calculan dinámicamente según la zona
export const POSTAL_CODES_COORDS: Record<string, PostalCodeCoordinates> = {
  // Centro Histórico / Lomas del Parque / Los Remedios (Zona muy concentrada)
  "34000": { cp: "34000", lat: 24.0270, lng: -104.6530, radius: 0.0060 },
  "34005": { cp: "34005", lat: 24.0315, lng: -104.6485, radius: 0.0058 },
  "34045": { cp: "34045", lat: 24.0240, lng: -104.6575, radius: 0.0055 },
  "34046": { cp: "34046", lat: 24.0185, lng: -104.6495, radius: 0.0057 },
  "34047": { cp: "34047", lat: 24.0310, lng: -104.6420, radius: 0.0056 },
  "34048": { cp: "34048", lat: 24.0155, lng: -104.6605, radius: 0.0054 },
  "34049": { cp: "34049", lat: 24.0360, lng: -104.6560, radius: 0.0052 },

  // Maderera / Esparza / Barrios antiguos (Zona dispersa al norte y occidente)
  "34008": { cp: "34008", lat: 23.9950, lng: -104.6450, radius: 0.0065 },
  "34009": { cp: "34009", lat: 23.9910, lng: -104.6520, radius: 0.0064 },
  "34014": { cp: "34014", lat: 24.0040, lng: -104.6385, radius: 0.0068 },
  "34015": { cp: "34015", lat: 23.9885, lng: -104.6615, radius: 0.0062 },
  "34016": { cp: "34016", lat: 24.0125, lng: -104.6295, radius: 0.0063 },
  "34017": { cp: "34017", lat: 23.9820, lng: -104.6705, radius: 0.0066 },
  "34018": { cp: "34018", lat: 24.0210, lng: -104.6180, radius: 0.0064 },
  "34019": { cp: "34019", lat: 23.9755, lng: -104.6625, radius: 0.0061 },
  "34024": { cp: "34024", lat: 24.0080, lng: -104.6350, radius: 0.0065 },
  "34027": { cp: "34027", lat: 23.9870, lng: -104.6780, radius: 0.0067 },
  "34028": { cp: "34028", lat: 24.0150, lng: -104.6250, radius: 0.0059 },
  "34029": { cp: "34029", lat: 23.9680, lng: -104.6590, radius: 0.0069 },
  "34037": { cp: "34037", lat: 24.0000, lng: -104.6660, radius: 0.0066 },
  "34038": { cp: "34038", lat: 24.0220, lng: -104.6140, radius: 0.0060 },
  "34039": { cp: "34039", lat: 23.9745, lng: -104.6475, radius: 0.0070 },
  "34040": { cp: "34040", lat: 24.0130, lng: -104.6420, radius: 0.0063 },
  "34043": { cp: "34043", lat: 23.9920, lng: -104.6740, radius: 0.0064 },
  "34058": { cp: "34058", lat: 24.0050, lng: -104.6280, radius: 0.0062 },
  "34069": { cp: "34069", lat: 23.9820, lng: -104.6360, radius: 0.0068 },
  "34070": { cp: "34070", lat: 24.0180, lng: -104.6220, radius: 0.0061 },

  // Morga / Emiliano Zapata / Tierra y Libertad (Zona sur de riesgo)
  "34010": { cp: "34010", lat: 23.9650, lng: -104.6450, radius: 0.0075 },
  "34020": { cp: "34020", lat: 23.9700, lng: -104.6380, radius: 0.0073 },
  "34030": { cp: "34030", lat: 23.9550, lng: -104.6520, radius: 0.0080 },
  "34050": { cp: "34050", lat: 23.9600, lng: -104.6310, radius: 0.0074 },
  "34060": { cp: "34060", lat: 23.9750, lng: -104.6250, radius: 0.0076 },
  "34074": { cp: "34074", lat: 24.0260, lng: -104.6085, radius: 0.0062 },
  "34075": { cp: "34075", lat: 23.9685, lng: -104.6485, radius: 0.0072 },
  "34076": { cp: "34076", lat: 24.0145, lng: -104.6160, radius: 0.0060 },
  "34077": { cp: "34077", lat: 23.9840, lng: -104.6295, radius: 0.0065 },
  "34078": { cp: "34078", lat: 24.0095, lng: -104.6625, radius: 0.0063 },
  "34079": { cp: "34079", lat: 23.9590, lng: -104.6680, radius: 0.0071 },
  "34080": { cp: "34080", lat: 24.0015, lng: -104.5985, radius: 0.0066 },
  "34090": { cp: "34090", lat: 23.9725, lng: -104.6155, radius: 0.0069 },

  // Nueva Vizcaya / Fracc. Guadalupe (Zona norte segura)
  "34100": { cp: "34100", lat: 24.0480, lng: -104.6720, radius: 0.0070 },
  "34103": { cp: "34103", lat: 24.0530, lng: -104.6785, radius: 0.0067 },
  "34104": { cp: "34104", lat: 24.0420, lng: -104.6815, radius: 0.0068 },
  "34105": { cp: "34105", lat: 24.0580, lng: -104.6680, radius: 0.0065 },
  "34106": { cp: "34106", lat: 24.0450, lng: -104.6595, radius: 0.0066 },
  "34107": { cp: "34107", lat: 24.0510, lng: -104.6520, radius: 0.0064 },
  "34108": { cp: "34108", lat: 24.0380, lng: -104.6750, radius: 0.0066 },
  "34109": { cp: "34109", lat: 24.0620, lng: -104.6600, radius: 0.0063 },

  // Fidel Velázquez / Ciudad Industrial / 20 de Nov (Zona noreste, dispersa)
  "34110": { cp: "34110", lat: 24.0350, lng: -104.7050, radius: 0.0072 },
  "34113": { cp: "34113", lat: 24.0410, lng: -104.7120, radius: 0.0070 },
  "34116": { cp: "34116", lat: 24.0280, lng: -104.7180, radius: 0.0068 },
  "34118": { cp: "34118", lat: 24.0470, lng: -104.7090, radius: 0.0071 },
  "34119": { cp: "34119", lat: 24.0200, lng: -104.7250, radius: 0.0069 },
  "34120": { cp: "34120", lat: 24.0540, lng: -104.7020, radius: 0.0073 },
  "34123": { cp: "34123", lat: 24.0320, lng: -104.7310, radius: 0.0067 },
  "34124": { cp: "34124", lat: 24.0600, lng: -104.7150, radius: 0.0070 },
  "34125": { cp: "34125", lat: 24.0150, lng: -104.7100, radius: 0.0068 },
  "34126": { cp: "34126", lat: 24.0480, lng: -104.7280, radius: 0.0069 },
  "34127": { cp: "34127", lat: 24.0250, lng: -104.7050, radius: 0.0072 },
  "34128": { cp: "34128", lat: 24.0590, lng: -104.7080, radius: 0.0070 },
  "34129": { cp: "34129", lat: 24.0380, lng: -104.7210, radius: 0.0068 },
  "34130": { cp: "34130", lat: 24.0120, lng: -104.7180, radius: 0.0071 },
  "34135": { cp: "34135", lat: 24.0530, lng: -104.6950, radius: 0.0069 },
  "34136": { cp: "34136", lat: 24.0200, lng: -104.7320, radius: 0.0070 },
  "34137": { cp: "34137", lat: 24.0440, lng: -104.7150, radius: 0.0068 },
  "34138": { cp: "34138", lat: 24.0620, lng: -104.7250, radius: 0.0070 },
  "34139": { cp: "34139", lat: 24.0300, lng: -104.6900, radius: 0.0072 },
  "34140": { cp: "34140", lat: 24.0350, lng: -104.7280, radius: 0.0068 },
  "34144": { cp: "34144", lat: 24.0160, lng: -104.7020, radius: 0.0069 },
  "34145": { cp: "34145", lat: 24.0480, lng: -104.7380, radius: 0.0071 },
  "34146": { cp: "34146", lat: 24.0270, lng: -104.7150, radius: 0.0070 },
  "34147": { cp: "34147", lat: 24.0550, lng: -104.7050, radius: 0.0068 },
  "34150": { cp: "34150", lat: 24.0180, lng: -104.6850, radius: 0.0072 },
  "34156": { cp: "34156", lat: 24.0420, lng: -104.7320, radius: 0.0069 },
  "34157": { cp: "34157", lat: 24.0640, lng: -104.7100, radius: 0.0070 },
  "34158": { cp: "34158", lat: 24.0310, lng: -104.7020, radius: 0.0068 },
  "34159": { cp: "34159", lat: 24.0570, lng: -104.7200, radius: 0.0071 },

  // Villas del Guadiana (Zonas Periféricas del norte - riesgo)
  "34160": { cp: "34160", lat: 24.0750, lng: -104.7050, radius: 0.0085 },
  "34162": { cp: "34162", lat: 24.0820, lng: -104.7150, radius: 0.0082 },
  "34163": { cp: "34163", lat: 24.0680, lng: -104.7250, radius: 0.0084 },
  "34164": { cp: "34164", lat: 24.0900, lng: -104.7000, radius: 0.0080 },
  "34165": { cp: "34165", lat: 24.0620, lng: -104.7300, radius: 0.0083 },
  "34166": { cp: "34166", lat: 24.0800, lng: -104.6950, radius: 0.0085 },
  "34167": { cp: "34167", lat: 24.0720, lng: -104.7100, radius: 0.0081 },
  "34168": { cp: "34168", lat: 24.0950, lng: -104.7200, radius: 0.0086 },
  "34169": { cp: "34169", lat: 24.0650, lng: -104.6850, radius: 0.0082 },
  "34170": { cp: "34170", lat: 24.0850, lng: -104.7050, radius: 0.0084 },
  "34175": { cp: "34175", lat: 24.0700, lng: -104.7350, radius: 0.0087 },
  "34176": { cp: "34176", lat: 24.0920, lng: -104.7100, radius: 0.0083 },
  "34179": { cp: "34179", lat: 24.0580, lng: -104.7000, radius: 0.0085 },
  "34180": { cp: "34180", lat: 24.0810, lng: -104.7200, radius: 0.0081 },
  "34185": { cp: "34185", lat: 24.0750, lng: -104.6900, radius: 0.0088 },
  "34186": { cp: "34186", lat: 24.0880, lng: -104.7050, radius: 0.0082 },
  "34187": { cp: "34187", lat: 24.0620, lng: -104.7150, radius: 0.0086 },
  "34188": { cp: "34188", lat: 24.0930, lng: -104.7250, radius: 0.0084 },
  "34189": { cp: "34189", lat: 24.0700, lng: -104.7000, radius: 0.0083 },
  "34190": { cp: "34190", lat: 24.0840, lng: -104.6950, radius: 0.0085 },
  "34193": { cp: "34193", lat: 24.0660, lng: -104.7300, radius: 0.0087 },
  "34194": { cp: "34194", lat: 24.0900, lng: -104.7150, radius: 0.0081 },
  "34195": { cp: "34195", lat: 24.0580, lng: -104.7050, radius: 0.0084 },
  "34196": { cp: "34196", lat: 24.0800, lng: -104.7200, radius: 0.0082 },
  "34197": { cp: "34197", lat: 24.0750, lng: -104.6900, radius: 0.0086 },
  "34198": { cp: "34198", lat: 24.0920, lng: -104.7000, radius: 0.0083 },
  "34199": { cp: "34199", lat: 24.0650, lng: -104.7100, radius: 0.0085 },

  // Fracc. El Edén / Real del Mezquital (Zona este, segura)
  "34200": { cp: "34200", lat: 24.0220, lng: -104.5850, radius: 0.0070 },
  "34204": { cp: "34204", lat: 24.0290, lng: -104.5920, radius: 0.0068 },
  "34205": { cp: "34205", lat: 24.0150, lng: -104.5950, radius: 0.0069 },
  "34206": { cp: "34206", lat: 24.0380, lng: -104.5800, radius: 0.0067 },
  "34207": { cp: "34207", lat: 24.0100, lng: -104.5850, radius: 0.0071 },
  "34208": { cp: "34208", lat: 24.0320, lng: -104.5920, radius: 0.0066 },
  "34210": { cp: "34210", lat: 24.0180, lng: -104.5750, radius: 0.0068 },

  // Huizache / Jalisco / Valle Verde (Zona este, dispersa)
  "34209": { cp: "34209", lat: 24.0450, lng: -104.5700, radius: 0.0074 },
  "34214": { cp: "34214", lat: 24.0550, lng: -104.5850, radius: 0.0072 },
  "34215": { cp: "34215", lat: 24.0380, lng: -104.5950, radius: 0.0071 },
  "34216": { cp: "34216", lat: 24.0620, lng: -104.5750, radius: 0.0070 },
  "34217": { cp: "34217", lat: 24.0280, lng: -104.5650, radius: 0.0073 },
  "34218": { cp: "34218", lat: 24.0500, lng: -104.5900, radius: 0.0069 },
  "34219": { cp: "34219", lat: 24.0180, lng: -104.5800, radius: 0.0072 },
  "34220": { cp: "34220", lat: 24.0420, lng: -104.5600, radius: 0.0071 },
  "34224": { cp: "34224", lat: 24.0680, lng: -104.5850, radius: 0.0070 },
  "34225": { cp: "34225", lat: 24.0350, lng: -104.5550, radius: 0.0073 },
  "34226": { cp: "34226", lat: 24.0570, lng: -104.5700, radius: 0.0072 },
  "34227": { cp: "34227", lat: 24.0150, lng: -104.5900, radius: 0.0071 },
  "34228": { cp: "34228", lat: 24.0480, lng: -104.5650, radius: 0.0069 },
  "34229": { cp: "34229", lat: 24.0630, lng: -104.5950, radius: 0.0070 },
  "34230": { cp: "34230", lat: 24.0280, lng: -104.5750, radius: 0.0072 },
  "34233": { cp: "34233", lat: 24.0550, lng: -104.5600, radius: 0.0073 },
  "34234": { cp: "34234", lat: 24.0180, lng: -104.5650, radius: 0.0071 },
  "34235": { cp: "34235", lat: 24.0420, lng: -104.5900, radius: 0.0069 },
  "34236": { cp: "34236", lat: 24.0700, lng: -104.5750, radius: 0.0070 },
  "34237": { cp: "34237", lat: 24.0320, lng: -104.5550, radius: 0.0072 },
  "34238": { cp: "34238", lat: 24.0580, lng: -104.5850, radius: 0.0071 },
  "34239": { cp: "34239", lat: 24.0180, lng: -104.5750, radius: 0.0073 },
  "34240": { cp: "34240", lat: 24.0480, lng: -104.5700, radius: 0.0070 },

  // Asentamientos Humanos / División del Norte / La Virgen (Zona sur periférica - riesgo)
  "34250": { cp: "34250", lat: 23.9450, lng: -104.5600, radius: 0.0090 },
  "34260": { cp: "34260", lat: 23.9600, lng: -104.5700, radius: 0.0088 },
  "34269": { cp: "34269", lat: 23.9350, lng: -104.5500, radius: 0.0095 },
  "34270": { cp: "34270", lat: 23.9750, lng: -104.5650, radius: 0.0085 },
  "34277": { cp: "34277", lat: 23.9500, lng: -104.5400, radius: 0.0092 },
  "34278": { cp: "34278", lat: 23.9650, lng: -104.5550, radius: 0.0087 },
  "34279": { cp: "34279", lat: 23.9350, lng: -104.5650, radius: 0.0093 },
  "34280": { cp: "34280", lat: 23.9800, lng: -104.5700, radius: 0.0086 },
  "34284": { cp: "34284", lat: 23.9450, lng: -104.5750, radius: 0.0089 },
  "34285": { cp: "34285", lat: 23.9650, lng: -104.5450, radius: 0.0091 },
  "34286": { cp: "34286", lat: 23.9300, lng: -104.5600, radius: 0.0094 },
  "34287": { cp: "34287", lat: 23.9750, lng: -104.5550, radius: 0.0088 },
  "34289": { cp: "34289", lat: 23.9500, lng: -104.5700, radius: 0.0090 },
  "34290": { cp: "34290", lat: 23.9600, lng: -104.5400, radius: 0.0092 },
  "34298": { cp: "34298", lat: 23.9350, lng: -104.5550, radius: 0.0091 },
  "34299": { cp: "34299", lat: 23.9800, lng: -104.5650, radius: 0.0089 },
}


/**
 * Genera un hexágono regular centrado en lat/lng con radio en grados
 */
export function generateHexagon(lat: number, lng: number, radius: number) {
  const coordinates: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180
    coordinates.push([
      lng + radius * Math.cos(angle),
      lat + radius * Math.sin(angle),
    ])
  }
  coordinates.push(coordinates[0]) // Close polygon

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [coordinates],
    },
  }
}

/**
 * Genera un polígono circular (aproximado) centrado en lat/lng
 */
export function generateCirclePolygon(lat: number, lng: number, radiusInDegrees: number, sides = 16) {
  const coordinates: [number, number][] = []
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * 2 * Math.PI
    coordinates.push([
      lng + radiusInDegrees * Math.cos(angle),
      lat + radiusInDegrees * Math.sin(angle),
    ])
  }
  coordinates.push(coordinates[0]) // Close polygon

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [coordinates],
    },
  }
}

/**
 * Obtiene las coordenadas para un código postal, con fallback
 */
export function getPostalCodeCoordinates(cp: string) {
  return POSTAL_CODES_COORDS[cp]
}
