import React, {lazy, Suspense} from 'react';
import ReactDOM from 'react-dom/client';
const VocaDash = lazy(() => import('./VocaDash.jsx'));
import Classroom, {ClassroomLearning} from './classroom/Classroom.jsx';
const params = new URLSearchParams(location.search);
const classroomRequested = params.has('classroom') || params.has('join') || params.has('assignment');
const classroomEnabled = import.meta.env.DEV || import.meta.env.VITE_CLASSROOM_ENABLED === 'true';
function ClassroomPending(){return <main className="classroom auth"><p className="eyebrow">VOCADASH CLASSROOM</p><h1>Classroomは公開準備中です</h1><p>学校の学習記録を安全に保存するため、アカウント作成・ログインはまだ利用できません。</p><a href="/">通常の語彙学習へ</a></main>;}
const Screen = classroomRequested && !classroomEnabled ? ClassroomPending : params.has('classroom') || params.has('join') ? Classroom : params.has('assignment') ? ClassroomLearning : VocaDash;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Suspense fallback={<main className="classroom">読み込んでいます…</main>}><Screen /></Suspense></React.StrictMode>
);
