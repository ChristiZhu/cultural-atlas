/** Original project collection, not visitor testimonials or invented identities. */
import {createHash} from 'node:crypto';
import {culturalIcons} from '../dist/scripts/library-state.js';
import {generatePattern} from '../dist/scripts/pattern-generator.js';
import {validateSubmission} from './pattern-schema.mjs';

// Credit each composition to its project series; never imply these are real visitors.
const collection=[
 ['guangzhou','Skyline','canton-tower,five-rams','The slender tower and grounded ram forms create a rhythm of height and weight. Open space gives each silhouette room to breathe.'],
 ['guangzhou','Porcelain Garden','porcelain-1,porcelain-3,porcelain-7','A garden assembled from Guangcai motifs. Small details sit between larger shapes, like flowers growing through a patterned lattice.'],
 ['guangzhou','Morning Table','har-gow,porcelain-5','Dumpling curves soften the porcelain motif. A warm background brings these two Guangzhou references into a gentle, repeating conversation.'],
 ['beijing','Swallow Flight','beijing-kite','The swallow kite becomes a repeated flight path. Alternating directions make the still shapes feel as though they are catching a breeze.'],
 ['beijing','Rabbit Parade','beijing-rabbit,beijing-kite','Lord Rabbit and the swallow kite share a playful rhythm. The smaller motifs leave the rabbit silhouette easy to recognize.'],
 ['beijing','Sweet Circles','lvdagun,beijing-rabbit','Rounded food shapes and a character motif make an unexpectedly lively pair. The colors keep their different outlines connected.'],
 ['shanghai','Painted Neighbourhood','jinshan-1,jinshan-2,jinshan-4','Three Jinshan painting motifs form a small visual neighbourhood. Changes in scale let the details support the larger shapes.'],
 ['shanghai','Feast Rhythm','eight-treasure-duck,jinshan-3','The duck motif anchors the composition while a painting detail fills the pauses. Repetition turns a food reference into an ornamental rhythm.'],
 ['shanghai','Small Windows','jinshan-2,jinshan-3','Two painting motifs repeat like small windows onto the same scene. A restrained palette brings their contrasting shapes together.'],
 ['dehong','Woven Paths','jingpo-1,jingpo-2,jingpo-3','Brocade motifs trace intersecting paths across the surface. The pattern keeps a clear rhythm while giving each shape a different role.'],
 ['dehong','Bamboo Intervals','bamboo-rice,jingpo-2','Bamboo rice provides the long lines, with a smaller brocade motif between them. The spacing is as much a part of the pattern as the icons.'],
 ['dehong','Thread Notes','jingpo-3','A single brocade motif reveals different relationships when repeated. Quiet background color helps the edges and internal details remain visible.'],
 ['taiyuan','Paper Echoes','paper-cutting','Paper-cutting shapes repeat with generous breathing room. The negative spaces become a second pattern between the colored forms.'],
 ['taiyuan','Noodle Rows','youmian','The curved noodle form becomes a small repeating unit. Different directions bring movement to an otherwise simple arrangement.'],
 ['taiyuan','Fold and Curve','paper-cutting,youmian','Angular paper details meet soft food curves. Their contrasting silhouettes create a rhythm without needing extra decoration.'],
 ['all','Across the Table','har-gow,lvdagun,bamboo-rice','Three food motifs from different cities meet in one pattern. Scale and color connect them while preserving their distinctive shapes.'],
 ['all','Craft Conversations','porcelain-6,jingpo-1,paper-cutting','Porcelain, brocade and paper cutting share a surface. The composition explores how different craft details can support one another.'],
 ['all','City Threads','canton-tower,beijing-kite,jinshan-4','A tower, a kite and a painted motif connect three city references. The largest shape sets the rhythm; the others create small moments between.'],
];

export function projectSubmissions(){
 return collection.map(([city,title,ids,reflection],index)=>{
  const icons=ids.split(',').map(id=>culturalIcons.find(icon=>icon.id===id));
  let patternData;
  for(let attempt=0;attempt<40;attempt++){
   try{patternData=generatePattern(icons,{seed:20261019+index*101+attempt,colorMode:['harmonious','authentic','vivid','surprise'][index%4]});break;}catch(error){if(attempt===39)throw error;}
  }
  const hash=createHash('sha256').update('atlas-project-collection-v1:'+title).digest('hex');
  const requestId=`${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
  const input={requestId,consent:true,creatorName:'Atlas Studio · '+title,reflection,patternData:{...patternData,selectedCity:city}};
  validateSubmission(input);return input;
 });
}
