import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Diagnostico from './pages/Diagnostico';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="diagnostico" element={<Diagnostico />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
