#!/usr/bin/env python3
"""Audit the 84 active VocaDash draft batches against CEFR-J Wordlist v1.6.
No source vocabulary or existing classification is modified."""
import argparse, collections, hashlib, io, json, pathlib, re, unicodedata, urllib.request, zipfile
import xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
URL="https://www.cefr-j.org/data/CEFRJ_wordlist_ver1.6.zip"
CITATION="The CEFR-J Wordlist Version 1.6. Compiled by Yukio Tono, Tokyo University of Foreign Studies. https://www.cefr-j.org/download.html"
def norm(s): return re.sub(r"\s+"," ",unicodedata.normalize("NFKC",s).replace("’","'").replace("‘","'").strip())
def variants(s): return {norm(x) for x in [s,*s.split("/")] if norm(x)}
def pos(s):
    s=norm(s).lower()
    return {"n":"noun","v":"verb","adj":"adjective","adv":"adverb","prep":"preposition","pron":"pronoun","conj":"conjunction","det":"determiner","interj":"interjection"}.get(s,s)
def xlsx_rows(raw):
    ns={"m":"http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    def xml(z,p): return ET.fromstring(z.read(p))
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        strings=[]
        if "xl/sharedStrings.xml" in z.namelist():
            strings=["".join(t.text or "" for t in si.findall(".//m:t",ns)) for si in xml(z,"xl/sharedStrings.xml").findall("m:si",ns)]
        wb=xml(z,"xl/workbook.xml")
        rels={x.attrib["Id"]:x.attrib["Target"] for x in xml(z,"xl/_rels/workbook.xml.rels")}
        for sheet in wb.findall(".//m:sheet",ns):
            target=rels[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
            path=target.lstrip("/") if target.startswith("/") else "xl/"+target
            rows=[]
            for row in xml(z,path).findall(".//m:row",ns):
                cells={}
                for cell in row.findall("m:c",ns):
                    col=re.match(r"[A-Z]+",cell.attrib["r"]).group()
                    v=cell.find("m:v",ns); val=v.text if v is not None else ""
                    if cell.attrib.get("t")=="s": val=strings[int(val)]
                    elif cell.attrib.get("t")=="inlineStr": val="".join(t.text or "" for t in cell.findall(".//m:t",ns))
                    cells[col]=val or ""
                rows.append(cells)
            for i,r in enumerate(rows[:10]):
                h={norm(v).lower():k for k,v in r.items()}
                if {"headword","pos","cefr"}<=h.keys():
                    data=[(x.get(h["headword"],"").strip(),x.get(h["pos"],"").strip(),x.get(h["cefr"],"").strip()) for x in rows[i+1:] if x.get(h["headword"],"").strip() and x.get(h["cefr"],"").strip() in {"A1","A2","B1","B2"}]
                    if len(data)==7801:return data
    raise ValueError("Cannot locate 7801-row ALL sheet")
def load(raw):
    if not raw.startswith(b"PK"):raise ValueError("Expected ZIP or XLSX")
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names=[n for n in z.namelist() if n.lower().endswith(".xlsx") and not pathlib.Path(n).name.startswith("~$") and "__MACOSX" not in n]
        for n in names:
            try:return xlsx_rows(z.read(n))
            except ValueError:pass
    return xlsx_rows(raw)
def main():
    p=argparse.ArgumentParser();p.add_argument("--source",type=pathlib.Path);p.add_argument("--output",type=pathlib.Path,default=pathlib.Path("/tmp/vocadash-cefrj-audit.json"));a=p.parse_args()
    if a.source:raw=a.source.read_bytes()
    else:
        with urllib.request.urlopen(urllib.request.Request(URL,headers={"User-Agent":"VocaDash lexical audit/1.0"}),timeout=25) as r:raw=r.read(15000000)
    official=load(raw)
    levels=collections.Counter(l for w,t,l in official)
    assert len(official)==7801 and len({w for w,t,l in official})==6868 and levels=={"A1":1166,"A2":1411,"B1":2445,"B2":2779}, (len(official),levels)
    base=ROOT/"data/vocabulary-drafts"; manifest=json.loads((base/"manifest.json").read_text())
    records=[r for f in manifest["batchFiles"] for r in json.loads((base/f).read_text())["records"]]
    words=collections.defaultdict(list)
    for r in records:words[r["wordId"]].append(r)
    idx=collections.defaultdict(set);fold=collections.defaultdict(set)
    for i,(w,t,l) in enumerate(official):
        for v in variants(w):idx[v].add(i);fold[v.casefold()].add(i)
    matched=set();matched_pos=set();results=[];counts=collections.Counter();cross=collections.Counter();by_level=collections.Counter()
    for wid,rr in sorted(words.items()):
        keys=set().union(*(variants(r["headword"]) for r in rr))
        hits=set().union(*(idx[k] for k in keys))
        case_only=set().union(*(fold[k.casefold()] for k in keys))-hits
        matched.update(hits)
        senses=[]
        for r in rr:
            sh=set().union(*(idx[k] for k in variants(r["headword"])))
            # Exact POS only; no automatic fuzzy or multi-POS equivalence.
            ph={i for i in sh if pos(official[i][1])==pos(r.get("cefrJPartOfSpeech") or r.get("partOfSpeech",""))}
            matched_pos.update(ph)
            ll=sorted({official[i][2] for i in ph})
            old=r.get("cefrHeadword","")
            state="pos_match" if ph else "headword_only" if sh else "case_review" if case_only else "not_listed"
            counts[state]+=1
            if ph:
                for l in ll:cross[(old,l)]+=1
                if old in ll:counts["level_agrees"]+=1
                else:counts["level_differs"]+=1
                if len(ll)>1:counts["multiple_levels"]+=1
            senses.append({"senseId":r.get("senseId"),"partOfSpeech":r.get("partOfSpeech"),"existingCEFR":old,"CEFRJLevels":ll,"status":state})
        status="pos_match" if any(s["status"]=="pos_match" for s in senses) else "headword_only" if hits else "case_review" if case_only else "not_listed"
        by_level[status]+=1
        results.append({"wordId":wid,"headword":rr[0]["headword"],"status":status,"senses":senses,"officialCandidates":[{"headword":official[i][0],"pos":official[i][1],"level":official[i][2]} for i in sorted(hits)],"caseReview":[official[i] for i in sorted(case_only)]})
    source_words={w for w,t,l in official}; found_words={official[i][0] for i in matched}
    summary={"source":CITATION,"sourceURL":URL,"sourceSHA256":hashlib.sha256(raw).hexdigest(),"officialRows":len(official),"officialHeadwords":len(source_words),"activeBatches":len(manifest["batchFiles"]),"vocadashWordIDs":len(words),"vocadashSenses":len(records),"wordStatuses":dict(by_level),"senseStatuses":dict(counts),"officialHeadwordsMatched":len(found_words),"officialHeadwordsMissing":len(source_words-found_words),"officialRowsHeadwordMatched":len(matched),"officialRowsPosMatched":len(matched_pos),"officialByLevel":{l:{"rows":levels[l],"headwordMatched":sum(official[i][2]==l for i in matched),"posMatched":sum(official[i][2]==l for i in matched_pos)} for l in ["A1","A2","B1","B2"]},"levelMatrix":{x:{y:cross[(x,y)] for y in ["A1","A2","B1","B2"]} for x in ["A1","A2","B1","B2","C1","C2"]}}
    a.output.write_text(json.dumps({"summary":summary,"words":results,"missingOfficialHeadwords":sorted(source_words-found_words),"missingOfficialRows":[official[i] for i in range(len(official)) if i not in matched_pos]},ensure_ascii=False,indent=2))
    print("CEFRJ_AUDIT "+json.dumps(summary,ensure_ascii=False))
if __name__=="__main__":main()

