import React, {lazy, Suspense} from 'react';
import ReactDOM from 'react-dom/client';
const VocaDash = lazy(() => import('./VocaDash.jsx'));
import Classroom, {ClassroomLearning} from './classroom/Classroom.jsx';
const params = new URLSearchParams(location.search);
const Screen = params.has('classroom') || params.has('join') ? Classroom : params.has('assignment') ? ClassroomLearning : VocaDash;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Suspense fallback={<main className="classroom">読み込んでいます…</main>}><Screen /></Suspense></React.StrictMode>
);
