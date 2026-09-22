/** Designer-curated interpretations of the cultural sources, not random RGB palettes. */
const porcelain={background:'#F5EEDD',colors:['#245F95','#49AFC2','#B84D51','#D2A94F','#F1E1BE','#1B2F42'],derived:['#314F6B','#5B7270','#914B48','#88672E']};
const palettes={
  tower:{background:'#F2EADF',colors:['#7A7774','#A8A5A1','#B98D8D','#8A6B63','#C5A45D'],derived:['#514C49','#975E6A','#806339','#636A68']},
  porcelain,
  food:{background:'#F7EEE0',colors:['#95734F','#B5745B','#8A6652','#976530'],derived:['#756047','#9A6352','#58674F','#846531']},
  stone:{background:'#F1EDDF',colors:['#64665D','#8A7652','#5F7469','#8B6859'],derived:['#4C5951','#826749','#59736B','#805E50']},
  folk:{background:'#FAECD8',colors:['#A73430','#245F95','#296B57','#98712E','#533C35'],derived:['#914B48','#314F6B','#5B7270']},
  textile:{background:'#F3E9D2',colors:['#A73430','#193C67','#296B57','#94702B','#533C35'],derived:['#914B48','#314F6B','#59736B']},
};
const descriptors={
  'canton-tower':['vertical','vertical','strong',[31,78],'tower',['half-drop','diamond','grid','four-way']],
  'porcelain-1':['radial','radial','none',[75,75],'porcelain',['diamond','four-way','grid','scatter']],
  'porcelain-2':['radial','radial','none',[70,70],'porcelain',['diamond','grid','scatter','four-way']],
  'porcelain-3':['radial','radial','none',[58,65],'porcelain',['diamond','grid','four-way']],
  'porcelain-4':['curved','vertical','weak',[67,45],'porcelain',['diagonal','four-way','half-drop']],
  'porcelain-5':['horizontal','vertical','weak',[70,45],'porcelain',['half-drop','diagonal','four-way']],
  'porcelain-6':['vertical','vertical','strong',[57,59],'porcelain',['grid','half-drop','diamond']],
  'har-gow':['horizontal','vertical','weak',[75,43],'food',['half-drop','diagonal','scatter']],
  'five-rams':['irregular','asymmetric','strong',[33,65.5],'stone',['scatter','diagonal','half-drop']],
  'porcelain-7':['radial','radial','none',[66.5,68],'porcelain',['diamond','grid','four-way']],
  'eight-treasure-duck':['vertical','asymmetric','strong',[39.5,63.5],'food',['half-drop','diagonal','scatter']],
  'lvdagun':['horizontal','asymmetric','weak',[66,59],'food',['half-drop','grid','diagonal']],
  'beijing-kite':['vertical','vertical','strong',[65.75,67.5],'folk',['diamond','grid','half-drop']],
  'youmian':['horizontal','asymmetric','weak',[64,49],'food',['half-drop','grid','scatter']],
  'paper-cutting':['radial','radial','none',[65,65],'folk',['four-way','diamond','grid']],
  'bamboo-rice':['horizontal','asymmetric','strong',[75,55.25],'food',['diagonal','half-drop','scatter']],
  'jingpo-1':['radial','radial','none',[68.25,68.25],'textile',['diamond','grid','four-way']],
  'jingpo-2':['radial','radial','none',[57,57],'textile',['diamond','grid','four-way']],
  'jingpo-3':['vertical','vertical','strong',[33.25,61.5],'textile',['half-drop','grid','diagonal']],
  'jinshan-1':['horizontal','asymmetric','strong',[66.5,61.5],'folk',['diagonal','scatter','half-drop']],
  'jinshan-2':['vertical','asymmetric','strong',[68.25,43.5],'folk',['diagonal','half-drop','four-way']],
  'jinshan-3':['vertical','vertical','strong',[59.5,50.75],'folk',['grid','half-drop','diamond']],
  'jinshan-4':['horizontal','asymmetric','strong',[66.75,32],'folk',['diagonal','scatter','half-drop']],
  'beijing-rabbit':['vertical','vertical','strong',[57,71],'folk',['grid','half-drop','diamond']],
};
export function patternMetadata(id) {
  const [shapeType,symmetry,directionality,dimensions,palette,preferredPatterns]=descriptors[id];
  return {shapeType,symmetry,directionality,dimensions,source:palette==='porcelain'?'Guangcai enamel ornament':id,svg:`./assets/pattern-icons/${id}.svg`,naturalPalette:palettes[palette],preferredPatterns};
}
