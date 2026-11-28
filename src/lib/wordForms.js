import vLex from '../data/inflection-lexicon-v.json' with {type:'json'};
import nLex from '../data/inflection-lexicon-n.json' with {type:'json'};
import aLex from '../data/inflection-lexicon-a.json' with {type:'json'};
// Explicit educational forms. No guessed irregulars or unsupported comparative forms.
const rows=String.raw`be|is|was/were|been|being
beat|beats|beat|beaten|beating
become|becomes|became|become|becoming
begin|begins|began|begun|beginning
bend|bends|bent|bent|bending
bite|bites|bit|bitten|biting
blow|blows|blew|blown|blowing
break|breaks|broke|broken|breaking
bring|brings|brought|brought|bringing
build|builds|built|built|building
buy|buys|bought|bought|buying
catch|catches|caught|caught|catching
choose|chooses|chose|chosen|choosing
come|comes|came|come|coming
cost|costs|cost|cost|costing
cut|cuts|cut|cut|cutting
dig|digs|dug|dug|digging
do|does|did|done|doing
draw|draws|drew|drawn|drawing
drink|drinks|drank|drunk|drinking
drive|drives|drove|driven|driving
eat|eats|ate|eaten|eating
fall|falls|fell|fallen|falling
feed|feeds|fed|fed|feeding
feel|feels|felt|felt|feeling
fight|fights|fought|fought|fighting
find|finds|found|found|finding
fly|flies|flew|flown|flying
forget|forgets|forgot|forgotten|forgetting
forgive|forgives|forgave|forgiven|forgiving
freeze|freezes|froze|frozen|freezing
get|gets|got|got/gotten|getting
give|gives|gave|given|giving
go|goes|went|gone|going
grow|grows|grew|grown|growing
hang|hangs|hung|hung|hanging
have|has|had|had|having
hear|hears|heard|heard|hearing
hide|hides|hid|hidden|hiding
hit|hits|hit|hit|hitting
hold|holds|held|held|holding
hurt|hurts|hurt|hurt|hurting
keep|keeps|kept|kept|keeping
know|knows|knew|known|knowing
lay|lays|laid|laid|laying
lead|leads|led|led|leading
leave|leaves|left|left|leaving
lend|lends|lent|lent|lending
let|lets|let|let|letting
lie|lies|lay|lain|lying
lose|loses|lost|lost|losing
make|makes|made|made|making
mean|means|meant|meant|meaning
meet|meets|met|met|meeting
pay|pays|paid|paid|paying
put|puts|put|put|putting
read|reads|read|read|reading
ride|rides|rode|ridden|riding
ring|rings|rang|rung|ringing
rise|rises|rose|risen|rising
run|runs|ran|run|running
say|says|said|said|saying
see|sees|saw|seen|seeing
sell|sells|sold|sold|selling
send|sends|sent|sent|sending
set|sets|set|set|setting
shake|shakes|shook|shaken|shaking
shine|shines|shone/shined|shone/shined|shining
shoot|shoots|shot|shot|shooting
show|shows|showed|shown/showed|showing
shut|shuts|shut|shut|shutting
sing|sings|sang|sung|singing
sink|sinks|sank|sunk|sinking
sit|sits|sat|sat|sitting
sleep|sleeps|slept|slept|sleeping
speak|speaks|spoke|spoken|speaking
spend|spends|spent|spent|spending
stand|stands|stood|stood|standing
steal|steals|stole|stolen|stealing
swim|swims|swam|swum|swimming
take|takes|took|taken|taking
teach|teaches|taught|taught|teaching
tear|tears|tore|torn|tearing
tell|tells|told|told|telling
think|thinks|thought|thought|thinking
throw|throws|threw|thrown|throwing
understand|understands|understood|understood|understanding
wake|wakes|woke|woken|waking
wear|wears|wore|worn|wearing
win|wins|won|won|winning
write|writes|wrote|written|writing
bear|bears|bore|borne/born|bearing
creep|creeps|crept|crept|creeping
attract|attracts|attracted|attracted|attracting
mix|mixes|mixed|mixed|mixing
recommend|recommends|recommended|recommended|recommending
play|plays|played|played|playing
study|studies|studied|studied|studying
watch|watches|watched|watched|watching
like|likes|liked|liked|liking
love|loves|loved|loved|loving
enjoy|enjoys|enjoyed|enjoyed|enjoying
walk|walks|walked|walked|walking
talk|talks|talked|talked|talking
work|works|worked|worked|working
stop|stops|stopped|stopped|stopping
plan|plans|planned|planned|planning
travel|travels|traveled/travelled|traveled/travelled|traveling/travelling
live|lives|lived|lived|living
use|uses|used|used|using
try|tries|tried|tried|trying
carry|carries|carried|carried|carrying
visit|visits|visited|visited|visiting
open|opens|opened|opened|opening
close|closes|closed|closed|closing
help|helps|helped|helped|helping
want|wants|wanted|wanted|wanting
need|needs|needed|needed|needing
ask|asks|asked|asked|asking
answer|answers|answered|answered|answering
call|calls|called|called|calling
listen|listens|listened|listened|listening
learn|learns|learned/learnt|learned/learnt|learning
dance|dances|danced|danced|dancing
cook|cooks|cooked|cooked|cooking
clean|cleans|cleaned|cleaned|cleaning
wash|washes|washed|washed|washing
finish|finishes|finished|finished|finishing
start|starts|started|started|starting
stay|stays|stayed|stayed|staying
move|moves|moved|moved|moving
change|changes|changed|changed|changing
arrive|arrives|arrived|arrived|arriving
decide|decides|decided|decided|deciding
hope|hopes|hoped|hoped|hoping
believe|believes|believed|believed|believing
remember|remembers|remembered|remembered|remembering
explain|explains|explained|explained|explaining
practice|practices|practiced|practiced|practicing
miss|misses|missed|missed|missing
march|marches|marched|marched|marching
`;
const comparisons=String.raw`good|better|best
bad|worse|worst
far|farther/further|farthest/furthest
little|less|least
many|more|most
much|more|most
old|older|oldest
big|bigger|biggest
small|smaller|smallest
tall|taller|tallest
short|shorter|shortest
long|longer|longest
fast|faster|fastest
slow|slower|slowest
high|higher|highest
low|lower|lowest
hot|hotter|hottest
cold|colder|coldest
warm|warmer|warmest
cool|cooler|coolest
easy|easier|easiest
hard|harder|hardest
happy|happier|happiest
sad|sadder|saddest
busy|busier|busiest
heavy|heavier|heaviest
light|lighter|lightest
early|earlier|earliest
late|later|latest
young|younger|youngest
new|newer|newest
nice|nicer|nicest
large|larger|largest
thin|thinner|thinnest
thick|thicker|thickest
strong|stronger|strongest
weak|weaker|weakest
rich|richer|richest
poor|poorer|poorest
clean|cleaner|cleanest
dirty|dirtier|dirtiest
bright|brighter|brightest
dark|darker|darkest
cheap|cheaper|cheapest
expensive|more expensive|most expensive
beautiful|more beautiful|most beautiful
interesting|more interesting|most interesting
important|more important|most important
difficult|more difficult|most difficult
useful|more useful|most useful
careful|more careful|most careful
famous|more famous|most famous
popular|more popular|most popular
comfortable|more comfortable|most comfortable
exciting|more exciting|most exciting
dangerous|more dangerous|most dangerous
healthy|healthier|healthiest
friendly|friendlier/more friendly|friendliest/most friendly
funny|funnier|funniest
pretty|prettier|prettiest
angry|angrier|angriest
hungry|hungrier|hungriest
safe|safer|safest
simple|simpler|simplest
clever|cleverer/more clever|cleverest/most clever
quiet|quieter|quietest
loud|louder|loudest
wide|wider|widest
deep|deeper|deepest
near|nearer|nearest
clear|clearer|clearest
bright|brighter|brightest
`;
const plurals={child:"children",tooth:"teeth",foot:"feet",man:"men",woman:"women",person:"people",mouse:"mice",goose:"geese",life:"lives",leaf:"leaves",knife:"knives",wolf:"wolves",sheep:"sheep",deer:"deer",fish:"fish/fishes"};
const contractions={"aren't":"are not","can't":"cannot/can not","couldn't":"could not","didn't":"did not","doesn't":"does not","don't":"do not","hasn't":"has not","haven't":"have not","he's":"he is/he has","here's":"here is","how's":"how is/how has","I'd":"I would/I had","I'll":"I will","I'm":"I am","I've":"I have","isn't":"is not","it's":"it is/it has","let's":"let us","mustn't":"must not","she's":"she is/she has","that's":"that is/that has","there's":"there is/there has","they're":"they are","wasn't":"was not","we'll":"we will","we're":"we are","we've":"we have","weren't":"were not","what's":"what is/what has","when's":"when is/when has","where's":"where is/where has","who's":"who is/who has","won't":"will not","you'll":"you will","you're":"you are","you've":"you have"};
const index=s=>new Map(s.trim().split("\n").map(l=>{const [w,...v]=l.split("|");return [w,v]}));
const verbs=index(rows),adj=index(comparisons);
export const formKey=w=>String(w??"").normalize("NFKC").toLowerCase().replace(/[’‘]/g,"'").trim();

