// Optional offline conformance fixture generator. Install ts-fsrs@6.0.0 outside
// this repository, then pass its absolute dist/models/fsrs-6.mjs path as argv[2].
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {FSRS6Algorithm,FSRS6_DEFAULT_WEIGHTS,FSRS6_MODEL_BOUNDS}=await import(pathToFileURL(process.argv[2]).href);
const reference=new FSRS6Algorithm([...FSRS6_DEFAULT_WEIGHTS],true,FSRS6_MODEL_BOUNDS);
const cases=[];
for(const state of [null,...[.001,.212,2.3065,30,365].flatMap(stability=>[1,6.4,10].map(difficulty=>({stability,difficulty})))]){
 for(const elapsed of [0,1,7,90])for(const grade of [1,2,3,4]){
  cases.push({state,elapsed,grade,expected:reference.next_state(state,elapsed,grade)});
 }
}
writeFileSync('src/lib/fixtures/fsrs6-reference.json',JSON.stringify({source:'ts-fsrs@6.0.0',options:{enable_fuzz:false,enable_short_term:true},cases},null,2)+'\n');
console.log(`Generated ${cases.length} reference cases`);
