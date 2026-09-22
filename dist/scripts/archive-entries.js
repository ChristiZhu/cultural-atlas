import { iconDisplayName } from './icon-names.js';

/** Source item keys stay identical to the existing map artwork. */
export const newArchiveEntries = [
  {
    "id": "eight-treasure-duck",
    "city": "shanghai",
    "item": "Eight Treasure Duck"
  },
  {
    "id": "jinshan-painting",
    "city": "shanghai",
    "item": "Jinshan Folk Painting"
  },
  {
    "id": "lvdagun",
    "city": "beijing",
    "item": "Ludagun"
  },
  {
    "id": "beijing-kite",
    "city": "beijing",
    "item": "Swallow Kite"
  },
  {
    "id": "youmian",
    "city": "taiyuan",
    "item": "Youmian Kaolaolao"
  },
  {
    "id": "bamboo-rice",
    "city": "dehong",
    "item": "Bamboo Rice"
  },
  {
    "id": "paper-cutting",
    "city": "taiyuan",
    "item": "Paper Cutting"
  },
  {
    "id": "jingpo-brocade",
    "city": "dehong",
    "item": "Jingpo Brocade"
  }
];

const existingEntries = [
  { id:'canton', city:'guangzhou', item:'Canton Tower' },
  { id:'porcelain', city:'guangzhou', item:'Guangcai Porcelain' },
  { id:'shrimp', city:'guangzhou', item:'Shrimp Dumpling' },
  { id:'five-rams', city:'guangzhou', item:'Five Rams Sculpture' },
];
export const archivesByCity = Object.freeze(
  [...existingEntries, ...newArchiveEntries].reduce((cities, entry) => {
    (cities[entry.city] ??= {})[entry.item] = entry.id;
    return cities;
  }, {})
);
for (const entries of Object.values(archivesByCity)) Object.freeze(entries);

const pageSlots = [
  ['FRONT_COVER', 'front', 'Front cover'],
  ['SPREAD_01_02', '01-02', 'Pages 01–02'],
  ['SPREAD_03_04', '03-04', 'Pages 03–04'],
  ['SPREAD_05_06', '05-06', 'Pages 05–06'],
  ['SPREAD_07_08', '07-08', 'Pages 07–08'],
  ['BACK_COVER', 'back', 'Back cover'],
];
export const newArchiveCatalog = Object.fromEntries(newArchiveEntries.map(({id,city,item}) => [
  id, { title:iconDisplayName(city,item), pages:pageSlots.map(([key,suffix,label]) => ({
    key, file:`${id}-${suffix}.svg`, label,
  })) },
]));
