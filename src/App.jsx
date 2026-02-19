// src/App.jsx
import { Routes, Route } from 'react-router-dom';

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
  const { shipments, shipmentsLoading, shipmentsError, refetchShipments } = useAppContext();

  // Decide if we should show loading/empty state for protected area
  const showLoading = !shipments || shipments.length === 0;

  return (
    <Routes>
      {/* Public route – no sidebar, no loading check */}
      <Route path="/login" element={<Login />} />

      {/* Protected content – show loading if shipments are empty */}
      <Route
        path="/*"
        element={
          showLoading ? (
            // Full-screen loading/empty state when no shipments
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-50 to-white ">
              <LoadingStates
                isInitialLoading={shipmentsLoading}
                shipmentsLoading={shipmentsLoading}
                shipmentsError={shipmentsError}
                shipments={shipments}
                refetchShipments={refetchShipments}
                emptyIcon={<Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />}
                emptyTitle={
                  shipmentsLoading ? "Loading your shipments..." : "No Shipments Available"
                }
                emptyDescription={
                  shipmentsLoading
                    ? "Fetching data, please wait a moment..."
                    : "No shipment data available at the moment."
                }
                retryButtonText="Refresh Dashboard"
                className="w-full bg-gradient-to-br from-red-50 to-white p-6"
              />
            </div>
          ) : (
            // Normal layout with sidebar + content when data exists
            <div className="flex min-h-screen bg-background text-foreground">
              {/* Sidebar */}
              <div className="sticky top-0 z-20 self-start">
                <Sidebar />
              </div>

              {/* Main content */}
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