/** Display names supplied by the user from 文化地图资料整理1.xlsx.
 * Keys are existing artwork subjects, not replacements for application IDs.
 */
export const iconNames = Object.freeze({
  guangzhou: Object.freeze({
    'Canton Tower': 'Canton Tower',
    'Five Rams Sculpture': 'Five Rams Sculpture',
    'Shrimp Dumpling': 'Har Gow (Steamed Shrimp Dumplings)',
    'Siu Mai': 'Cantonese Siu Mai',
    'Guangcai Porcelain': 'Guangzhou Painted Porcelain',
    'Guangning Jade Carving': 'Guangzhou Jade Carving',
  }),
  beijing: Object.freeze({
    'Temple of Heaven': 'Temple of Heaven',
    'Forbidden City': 'Forbidden City',
    'Ludagun': 'Rolling Donkey Rice Cake',
    'Peking Duck': 'Beijing Roast Duck',
    'Lord Rabbit': 'Beijing Rabbit God',
    'Swallow Kite': 'Beijing Kite Making',
  }),
  shanghai: Object.freeze({
    'Oriental Pearl Tower': 'Oriental Pearl Tower',
    'Yuyuan Garden': 'Yuyuan Garden',
    'Eight Treasure Duck': 'Eight Treasure Duck',
    'Shengjian Bao': 'Pan-Fried Pork Buns',
    'Jinshan Folk Painting': 'Jinshan Peasant Painting',
    'Xuhang Straw Weaving': 'Xuhang Straw Weaving',
  }),
  taiyuan: Object.freeze({
    'Yongzuo Temple': 'Yongzuo Temple (Twin Pagoda Temple)',
    'Chunyang Palace': 'Chunyang Palace',
    'Youmian Kaolaolao': 'Youmian Kaolao Lao (Rolled Oat Noodles)',
    'Knife-cut Noodles': 'Shanxi Knife-cut Noodles',
    'Paper Cutting': 'Taiyuan Paper Cutting',
    'Door Gods': 'Woodblock New Year Prints',
  }),
  dehong: Object.freeze({
    'Menghuan Golden Pagoda': 'Menghuan Great Golden Pagoda',
    'Jiele Golden Pagoda': 'Jiele Golden Pagoda',
    'Sapie': 'Sapia / Bitter Herbal Dipping Sauce',
    'Bamboo Rice': 'Bamboo Tube Rice',
    'Jingpo Brocade': 'Jingpo Brocade Weaving',
    // Jingpo Knife is not verified as Achang Husa Knife Forging; retain its name.
  }),
});
export function iconDisplayName(cityId, subject) {
  return iconNames[cityId]?.[subject] ?? subject;
}
