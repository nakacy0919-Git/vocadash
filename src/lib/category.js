// Original starter lessons. Grade/entrance labels are pedagogical recommendations, not official lists.
const rows=[
  [
    "1",
    "d",
    "v",
    "arrive",
    "到着する",
    "We arrive at school before eight.",
    "私たちは8時前に学校に着く。"
  ],
  [
    "1",
    "d",
    "n",
    "journey",
    "旅",
    "The journey takes two hours.",
    "その旅には2時間かかる。"
  ],
  [
    "1",
    "d",
    "a",
    "comfortable",
    "快適な",
    "These shoes are comfortable.",
    "この靴は快適だ。"
  ],
  [
    "1",
    "d",
    "r",
    "usually",
    "普段は",
    "I usually walk to school.",
    "私は普段歩いて学校に行く。"
  ],
  [
    "1",
    "e",
    "v",
    "protect",
    "守る",
    "We protect the trees near our school.",
    "私たちは学校の近くの木々を守る。"
  ],
  [
    "1",
    "e",
    "n",
    "forest",
    "森林",
    "A deer lives in the forest.",
    "シカが森に住んでいる。"
  ],
  [
    "1",
    "e",
    "a",
    "natural",
    "自然の",
    "The island has natural hot springs.",
    "その島には天然の温泉がある。"
  ],
  [
    "1",
    "h",
    "v",
    "exercise",
    "運動する",
    "I exercise before breakfast.",
    "私は朝食前に運動する。"
  ],
  [
    "1",
    "h",
    "n",
    "health",
    "健康",
    "Sleep is important for our health.",
    "睡眠は私たちの健康に重要だ。"
  ],
  [
    "1",
    "h",
    "a",
    "healthy",
    "健康的な",
    "We prepare a healthy lunch.",
    "私たちは健康的な昼食を用意する。"
  ],
  [
    "1",
    "l",
    "v",
    "practice",
    "練習する",
    "They practice English every day.",
    "彼らは毎日英語を練習する。"
  ],
  [
    "1",
    "l",
    "n",
    "subject",
    "教科",
    "Science is my favorite subject.",
    "理科は私の好きな教科だ。"
  ],
  [
    "1",
    "l",
    "a",
    "difficult",
    "難しい",
    "The last question is difficult.",
    "最後の問題は難しい。"
  ],
  [
    "1",
    "l",
    "r",
    "carefully",
    "注意深く",
    "Read the instructions carefully.",
    "指示を注意深く読みなさい。"
  ],
  [
    "1",
    "s",
    "v",
    "share",
    "共有する",
    "We share our ideas with the class.",
    "私たちは考えをクラスで共有する。"
  ],
  [
    "1",
    "s",
    "n",
    "community",
    "地域社会",
    "Our community holds a summer festival.",
    "私たちの地域社会は夏祭りを開く。"
  ],
  [
    "1",
    "s",
    "a",
    "safe",
    "安全な",
    "This crossing is safe for children.",
    "この横断歩道は子供にとって安全だ。"
  ],
  [
    "1",
    "t",
    "n",
    "machine",
    "機械",
    "The machine cuts paper into strips.",
    "その機械は紙を細長く切る。"
  ],
  [
    "1",
    "t",
    "v",
    "connect",
    "つなぐ",
    "Connect the cable to the computer.",
    "ケーブルをコンピューターにつなぎなさい。"
  ],
  [
    "1",
    "t",
    "a",
    "useful",
    "役に立つ",
    "This map is useful for visitors.",
    "この地図は来訪者に役立つ。"
  ],
  [
    "2",
    "d",
    "v",
    "prepare",
    "準備する",
    "We prepare our bags the night before.",
    "前の晩にかばんを準備する。"
  ],
  [
    "2",
    "d",
    "n",
    "habit",
    "習慣",
    "Reading before bed is a good habit.",
    "就寝前の読書はよい習慣だ。"
  ],
  [
    "2",
    "d",
    "a",
    "convenient",
    "便利な",
    "The station is in a convenient location.",
    "駅は便利な場所にある。"
  ],
  [
    "2",
    "d",
    "r",
    "gradually",
    "徐々に",
    "The sky gradually became brighter.",
    "空は徐々に明るくなった。"
  ],
  [
    "2",
    "e",
    "v",
    "reduce",
    "減らす",
    "We can reduce waste by reusing bottles.",
    "瓶を再利用してごみを減らせる。"
  ],
  [
    "2",
    "e",
    "n",
    "resource",
    "資源",
    "Fresh water is a valuable resource.",
    "淡水は貴重な資源だ。"
  ],
  [
    "2",
    "e",
    "a",
    "renewable",
    "再生可能な",
    "Wind is a renewable source of energy.",
    "風は再生可能なエネルギー源だ。"
  ],
  [
    "2",
    "h",
    "v",
    "recover",
    "回復する",
    "The runner needs time to recover.",
    "走者には回復する時間が必要だ。"
  ],
  [
    "2",
    "h",
    "n",
    "nutrition",
    "栄養",
    "The course introduces basic nutrition.",
    "講座は栄養の基礎を紹介する。"
  ],
  [
    "2",
    "h",
    "a",
    "physical",
    "身体の",
    "Walking is a form of physical activity.",
    "歩くことは身体活動の一種だ。"
  ],
  [
    "2",
    "l",
    "v",
    "improve",
    "改善する・上達させる",
    "Daily reading can improve vocabulary.",
    "毎日の読書は語彙力を向上させ得る。"
  ],
  [
    "2",
    "l",
    "n",
    "knowledge",
    "知識",
    "The project requires knowledge of geography.",
    "計画には地理の知識が必要だ。"
  ],
  [
    "2",
    "l",
    "a",
    "independent",
    "自立した",
    "The task encourages independent learning.",
    "課題は自立した学習を促す。"
  ],
  [
    "2",
    "l",
    "r",
    "actively",
    "積極的に",
    "Students actively participate in discussions.",
    "生徒は議論に積極的に参加する。"
  ],
  [
    "2",
    "s",
    "v",
    "participate",
    "参加する",
    "Many students participate in the event.",
    "多くの生徒が行事に参加する。"
  ],
  [
    "2",
    "s",
    "n",
    "culture",
    "文化",
    "Food is an important part of culture.",
    "食は文化の重要な一部だ。"
  ],
  [
    "2",
    "s",
    "a",
    "local",
    "地元の",
    "We visited a local market.",
    "地元の市場を訪れた。"
  ],
  [
    "2",
    "t",
    "n",
    "device",
    "装置",
    "The device measures room temperature.",
    "装置は室温を測定する。"
  ],
  [
    "2",
    "t",
    "v",
    "measure",
    "測定する",
    "Scientists measure the depth of the lake.",
    "科学者は湖の深さを測定する。"
  ],
  [
    "2",
    "t",
    "a",
    "digital",
    "デジタルの",
    "The library offers digital books.",
    "図書館は電子書籍を提供する。"
  ],
  [
    "3",
    "d",
    "v",
    "adapt",
    "適応する",
    "New students adapt to unfamiliar routines.",
    "新入生は慣れない日課に適応する。"
  ],
  [
    "3",
    "d",
    "n",
    "priority",
    "優先事項",
    "Safety is our highest priority.",
    "安全が私たちの最優先事項だ。"
  ],
  [
    "3",
    "d",
    "a",
    "reliable",
    "信頼できる",
    "We need a reliable internet connection.",
    "信頼できるネット接続が必要だ。"
  ],
  [
    "3",
    "d",
    "r",
    "frequently",
    "頻繁に",
    "The buses stop frequently along this route.",
    "バスはこの経路で頻繁に停車する。"
  ],
  [
    "3",
    "e",
    "v",
    "conserve",
    "保全する・節約する",
    "The town takes steps to conserve water.",
    "町は水を節約する対策を取る。"
  ],
  [
    "3",
    "e",
    "n",
    "biodiversity",
    "生物多様性",
    "The wetland supports rich biodiversity.",
    "湿地は豊かな生物多様性を支える。"
  ],
  [
    "3",
    "e",
    "a",
    "sustainable",
    "持続可能な",
    "The farm uses sustainable methods.",
    "農場は持続可能な方法を用いる。"
  ],
  [
    "3",
    "h",
    "v",
    "prevent",
    "予防する",
    "Simple precautions can prevent accidents.",
    "簡単な予防措置は事故を防ぎ得る。"
  ],
  [
    "3",
    "h",
    "n",
    "symptom",
    "症状",
    "A persistent cough may be a symptom of illness.",
    "長引く咳は病気の症状かもしれない。"
  ],
  [
    "3",
    "h",
    "a",
    "mental",
    "精神の",
    "The seminar focuses on mental health.",
    "研修は心の健康に焦点を当てる。"
  ],
  [
    "3",
    "l",
    "v",
    "analyze",
    "分析する",
    "Students analyze the results of the survey.",
    "生徒は調査結果を分析する。"
  ],
  [
    "3",
    "l",
    "n",
    "evidence",
    "証拠・根拠",
    "The claim requires stronger evidence.",
    "その主張にはより強い根拠が必要だ。"
  ],
  [
    "3",
    "l",
    "a",
    "academic",
    "学術的な",
    "She developed her academic writing skills.",
    "彼女は学術的な文章力を伸ばした。"
  ],
  [
    "3",
    "l",
    "r",
    "effectively",
    "効果的に",
    "The team communicates effectively online.",
    "チームはオンラインで効果的に意思疎通する。"
  ],
  [
    "3",
    "s",
    "v",
    "cooperate",
    "協力する",
    "Local organizations cooperate to support families.",
    "地元の団体は家族を支援するため協力する。"
  ],
  [
    "3",
    "s",
    "n",
    "diversity",
    "多様性",
    "The festival celebrates cultural diversity.",
    "祭りは文化の多様性をたたえる。"
  ],
  [
    "3",
    "s",
    "a",
    "inclusive",
    "包摂的な",
    "The club aims to create an inclusive environment.",
    "部は誰もが参加できる環境を目指す。"
  ],
  [
    "3",
    "t",
    "n",
    "innovation",
    "革新",
    "Innovation can transform public transport.",
    "革新は公共交通を変革し得る。"
  ],
  [
    "3",
    "t",
    "v",
    "develop",
    "開発する",
    "Engineers develop more efficient batteries.",
    "技術者はより効率的な電池を開発する。"
  ],
  [
    "3",
    "t",
    "a",
    "efficient",
    "効率的な",
    "The new system is more efficient.",
    "新しい制度はより効率的だ。"
  ],
  [
    "4",
    "d",
    "v",
    "allocate",
    "配分する",
    "We allocate time to each task.",
    "各作業に時間を配分する。"
  ],
  [
    "4",
    "d",
    "n",
    "constraint",
    "制約",
    "Limited space is a major constraint.",
    "限られた空間は大きな制約だ。"
  ],
  [
    "4",
    "d",
    "a",
    "feasible",
    "実現可能な",
    "The committee chose a feasible plan.",
    "委員会は実現可能な計画を選んだ。"
  ],
  [
    "4",
    "d",
    "r",
    "consistently",
    "一貫して",
    "The team consistently meets its deadlines.",
    "チームは一貫して締切を守る。"
  ],
  [
    "4",
    "e",
    "v",
    "mitigate",
    "軽減する",
    "Urban trees help mitigate extreme heat.",
    "街路樹は極端な暑さを軽減する。"
  ],
  [
    "4",
    "e",
    "n",
    "ecosystem",
    "生態系",
    "The river ecosystem supports many species.",
    "川の生態系は多くの種を支える。"
  ],
  [
    "4",
    "e",
    "a",
    "vulnerable",
    "脆弱な",
    "Coral reefs are vulnerable to warming oceans.",
    "サンゴ礁は海洋温暖化に弱い。"
  ],
  [
    "4",
    "h",
    "v",
    "diagnose",
    "診断する",
    "Doctors diagnose illnesses using several sources of information.",
    "医師は複数の情報に基づいて病気を診断する。"
  ],
  [
    "4",
    "h",
    "n",
    "immunity",
    "免疫",
    "The lesson explores how immunity develops.",
    "授業は免疫が発達する仕組みを探る。"
  ],
  [
    "4",
    "h",
    "a",
    "chronic",
    "慢性の",
    "The report examines access to care for chronic conditions.",
    "報告書は慢性疾患の医療アクセスを調べる。"
  ],
  [
    "4",
    "l",
    "v",
    "evaluate",
    "評価する",
    "Students evaluate the reliability of their sources.",
    "生徒は情報源の信頼性を評価する。"
  ],
  [
    "4",
    "l",
    "n",
    "hypothesis",
    "仮説",
    "The experiment tests a specific hypothesis.",
    "実験は特定の仮説を検証する。"
  ],
  [
    "4",
    "l",
    "a",
    "critical",
    "批判的な",
    "The course emphasizes critical thinking.",
    "講座は批判的思考を重視する。"
  ],
  [
    "4",
    "l",
    "r",
    "precisely",
    "正確に",
    "The researcher defines each term precisely.",
    "研究者は各用語を正確に定義する。"
  ],
  [
    "4",
    "s",
    "v",
    "advocate",
    "提唱する",
    "Volunteers advocate equal access to education.",
    "ボランティアは平等な教育アクセスを提唱する。"
  ],
  [
    "4",
    "s",
    "n",
    "inequality",
    "不平等",
    "The study investigates economic inequality.",
    "研究は経済的不平等を調べる。"
  ],
  [
    "4",
    "s",
    "a",
    "equitable",
    "公正な",
    "The proposal seeks an equitable distribution of resources.",
    "提案は資源の公正な配分を目指す。"
  ],
  [
    "4",
    "t",
    "n",
    "algorithm",
    "アルゴリズム",
    "The algorithm sorts the results by date.",
    "アルゴリズムは日付順に結果を並べる。"
  ],
  [
    "4",
    "t",
    "v",
    "simulate",
    "模擬実験する",
    "Researchers simulate the motion of the spacecraft.",
    "研究者は宇宙船の動きを模擬実験する。"
  ],
  [
    "4",
    "t",
    "a",
    "automated",
    "自動化された",
    "An automated system checks the entries.",
    "自動化された制度が入力内容を確認する。"
  ],
  [
    "5",
    "d",
    "v",
    "prioritize",
    "優先する",
    "Managers prioritize urgent requests.",
    "管理者は緊急の依頼を優先する。"
  ],
  [
    "5",
    "d",
    "n",
    "resilience",
    "回復力",
    "The experience strengthened her resilience.",
    "その経験は彼女の回復力を強めた。"
  ],
  [
    "5",
    "d",
    "a",
    "pragmatic",
    "実際的な",
    "They adopted a pragmatic approach to the problem.",
    "彼らは問題に実際的な方法で取り組んだ。"
  ],
  [
    "5",
    "d",
    "r",
    "deliberately",
    "意図的に",
    "The artist deliberately left the canvas unfinished.",
    "芸術家は意図的に絵を未完成のままにした。"
  ],
  [
    "5",
    "e",
    "v",
    "preserve",
    "保存する・保護する",
    "The park works to preserve native habitats.",
    "公園は在来の生息地を保護するよう努める。"
  ],
  [
    "5",
    "e",
    "n",
    "degradation",
    "劣化",
    "The report describes soil degradation in the region.",
    "報告書は地域の土壌劣化を述べる。"
  ],
  [
    "5",
    "e",
    "a",
    "irreversible",
    "不可逆的な",
    "Some environmental damage is irreversible.",
    "環境損傷の中には元に戻せないものがある。"
  ],
  [
    "5",
    "h",
    "v",
    "alleviate",
    "軽減する",
    "The program aims to alleviate stress among caregivers.",
    "計画は介護者のストレス軽減を目指す。"
  ],
  [
    "5",
    "h",
    "n",
    "prevalence",
    "有病率・普及度",
    "Researchers estimate the prevalence of the condition.",
    "研究者はその疾患の有病率を推定する。"
  ],
  [
    "5",
    "h",
    "a",
    "preventive",
    "予防的な",
    "The hospital invests in preventive care.",
    "病院は予防医療に投資する。"
  ],
  [
    "5",
    "l",
    "v",
    "substantiate",
    "裏付ける",
    "The author uses data to substantiate her claim.",
    "著者は主張を裏付けるためデータを使う。"
  ],
  [
    "5",
    "l",
    "n",
    "inference",
    "推論",
    "The conclusion rests on a reasonable inference.",
    "結論は妥当な推論に基づく。"
  ],
  [
    "5",
    "l",
    "a",
    "coherent",
    "一貫性のある",
    "The essay presents a coherent argument.",
    "随筆は一貫した主張を提示する。"
  ],
  [
    "5",
    "l",
    "r",
    "explicitly",
    "明示的に",
    "The guidelines explicitly prohibit plagiarism.",
    "指針は盗用を明示的に禁止している。"
  ],
  [
    "5",
    "s",
    "v",
    "reconcile",
    "調和させる",
    "The mediator seeks to reconcile opposing views.",
    "仲介者は対立する意見を調和させようとする。"
  ],
  [
    "5",
    "s",
    "n",
    "accountability",
    "説明責任",
    "The new policy emphasizes public accountability.",
    "新方針は公的な説明責任を重視する。"
  ],
  [
    "5",
    "s",
    "a",
    "impartial",
    "公平な",
    "The judges must remain impartial.",
    "審査員は公平でなければならない。"
  ],
  [
    "5",
    "t",
    "n",
    "infrastructure",
    "基盤設備",
    "Reliable infrastructure supports digital learning.",
    "信頼できる基盤設備はデジタル学習を支える。"
  ],
  [
    "5",
    "t",
    "v",
    "optimize",
    "最適化する",
    "The team seeks to optimize energy consumption.",
    "チームはエネルギー消費の最適化を目指す。"
  ],
  [
    "5",
    "t",
    "a",
    "robust",
    "堅牢な",
    "The system needs a robust backup mechanism.",
    "制度には堅牢なバックアップ機構が必要だ。"
  ]
];
export const CATEGORY_WORDS=rows.map(([level,topic,pos,word,meaning,en,ja])=>({level:Number(level),topic,pos,word,meaning,en,ja}));
const levels=[['middle','高校受験・中学基礎'],['high1','高校1年・基礎'],['high2','高校2年・標準'],['high3','高校3年・大学受験'],['advanced','大学受験・発展']];
const topics=[['d','生活・日常'],['e','環境・自然'],['h','健康・医療'],['l','教育・学習'],['s','社会・文化'],['t','科学・技術']];
const parts=[['v','動詞'],['n','名詞'],['a','形容詞'],['r','副詞']];
const items=new Map();
function create(id,label,group,words){const units=[];for(let i=0;i<words.length;i+=10){const unitId=String(i/10+1),chunk=words.slice(i,i+10);units.push({id:unitId,label:'Unit '+unitId+' · '+chunk.length+'語'});items.set(id+':'+unitId,chunk.map(w=>{const others=CATEGORY_WORDS.filter(x=>x.pos===w.pos&&x.topic!==w.topic&&x.word!==w.word).sort((a,b)=>Math.abs(a.level-w.level)-Math.abs(b.level-w.level));const choices=[w.word,...others.slice(0,3).map(x=>x.word)];const at=w.en.toLowerCase().indexOf(w.word.toLowerCase());return {id:w.word,learningId:'category:'+w.word,targetWord:w.word,meaning:w.meaning,english:w.en.slice(0,at)+'________'+w.en.slice(at+w.word.length),japanese:w.ja,choices,correct:0,explanation:'語義：'+w.meaning};}));}return {id,label,short:label,group,units};}
export const CATEGORY_CATALOG=[...levels.map(([id,label],i)=>create('level_'+id,label,'学年・入試',CATEGORY_WORDS.filter(w=>w.level===i+1))),...topics.map(([id,label])=>create('topic_'+id,label,'ジャンル別',CATEGORY_WORDS.filter(w=>w.topic===id))),...parts.map(([id,label])=>create('pos_'+id,label,'品詞別',CATEGORY_WORDS.filter(w=>w.pos===id)))];
export function categoryUnit(courseId,unitId){return items.get(courseId+':'+unitId)||null;}
export function categoryCourse(courseId){return /^(level|topic|pos)_/.test(courseId);}
