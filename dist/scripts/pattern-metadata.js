/** Designer-curated interpretations of the cultural sources, not random RGB palettes. */
const porcelain={background:'#F5EEDD',colors:['#245F95','#49AFC2','#B84D51','#D2A94F','#F1E1BE','#1B2F42'],derived:['#314F6B','#5B7270','#914B48','#88672E']};
const palettes={
  tower:{background:'#F2EADF',colors:['#7A7774','#A8A5A1','#B98D8D','#8A6B63','#C5A45D'],derived:['#514C49','#975E6A','#806339','#636A68']},
  porcelain,
  food:{background:'#F7EEE0',colors:['#95734F','#B5745B','#8A6652','#976530'],derived:['#756047','#9A6352','#58674F','#846531']},
  stone:{background:'#F1EDDF',colors:['#64665D','#8A7652','#5F7469','#8B6859'],derived:['#4C5951','#826749','#59736B','#805E50']},
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
};
export function patternMetadata(id) {
  const [shapeType,symmetry,directionality,dimensions,palette,preferredPatterns]=descriptors[id];
  return {shapeType,symmetry,directionality,dimensions,source:palette==='porcelain'?'Guangcai enamel ornament':id,svg:`./assets/pattern-icons/${id}.svg`,naturalPalette:palettes[palette],preferredPatterns};
}
