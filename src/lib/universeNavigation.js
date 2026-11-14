// Resolve tapped nodes even when the related term has no authored head yet.
export function centerFromRelation(node,lookup,index){
 if(!node?.word)return null;
 const key=node.word.trim().toLowerCase(),authored=lookup(key),local=index.get(key);
 return {...node,...authored,...local,word:local?.word||authored?.word||node.word,meaning:authored?.meaning||local?.meaning||node.meaning||''};
}
