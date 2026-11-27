// Correct answers without instructional explanation advance automatically.
// Incorrect answers always remain visible for correction.
export function shouldAutoAdvance(correct,explanation){
 return correct===true && !String(explanation??'').trim();
}
export const CORRECT_ADVANCE_MS=850;
export const CEFR_LEVELS=['A1','A2','B1','B2','C1','C2'];
export const CEFR_COURSES=CEFR_LEVELS.map((level,i)=>({id:'draft-'+level.toLowerCase(),label:level+' · '+['入門','基礎','中級','中上級','上級','最上級'][i],short:level,group:'CEFR・レベル別',units:[{id:'all',label:'全語義・オリジナル教材β'}]}));

// Advanced is a second entry point, not a duplicated course or a separate record.
export function coursesForLearningRoute(catalog,group){
 if(group==='review')return catalog;
 return catalog.filter(c=>c.group===group||(group==='発展学習'&&['eiken1_master','draft-c1','draft-c2'].includes(c.id)));
}