const set=s=>new Set(s.split(' ').filter(Boolean));
const own=(o,k)=>Object.hasOwn(o,k)?o[k]:undefined;
const extraVerbs=index(String.raw`arise|arises|arose|arisen|arising
awake|awakes|awoke|awoken|awaking
bind|binds|bound|bound|binding
bleed|bleeds|bled|bled|bleeding
breed|breeds|bred|bred|breeding
burst|bursts|burst|burst|bursting
cast|casts|cast|cast|casting
cling|clings|clung|clung|clinging
deal|deals|dealt|dealt|dealing
dwell|dwells|dwelt/dwelled|dwelt/dwelled|dwelling
flee|flees|fled|fled|fleeing
forbid|forbids|forbade|forbidden|forbidding
grind|grinds|ground|ground|grinding
kneel|kneels|knelt/kneeled|knelt/kneeled|kneeling
leap|leaps|leaped/leapt|leaped/leapt|leaping
light|lights|lit/lighted|lit/lighted|lighting
mislead|misleads|misled|misled|misleading
mistake|mistakes|mistook|mistaken|mistaking
misunderstand|misunderstands|misunderstood|misunderstood|misunderstanding
overcome|overcomes|overcame|overcome|overcoming
overtake|overtakes|overtook|overtaken|overtaking
quit|quits|quit/quitted|quit/quitted|quitting
redo|redoes|redid|redone|redoing
rebuild|rebuilds|rebuilt|rebuilt|rebuilding
rewrite|rewrites|rewrote|rewritten|rewriting
seek|seeks|sought|sought|seeking
sew|sews|sewed|sewn/sewed|sewing
shrink|shrinks|shrank/shrunk|shrunk|shrinking
slide|slides|slid|slid|sliding
smell|smells|smelled/smelt|smelled/smelt|smelling
sow|sows|sowed|sown/sowed|sowing
speed|speeds|sped/speeded|sped/speeded|speeding
spin|spins|spun|spun|spinning
spit|spits|spat/spit|spat/spit|spitting
split|splits|split|split|splitting
spread|spreads|spread|spread|spreading
spring|springs|sprang/sprung|sprung|springing
stick|sticks|stuck|stuck|sticking
sting|stings|stung|stung|stinging
stink|stinks|stank/stunk|stunk|stinking
stride|strides|strode|stridden|striding
strike|strikes|struck|struck/stricken|striking
strive|strives|strove/strived|striven/strived|striving
swear|swears|swore|sworn|swearing
sweep|sweeps|swept|swept|sweeping
swing|swings|swung|swung|swinging
tread|treads|trod|trodden/trod|treading
upset|upsets|upset|upset|upsetting
weave|weaves|wove/weaved|woven/weaved|weaving
weep|weeps|wept|wept|weeping
withdraw|withdraws|withdrew|withdrawn|withdrawing
withstand|withstands|withstood|withstood|withstanding
wring|wrings|wrung|wrung|wringing
`);
const advForms=index(String.raw`well|better|best
badly|worse|worst
far|farther/further|farthest/furthest
little|less|least
much|more|most
fast|faster|fastest
hard|harder|hardest
early|earlier|earliest
late|later|latest
soon|sooner|soonest
near|nearer|nearest
long|longer|longest
high|higher|highest
low|lower|lowest
slow|slower|slowest
quickly|more quickly|most quickly
slowly|more slowly|most slowly
carefully|more carefully|most carefully
easily|more easily|most easily
frequently|more frequently|most frequently
often|more often|most often
clearly|more clearly|most clearly
quietly|more quietly|most quietly
loudly|more loudly|most loudly
`);
const analyticAdj=set('accurate active attractive anxious available aware boring brave calm capable cautious certain cheerful comfortable confident convenient curious delicious effective efficient elegant enormous enthusiastic essential expensive flexible formal generous gentle grateful handsome helpful honest hopeful intelligent kind lively logical lovely modern nervous patient pleasant polite powerful practical precise proud reasonable reliable remarkable romantic serious sincere skillful skilled successful suitable surprised talented thankful thoughtful tired typical valuable willing worried');
const nonGradable=set('annual binary chemical daily dead digital double economic electrical electronic empty equal eternal former full human individual legal lunar main medical national nuclear official oral perfect physical political primary pregnant present previous rectangular round scientific separate single solar square triangular unique universal weekly wooden');
const nonGradableAdv=set('abroad again ago already almost also always anyway apart aside back beforehand certainly currently downstairs elsewhere enough ever forward here hence instead just later meanwhile never now once only otherwise perhaps rather recently seldom sometimes then there therefore today together tomorrow twice upstairs yesterday yet');
const mass=set('advice information furniture equipment homework luggage baggage research evidence knowledge progress traffic weather news software hardware machinery accommodation transportation scenery poetry music rice bread milk water sugar salt flour oxygen air electricity money cash employment work accommodation clothing assistance behavior behaviour leisure permission rubbish garbage trash dust sand gold silver wood plastic cheese butter meat beef pork coffee tea soup happiness courage patience honesty freedom peace health wealth poverty publicity safety access feedback damage harm fun');
const pluralOnly=set('scissors trousers pants jeans shorts clothes glasses binoculars surroundings outskirts belongings goods remains earnings savings congratulations thanks premises police cattle');
const nouns={...plurals,person:'people/persons',analysis:'analyses',basis:'bases',crisis:'crises',thesis:'theses',diagnosis:'diagnoses',hypothesis:'hypotheses',axis:'axes',criterion:'criteria',phenomenon:'phenomena',datum:'data',medium:'media/mediums',index:'indexes/indices',matrix:'matrices/matrixes',appendix:'appendices/appendixes',cactus:'cacti/cactuses',focus:'focuses/foci',formula:'formulas/formulae',radius:'radii/radiuses',syllabus:'syllabuses/syllabi',stimulus:'stimuli',curriculum:'curricula/curriculums',bacterium:'bacteria',alumnus:'alumni',alumna:'alumnae',nucleus:'nuclei',fungus:'fungi/funguses',vertebra:'vertebrae/vertebras',larva:'larvae/larvas',oasis:'oases',species:'species',series:'series',means:'means',aircraft:'aircraft',salmon:'salmon/salmons',trout:'trout/trouts',moose:'moose',ox:'oxen',loaf:'loaves',shelf:'shelves',half:'halves',self:'selves',calf:'calves',thief:'thieves',wife:'wives',scarf:'scarves/scarfs',hoof:'hooves/hoofs',hero:'heroes',potato:'potatoes',tomato:'tomatoes',echo:'echoes',photo:'photos',piano:'pianos',video:'videos',roof:'roofs',chief:'chiefs',belief:'beliefs',cliff:'cliffs',safe:'safes',proof:'proofs'};
const pronouns=[
 ['I','me','my','mine','myself'],['you','you','your','yours','yourself/yourselves'],['he','him','his','his','himself'],['she','her','her','hers','herself'],['it','it','its','','itself'],['we','us','our','ours','ourselves'],['they','them','their','theirs','themselves/themself'],['who','whom','whose','','']
];
const modals={can:'could',could:'can',may:'might',might:'may',shall:'should',should:'shall',will:'would',would:'will',must:'',ought:'',need:'',dare:''};
const source='UniMorph English・CC BY-SA 3.0';
const statusLabels={editorial:'独自整理済み',reference:'公開語形辞書に収録',conditional:'使用条件あり・要確認',review:'個別確認待ち',invariant:'通常は語形変化なし'};
const result=(status,forms,note='',origin='VocaDash 独自整理')=>({status,label:statusLabels[status],forms,note,source:origin});
const verbRows=(w,v)=>[['原形',w],['三人称単数',v[0]],['過去形',v[1]],['過去分詞',v[2]],['-ing形',v[3]]].filter(([,f])=>f);
const compareRows=(w,v)=>[['原級',w],['比較級',v[0]],['最上級',v[1]]].filter(([,f])=>f);
const validForms=(values,w)=>Array.isArray(values)?[...new Set(values.filter(x=>typeof x==='string'&&x.length<=100&&/^[A-Za-z][A-Za-z .'-]*$/.test(x)&&!/\b(?:countable|uncountable|plural|singular|comparative|superlative|obsolete|archaic)\b/i.test(x)))].join(' / '):'';
const posKey=p=>({v:'verb',n:'noun',adj:'adjective',a:'adjective',adv:'adverb',r:'adverb',pron:'pronoun',det:'determiner',prep:'preposition',conj:'conjunction',num:'numeral',aux:'auxiliary', 'modal verb':'modal','proper noun':'proper noun','proper name':'proper noun','phrasal verb':'phrasal verb'}[formKey(p).replace(/\.$/,'')]||formKey(p).replace(/\.$/,''));
const textFor=r=>String(r?.meaningJa||r?.meaning||'')+' '+String(r?.definitionEn||r?.definition||'');
export function formProfile(word,pos,record={}){
 const exact=String(word??'').normalize('NFKC').trim(),w=formKey(exact),p=posKey(pos),meaning=textFor(record);
 if(!w)return result('review',[],'見出し語がありません。');
 const base=[['見出し語',exact]];
 if(exact.includes('/')&&!exact.includes('://')){
  const variants=exact.split(/\s*\/\s*/).filter(Boolean);
  if(variants.length>1&&variants.length<=4){
   const ps=variants.map(x=>formProfile(x,p,record));
   return result(ps.every(x=>x.status==='invariant')?'invariant':'conditional',ps.flatMap((x,i)=>x.forms.map(([k,f])=>[variants[i]+' · '+k,f])), '併記された綴り・語形を個別に表示します。語義と綴りの対応を確認してください。',ps.some(x=>x.source.includes('UniMorph'))?source:'VocaDash 独自整理');
  }
 }
 if(p==='modal'||p==='auxiliary'&&Object.hasOwn(modals,w)||p==='verb'&&Object.hasOwn(modals,w)&&/助動詞|modal auxiliary/i.test(meaning)){
  return result('editorial',[['助動詞',exact],...(modals[w]?[['関連する助動詞',modals[w]]]:[])],'一般動詞の三単現・-ing形・過去分詞はありません。関連形は時制だけでなく丁寧さ・仮定等でも使われます。');
 }
 if(p==='verb'||p==='phrasal verb'||p==='auxiliary'){
  if(w==='having')return result('editorial',verbRows('have',verbs.get('have')),'having は have の -ing形です。');
  if(['am','is','are','was','were','been','being'].includes(w)&&p!=='phrasal verb')return formProfile('be','verb',record);
  if(w==='be')return result('editorial',[['原形','be'],['現在形','am / is / are'],['過去形','was / were'],['過去分詞','been'],['-ing形','being']],'主語と時制に応じて使い分けます。');
  if(w==='lie'){
   if(/うそ|嘘|虚偽|tell (?:a )?lie|untrue|false statement/i.test(meaning))return result('editorial',verbRows('lie',['lies','lied','lied','lying']),'「うそをつく」の語義。');
   if(/横たわ|横にな|位置する|recline|rest flat|be located|be situated/i.test(meaning))return result('editorial',verbRows('lie',verbs.get('lie')),'「横たわる・位置する」の語義。');
   return result('conditional',[...verbRows('lie',verbs.get('lie')).map(([k,f])=>['横たわる · '+k,f]),...verbRows('lie',['lies','lied','lied','lying']).map(([k,f])=>['うそをつく · '+k,f])],'語義ごとに活用が異なります。');
  }
  if(w==='hang'&&/絞首|処刑|execute|execution/i.test(meaning))return result('editorial',verbRows(w,['hangs','hanged','hanged','hanging']),'絞首刑にする語義。');
  if(w==='hang'&&!meaning)return result('conditional',verbRows(w,['hangs','hung / hanged','hung / hanged','hanging']),'hung は通常の「掛ける」、hanged は絞首刑の語義。');
  if(w==='bear')return result('conditional',verbRows(w,verbs.get(w)),'borne は一般の過去分詞、born は出生を表す用法。語義に応じて使います。');
  if(w==='read')return result('editorial',verbRows(w,verbs.get(w)),'原形・現在形 read は /riːd/、過去形・過去分詞 read は /red/ と発音します。');
  const v=verbs.get(w)||extraVerbs.get(w);
  if(v)return result('editorial',verbRows(exact,v));
  const fromSource=own(vLex,exact);
  if(fromSource){const forms=verbRows(exact,['s','past','pp','ing'].map(k=>validForms(fromSource[k],w)));if(forms.length===5)return result('reference',forms,'辞書収録形。語義・地域差・用法は未校閲です。',source);if(forms.length>1)return result('conditional',forms,'辞書に一部の語形のみ収録。残りは要確認。',source);}
  if(w.includes(' ')&&/^[a-z]+ /.test(w)){
   const i=exact.indexOf(' '),head=exact.slice(0,i),tail=exact.slice(i);
   const hp=formProfile(head,'verb',record);
   if(hp.forms.length>1&&hp.status!=='review'&&hp.status!=='invariant')return result('conditional',hp.forms.map(([k,f])=>[k,f.split(/\s*\/\s*/).map(x=>x+tail).join(' / ')]),'句動詞の先頭動詞を活用した候補です。語順・分離可能性・固定表現は要確認。',hp.source);
  }
  return result('review',[['原形',exact]],'辞書照合・例外確認が必要です。推測した活用は表示しません。');
 }
 if(p==='adjective'||p==='adverb'){
  const cmp=(p==='adjective'?adj:advForms).get(w);
  if(cmp)return result('editorial',compareRows(exact,cmp));
  if((p==='adjective'?nonGradable:nonGradableAdv).has(w))return result('conditional',[['原級',exact]],'通常の用法では程度比較をしない、または比較形を限定的に使う語です。文脈によって例外があります。');
  if(p==='adjective'){
   const a=own(aLex,exact),c=validForms(a?.comp,w),s=validForms(a?.sup,w);
   if(c&&s)return result('reference',compareRows(exact,[c,s]),'辞書収録の比較形。語義によって比較できない場合があります。',source);
   if(c||s)return result('conditional',compareRows(exact,[c,s]),'一部の比較形のみ辞書に収録。',source);
   if(analyticAdj.has(w))return result('editorial',compareRows(exact,['more '+exact,'most '+exact]),'程度を表す用法で使います。');
  }
  // Analytic comparison is only a conditional construction, not a verified word form.
  if(/^[a-z][a-z-]+$/i.test(exact)&&(p==='adjective'||w.endsWith('ly')))return result('conditional',[['原級',exact],['比較構文候補','more '+exact],['最上級構文候補','most '+exact]],'程度を表せる語義に限る一般的な構文候補です。この語で自然かどうか、-er/-est 形の有無は未確認。');
  return result('review',[['原級',exact]],'比較可能性を個別に確認する必要があります。');
 }
 if(p==='noun'||p==='proper noun'){
  if(p==='proper noun'||/^[A-Z]/.test(exact)&&/固有名詞|国名|月名|人名|地名|proper noun/i.test(meaning)||/^(?:[A-Z]{2,})$/.test(exact))return result('invariant',base,'固有名詞・略語は通常の可算名詞の複数化とは区別します。');
  if(pluralOnly.has(w))return result('conditional',[['通常の複数形',exact]],'通常は複数形で使用します。単数相当の表現や別語義は個別確認。');
  if(w==='May' || exact==='May')return result('invariant',base,'月名。');
  if(Object.hasOwn(nouns,w))return result('editorial',[['単数形',exact],['複数形',nouns[w]]],'可算の語義で使用する形です。');
  const n=validForms(own(nLex,exact)?.plural,w);
  if(mass.has(w)||/不可算|uncountable|mass noun/i.test(meaning))return result('conditional',[['通常の形',exact],...(n?[['可算の別用法での辞書形',n]]:[])],'通常は不可算として扱う語義があります。種類・個別の物などを指す場合に可算になることがあります。',n?source:'VocaDash 独自整理');
  if(n)return result('reference',[['単数形候補',exact],['複数形',n]],'可算の語義の場合。不可算・固有名詞・別の語義への適用は未確認。',source);
  return result('review',base,'可算性と複数形を個別確認。未確認の -s 形は自動表示しません。');
 }
 if(p==='pronoun'||p==='determiner'||p==='article'){
  if(exact==='IT')return result('invariant',base,'略語の語形は代名詞 it と区別します。');
  const match=pronouns.find(r=>r.some(f=>f.split('/').some(a=>formKey(a)===w)));
  if(match)return result('editorial',['主格','目的格','所有格','所有代名詞','再帰代名詞'].map((k,i)=>[k,match[i]]).filter(([,f])=>f),'代名詞の対応形。文中での役割に応じて使います。');
  if(['this','these','that','those'].includes(w))return result('editorial',[['単数形',w==='this'||w==='these'?'this':'that'],['複数形',w==='this'||w==='these'?'these':'those']]);
  if(w==='a'||w==='an')return result('editorial',[['子音の音の前','a'],['母音の音の前','an']],'綴りではなく発音に基づき選びます。');
  if(['many','much','few','little'].includes(w)){const v=w==='few'?['fewer','fewest']:w==='little'?['less','least']:['more','most'];return result('editorial',compareRows(exact,v));}
  return result('invariant',base,'この品詞では通常の活用・比較はありません。');
 }
 if(p==='numeral'){
  const cardinal=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety','hundred','thousand','million'];
  const ordinal=['zeroth','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth','twentieth','thirtieth','fortieth','fiftieth','sixtieth','seventieth','eightieth','ninetieth','hundredth','thousandth','millionth'];
  const i=Math.max(cardinal.indexOf(w),ordinal.indexOf(w));
  if(i>=0)return result('editorial',[['基数',cardinal[i]],['序数',ordinal[i]]],'基数と序数は関連する数表現です。');
 }
 if(['preposition','conjunction','interjection','phrase','idiom','numeral','particle','prefix','suffix','abbreviation','expression','proper noun'].includes(p))return result('invariant',base,'通常は独立した活用表を持たない品詞・表現です。');
 return result('review',base,'品詞表記または語形の適用範囲を要確認。');
}
export function wordForms(word,pos,record){return formProfile(word,pos,record).forms;}
export function formMatches(word,pos,q,record){const k=formKey(q);const profile=formProfile(word,pos,record);return profile.forms.some(([label,v])=>!label.includes('候補')&&v.split(/\s*\/\s*/).some(s=>formKey(s)===k));}
export const contractionForms=Object.entries(contractions).map(([short,full])=>({short,full}));
export function contractionMatch(word,q){const w=formKey(word),k=formKey(q);return contractionForms.some(({short,full})=>formKey(short)===k&&full.split("/").some(f=>formKey(f).split(" ").includes(w)));}
export function formCounts(){return {verbs:verbs.size+extraVerbs.size,adjectives:adj.size,adverbs:advForms.size,nouns:Object.keys(nouns).length,contractions:contractionForms.length};}
