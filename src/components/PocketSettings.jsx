import React,{useEffect,useRef} from 'react';
export default function PocketSettings({title,onClose,children}){
 const ref=useRef(null);
 useEffect(()=>{const d=ref.current;d.showModal();return()=>{if(d.open)d.close();};},[]);
 return <dialog ref={ref} className="vs-pocket-settings" aria-label={title} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}} onKeyDown={e=>e.stopPropagation()}><section><header><span/><div><h2>{title}</h2><button type="button" onClick={onClose} aria-label="閉じる">×</button></div></header><div className="vs-pocket-settings-body">{children}</div><button type="button" className="vs-pocket-done" onClick={onClose}>学習に戻る</button></section></dialog>;
}
