// src/App.jsx
import { Routes, Route } from 'react-router-dom';

import Sidebar from './Sidebar';
import Shipments from './Shipments';
import Login from './pages/Login';           // ← adjust path if needed
import ProtectedRoute from './components/ProtectedRoute';
import Dash from './Dash';
import Counter from './Counter';
import Users from './Users';
// Placeholder pages (replace with real ones later)
import Suppliers from './Suppliers';
import Locations from './Locations';



function App() {
  return (
    <Routes>
      {/* Public route – no sidebar */}
      <Route path="/login" element={<Login />} />

      {/* All protected routes – show sidebar + content */}
      <Route element={<ProtectedRoute />}>
      <Route
  path="/*"
  element={
    <div className="flex min-h-screen bg-background text-foreground">

      {/* Sidebar stays visible & pinned while main scrolls */}
      <div className="sticky top-0 z-20 self-start">   {/* ← key addition */}
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto">   {/* overflow-y-auto is clearer */}
        <Routes>
          <Route path="/" element={<Dash />} />
          <Route path="/counter-requests" element={<Counter />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/users" element={<Users />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="*" element={<Dash />} />
        </Routes>
      </main>

    </div>
  }
/>
      </Route>
    </Routes>
  );
}

export default App;