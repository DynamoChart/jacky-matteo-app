// src/App.jsx
import { Routes, Route, Navigate  } from 'react-router-dom';

import Sidebar from './Sidebar';
import Shipments from './Shipments';
import Login from './pages/Login';
import Dash from './Dash';
import Counter from './Counter';
import Users from './Users';
import Suppliers from './Suppliers';
import Locations from './Locations';
import { CalendarDays, Package } from "lucide-react";
import { useAppContext } from "./context/DataContext";
import LoadingStates from './components/LoadingStates';

function App() {
  const { shipments, shipmentsLoading, shipmentsError, refetchShipments,currentUser } = useAppContext();

  // Decide if we should show loading/empty state for protected area
  const showLoading = !shipments || shipments.length === 0;
console.log("currentUser",currentUser)
  return (
    <Routes>
    {/* Login Route */}
    <Route
      path="/login"
      element={
        currentUser ? <Navigate to="/" replace /> : <Login />
      }
    />
  
    {/* Protected Routes */}
    <Route
      path="/*"
      element={
        !currentUser ? (
          <Navigate to="/login" replace />
        ) : (
          <div className="flex min-h-screen bg-background text-foreground">
            <div className="sticky top-0 z-20 self-start">
              <Sidebar />
            </div>
  
            <main className="flex-1 overflow-y-auto">
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
        )
      }
    />
  </Routes>
  );
}

export default App;