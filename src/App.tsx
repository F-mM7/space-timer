import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import TimerPage from './pages/TimerPage';
import ScramblePage from './pages/ScramblePage';
import WhiteYellowUtilitiesPage from './pages/WhiteYellowUtilitiesPage';
import UDCenterSolverCheckPage from './pages/UDCenterSolverCheckPage';
import UDCenterScramblePage from './pages/UDCenterScramblePage';
import SolutionCheckPage from './pages/SolutionCheckPage';
import MinimalHashCheckPage from './pages/MinimalHashCheckPage';

function App() {
  return (
    <BrowserRouter basename="/space-timer">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/scramble" element={<ScramblePage />} />
        <Route path="/white-yellow-utilities" element={<WhiteYellowUtilitiesPage />} />
        <Route path="/ud-center-solver-check" element={<UDCenterSolverCheckPage />} />
        <Route path="/ud-center-scramble" element={<UDCenterScramblePage />} />
        <Route path="/solution-check" element={<SolutionCheckPage />} />
        <Route path="/minimal-hash-check" element={<MinimalHashCheckPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
