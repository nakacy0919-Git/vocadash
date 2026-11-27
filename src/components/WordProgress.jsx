import React from 'react';
import {formatAnswerTime} from '../lib/courseLibrary.js';
import './WordProgress.css';
export function ProgressRing({value=0,unknown=false,large=false,label='定着度（推定）',tone}){
 const n=Math.max(0,Math.min(100,Number(value)||0)),color=tone||(unknown?'#cfc3a9':n>=80?'#527b47':n>=50?'#78964e':n>=25?'#bc9349':'#bc765c');
 return <span className={'vd-progress-ring'+(large?' is-large':'')} role="img" aria-label={label+' '+(unknown?'未計測':n+'%')}><svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="32" fill="#fffaf0" stroke="#e4dac5" strokeWidth="6"/>{!unknown&&n>0&&<circle cx="38" cy="38" r="32" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" pathLength="100" strokeDasharray={n+' 100'} transform="rotate(-90 38 38)"/>}</svg><span className="vd-ring-center" style={{color}}><b>{unknown?'—':n}{!unknown&&<i>%</i>}</b><small>{large?'定着度':'定着'}</small></span></span>;
}
export function WordProgress({data}){
 return <span className="vd-word-progress"><span className="vd-word-progress-text"><span className="vd-progress-status" data-status={data.status}>{data.status} · {data.attempts}回</span><span className="vd-progress-time"><span aria-hidden="true">◷ </span>直近正解 <b>{formatAnswerTime(data.correctMs)}</b></span></span><ProgressRing value={data.percent} unknown={!data.attempts}/></span>;
}
export function CourseProgress({data}){
 return <div className="vd-course-progress" aria-label="教材の学習進捗"><ProgressRing value={data.average} unknown={!data.learned} large/><div className="vd-course-coverage"><span><b>学習進捗</b><strong>{data.learned} / {data.total} 語</strong></span><div className="vd-course-track" role="progressbar" aria-label="学習済み語数" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.coverage}><span style={{width:data.coverage+'%'}}/></div><small>定着度の計測済み {data.coverage}%</small></div><div className="vd-course-stat"><small>定着した語</small><b>{data.mastered}<i> 語</i></b></div><div className="vd-course-stat"><small>未計測</small><b>{data.unlearned}<i> 語</i></b></div><div className="vd-course-stat"><small>平均正解時間</small><b>{formatAnswerTime(data.averageCorrectMs)}</b><small>{data.timedWords}語の直近正解</small></div></div>;
}
