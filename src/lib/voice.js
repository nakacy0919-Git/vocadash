// A wake word is recognized only at the start of a final utterance.
export function extractWake(raw,mode='both') {
 const t=String(raw||'').trim();
 const m=t.match(/^(hey[\s,]+)?(?:voca(?:\s*dash)?|voka)\b[\s,.:!?-]*(.*)$/i);
 if(!m)return null;
 if(mode==='hey'&&!m[1]||mode==='short'&&m[1])return null;
 const command=m[2].trim();
 // Do not activate on the app name in a normal sentence.
 if(command&&parseVoice(command).kind==='unknown')return null;
 return {command};
}

export function parseVoice(raw) {
 const t=String(raw||'').toLowerCase().replace(/[“”"?.!,]/g,'').replace(/\s+/g,' ').trim().replace(/^(hey )?(voca dash|vocadash)[ ,:]*/,'').replace(/^(please |can you |could you )/,'');
 const rules=[
 ['stop',/^(stop listening|turn off voice|voice off|stop voice)$/],
 ['sleep',/^(go to sleep|stand by|standby|sleep mode|goodbye voca)$/],
 ['help',/^(help|show commands|what can i say)$/],
 ['home',/^(go home|home|back to dashboard)$/],
 ['close',/^(close (the )?universe|go back to (voca dash|vocadash)|close map|exit universe)$/],
 ['back',/^(go back|back|previous word)$/],
 ['next',/^(next( word| page| question)?|skip)$/],
 ['universe',/^(open|show|launch)( me)? (the |voca )?universe(?: (of|for) (.+))?$/],
 ['filter',/^(?:(show|expand|display|hide) (me )?(the )?)?(synonyms?|similar words|antonyms?|opposites?|word famil(?:y|ies)|derivatives?|collocations?|related words|all relations|all words|word forms|inflections)$/],
 ['focus',/^(focus on|center on|centre on|explore) (.+)$/],
 ['examples',/^(give me|show me|show|give|read) (?:some |the |an? |two |three |[23] )?(?:examples?|example sentences?)(?: (?:of|for) (.+))?$/],
 ['read',/^(read (it|the word|aloud)|pronounce( it)?|say it|read the (first|second|third) (sentence|example))$/],
 ['meaning',/^(show (me )?(the )?meaning|show definition|what does it mean|reveal)$/],
 ['quiz',/^(quiz me|start (a |the )?quiz|give me a quiz)$/],
 ['study',/^(start (study|learning)|study mode|flashcards)$/],
 ['sentence',/^(sentence mode|start example mode)$/],
 ['review',/^(review mode|start review)$/],
 ['list',/^(show (the )?list|list view)$/],
 ['map',/^(show (the )?map|map view)$/],
 ['images',/^(show|hide) images?$/],
 ['translation',/^(show|hide) (japanese|translation)$/],
 ['search',/^(?:show me|look up|find|search for|what does|what is|define|tell me about) (.+?)(?: mean)?$/],
 ];
 for(const [kind,re] of rules){const m=t.match(re);if(!m)continue;let value='';
 if(kind==='universe')value=m[5]||'';
 if(kind==='focus')value=m[2];
 if(kind==='search')value=m[1];
 if(kind==='examples')value=m[2]||'';
 if(kind==='read')value=m[4]||'';
 if(kind==='filter'){const x=m[4];value=/synonym|similar/.test(x)?'synonym':/antonym|opposite/.test(x)?'contrast':/famil|derivative/.test(x)?'family':/collocation/.test(x)?'collocation':/forms|inflections/.test(x)?'forms':/related/.test(x)?'related':'all';}
 if(kind==='images'||kind==='translation')value=m[1];
 return {kind,value};
 }
 return {kind:'unknown',value:t};
}
