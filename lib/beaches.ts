export interface Beach {
  name: string;
  lat: number;
  lon: number;
  exposureNW: 'MUY ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';
  exposureSW: 'MUY ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';
  riskSeason: string;
  zone: 'SUR' | 'CENTRO' | 'NORTE';
}

export const BEACHES: Beach[] = [
  {
    name: 'Los Muertos',
    lat: 20.6098,
    lon: -105.2363,
    exposureNW: 'MUY ALTA',
    exposureSW: 'BAJA',
    riskSeason: 'Invierno (Nov-Abr)',
    zone: 'SUR',
  },
  {
    name: 'Olas Altas',
    lat: 20.6120,
    lon: -105.2380,
    exposureNW: 'ALTA',
    exposureSW: 'BAJA',
    riskSeason: 'Invierno (Nov-Abr)',
    zone: 'SUR',
  },
  {
    name: 'Malecón',
    lat: 20.6155,
    lon: -105.2395,
    exposureNW: 'ALTA',
    exposureSW: 'BAJA',
    riskSeason: 'Invierno (Nov-Abr)',
    zone: 'SUR',
  },
  {
    name: 'Camarones',
    lat: 20.6290,
    lon: -105.2380,
    exposureNW: 'MEDIA',
    exposureSW: 'MEDIA',
    riskSeason: 'Todo el año',
    zone: 'CENTRO',
  },
  {
    name: 'Nuevo Vallarta',
    lat: 20.7000,
    lon: -105.2900,
    exposureNW: 'BAJA',
    exposureSW: 'ALTA',
    riskSeason: 'Verano (May-Oct)',
    zone: 'NORTE',
  },
  {
    name: 'Bucerías',
    lat: 20.7530,
    lon: -105.3340,
    exposureNW: 'BAJA',
    exposureSW: 'MUY ALTA',
    riskSeason: 'Verano (May-Oct)',
    zone: 'NORTE',
  },
  {
    name: 'La Cruz',
    lat: 20.7380,
    lon: -105.3700,
    exposureNW: 'BAJA',
    exposureSW: 'ALTA',
    riskSeason: 'Verano (May-Oct)',
    zone: 'NORTE',
  },
  {
    name: 'Sayulita',
    lat: 20.8690,
    lon: -105.4410,
    exposureNW: 'ALTA',
    exposureSW: 'ALTA',
    riskSeason: 'Todo el año',
    zone: 'NORTE',
  },
  {
    name: 'Punta Mita',
    lat: 20.7740,
    lon: -105.5240,
    exposureNW: 'MUY ALTA',
    exposureSW: 'ALTA',
    riskSeason: 'Todo el año',
    zone: 'NORTE',
  },
];

// Reference point for API calls (center of bay)
export const BAY_CENTER = { lat: 20.7000, lon: -105.3500 };
