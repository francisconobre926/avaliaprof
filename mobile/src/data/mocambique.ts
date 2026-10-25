export interface Distrito {
  nome: string;
}

export interface Provincia {
  nome: string;
  capital: string;
  distritos: string[];
}

export const PROVINCIAS_MOCAMBIQUE: Provincia[] = [
  {
    nome: 'Cabo Delgado',
    capital: 'Pemba',
    distritos: [
      'Pemba', 'Ancuabe', 'Balama', 'Chiúre', 'Ibo', 'Macomia',
      'Mecúfi', 'Meluco', 'Metuge', 'Mocímboa da Praia', 'Montepuez',
      'Mueda', 'Muidumbe', 'Namuno', 'Nangade', 'Palma', 'Quissanga',
    ],
  },
  {
    nome: 'Gaza',
    capital: 'Xai-Xai',
    distritos: [
      'Xai-Xai', 'Bilene', 'Chibuto', 'Chicualacuala', 'Chigubo',
      'Chókwè', 'Guijá', 'Limpopo', 'Mabalane', 'Manjacaze',
      'Massangena', 'Massingir', 'Mapai',
    ],
  },
  {
    nome: 'Inhambane',
    capital: 'Inhambane',
    distritos: [
      'Inhambane', 'Cidade da Maxixe', 'Funhalouro', 'Govuro', 'Homoíne',
      'Inharrime', 'Inhassoro', 'Jangamo', 'Mabote', 'Massinga',
      'Morrumbene', 'Panda', 'Vilanculos', 'Zavala',
    ],
  },
  {
    nome: 'Manica',
    capital: 'Chimoio',
    distritos: [
      'Chimoio', 'Bárue', 'Gondola', 'Guro', 'Macate', 'Machaze',
      'Macossa', 'Manica', 'Mossurize', 'Sussundenga', 'Tambara', 'Vanduzi',
    ],
  },
  {
    nome: 'Maputo Cidade',
    capital: 'Maputo',
    distritos: [
      'KaMpfumo (Cidade)', 'Nlhamankulu', 'KaMaxaquene', 'KaMavota',
      'KaMubukwana', 'KaTembe', 'KaNyaka',
    ],
  },
  {
    nome: 'Maputo Província',
    capital: 'Matola',
    distritos: [
      'Matola', 'Boane', 'Magude', 'Manhiça', 'Marracuene',
      'Matutuíne', 'Moamba', 'Namaacha',
    ],
  },
  {
    nome: 'Nampula',
    capital: 'Nampula',
    distritos: [
      'Nampula', 'Angoche', 'Erati', 'Ilha de Moçambique', 'Lalaua',
      'Larde', 'Liúpo', 'Malema', 'Meconta', 'Mecubúri',
      'Memba', 'Mogincual', 'Mogovolas', 'Moma', 'Monapo',
      'Mossuril', 'Muecate', 'Murrupula', 'Nacala-Porto', 'Nacala-a-Velha',
      'Nacaroa', 'Rapale', 'Ribáuè',
    ],
  },
  {
    nome: 'Niassa',
    capital: 'Lichinga',
    distritos: [
      'Lichinga', 'Chimbunila', 'Cuamba', 'Lago', 'Majune', 'Mandimba',
      'Marrupa', 'Maúa', 'Mavago', 'Mecanhelas', 'Mecula', 'Metarica',
      'Muembe', 'Ngauma', 'Nipepe', 'Sanga',
    ],
  },
  {
    nome: 'Sofala',
    capital: 'Beira',
    distritos: [
      'Beira', 'Búzi', 'Caia', 'Chemba', 'Cheringoma', 'Chibabava',
      'Dondo', 'Gorongosa', 'Machanga', 'Maríngue', 'Muanza', 'Nhamatanda',
    ],
  },
  {
    nome: 'Tete',
    capital: 'Tete',
    distritos: [
      'Tete', 'Angónia', 'Cahora Bassa', 'Changara', 'Chifunde',
      'Chiuta', 'Dôa', 'Macanga', 'Magoé', 'Marara', 'Marávia',
      'Moatize', 'Mutarara', 'Tsangano', 'Zumbo',
    ],
  },
  {
    nome: 'Zambézia',
    capital: 'Quelimane',
    distritos: [
      'Quelimane', 'Alto Molócuè', 'Chinde', 'Derre', 'Gilé', 'Gurué',
      'Ile', 'Inhassunge', 'Luabo', 'Lugela', 'Maganja da Costa',
      'Milange', 'Mocuba', 'Mocubela', 'Molumbo', 'Mopeia', 'Morrumbala',
      'Mulevala', 'Namacurra', 'Namarrói', 'Nicoadala', 'Pebane',
    ],
  },
];

// Função auxiliar: obter distritos de uma província
export const getDistritos = (nomeProvincia: string): string[] => {
  const provincia = PROVINCIAS_MOCAMBIQUE.find(p => p.nome === nomeProvincia);
  return provincia ? provincia.distritos : [];
};

// Lista simples de nomes de províncias
export const NOMES_PROVINCIAS = PROVINCIAS_MOCAMBIQUE.map(p => p.nome);