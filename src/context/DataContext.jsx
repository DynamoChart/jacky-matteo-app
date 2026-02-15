// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // ── Auth related ───────────────────────────────────────
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Current logged-in user (most important – contains role)
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);

  // Derived admin flag – easier & safer to use in components
  const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);

  // All users (admin only – we'll guard it)
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // Shipments
  const [shipments, setShipments] = useState([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentsError, setShipmentsError] = useState(null);


    // All suppliers (fetched for admin/supplier roles)
    const [allSuppliers, setAllSuppliers] = useState([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [suppliersError, setSuppliersError] = useState(null);

    // All locations (fetched for admin/location roles)
    const [allLocations, setAllLocations] = useState([]);
    const [locationsLoading, setLocationsLoading] = useState(false);
    const [locationsError, setLocationsError] = useState(null);


  // ── Load token on mount ────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setShipments([]);
      setAllUsers([]);
    }
  }, []);

  // ── Fetch current user (always first priority) ─────────
  const fetchCurrentUser = useCallback(async () => {
    if (!token) return;

    setUserLoading(true);
    setUserError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`User fetch failed: ${res.status} – ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (data?.user) {
        setCurrentUser(data.user);
      } else {
        throw new Error('Invalid user response format');
      }
    } catch (err) {
      console.error('Fetch current user error:', err);
      setUserError(err.message || 'Failed to load user profile');
      setCurrentUser(null);
    } finally {
      setUserLoading(false);
    }
  }, [token]);

  // ── Fetch shipments ────────────────────────────────────
  const fetchShipments = useCallback(async () => {
    if (!token) return;

    setShipmentsLoading(true);
    setShipmentsError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shipment/getAll`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setShipments(Array.isArray(data) ? data : data?.shipments || data?.data || []);
    } catch (err) {
      console.error('Fetch shipments error:', err);
      setShipmentsError(err.message || 'Failed to load shipments');
    } finally {
      setShipmentsLoading(false);
    }
  }, [token]);

  // ── Fetch all users (only makes sense for admin) ───────
  const fetchAllUsers = useCallback(async () => {
    if (!token || !isAdmin) return;

    setUsersLoading(true);
    setUsersError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/getAll`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const usersArray = Array.isArray(data) ? data : data?.users || data?.data || [];
      setAllUsers(usersArray);
    } catch (err) {
      console.error('Fetch all users error:', err);
      setUsersError(err.message || 'Failed to load users list');
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [token, isAdmin]);


    // ── Fetch all suppliers ─────────────────────────────────
    const fetchAllSuppliers = useCallback(async () => {
      if (!token) return;
  
      setSuppliersLoading(true);
      setSuppliersError(null);
  
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/supplier/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });
  
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Suppliers fetch failed: ${res.status} – ${text.substring(0, 200)}`);
        }
  
        const data = await res.json();
        // API returns array directly or { suppliers: [...] }
        const suppliersArray = Array.isArray(data) ? data : data?.suppliers || data?.data || [];
        setAllSuppliers(suppliersArray);
      } catch (err) {
        console.error('Fetch suppliers error:', err);
        setSuppliersError(err.message || 'Failed to load suppliers');
        setAllSuppliers([]);
      } finally {
        setSuppliersLoading(false);
      }
    }, [token]);

    // ── Fetch all locations ─────────────────────────────────
    const fetchAllLocations = useCallback(async () => {
      if (!token) return;
  
      setLocationsLoading(true);
      setLocationsError(null);
  
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/location/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });
  
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Locations fetch failed: ${res.status} – ${text.substring(0, 200)}`);
        }
  
        const data = await res.json();
        // API returns array directly or { locations: [...] }
        const locationsArray = Array.isArray(data) ? data : data?.locations || data?.data || [];
        setAllLocations(locationsArray);
      } catch (err) {
        console.error('Fetch locations error:', err);
        setLocationsError(err.message || 'Failed to load locations');
        setAllLocations([]);
      } finally {
        setLocationsLoading(false);
      }
    }, [token]);



  // ── Sequence fetches: user → then others ───────────────
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // 1. Always fetch current user first
    fetchCurrentUser();

    // 2. We don't wait with await here – instead we react to currentUser changes below
  }, [isAuthenticated, token, fetchCurrentUser]);

  // 3. Fetch secondary data AFTER currentUser is known
  useEffect(() => {
    if (!currentUser || userLoading) return;

    fetchShipments();

    // Only admins should try to load the full user list
    if (currentUser.role === 'admin') {
      fetchAllUsers();
      fetchAllSuppliers();
      fetchAllLocations();
    }
  }, [currentUser, userLoading, fetchShipments, fetchAllUsers]);
console.log("currentUser",currentUser)
  // ── Auth actions ───────────────────────────────────────
  const login = (newToken, userData = null) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    if (userData) setCurrentUser(userData); // optional – if login returns user
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShipments([]);
    setAllSuppliers([]);
    setAllLocations([]);
    setSuppliersError(null);
    setAllUsers([]);
    setShipmentsError(null);
    setLocationsError(null);
    setUsersError(null);
    setUserError(null);
  };

  // ── Expose everything ──────────────────────────────────
  const value = {
    token,
    isAuthenticated,
    isAdmin,                     // ← very useful in components
    login,
    logout,

    // Current user
    currentUser,
    userLoading,
    userError,

    // All users (only populated for admins)
    allUsers,
    usersLoading,
    usersError,
    refetchAllUsers: fetchAllUsers,

    // Shipments
    shipments,
    shipmentsLoading,
    shipmentsError,
    refetchShipments: fetchShipments,

    allSuppliers,
    suppliersLoading,
    suppliersError,
    refetchAllSuppliers: fetchAllSuppliers,

    allLocations,
    locationsLoading,
    locationsError,
    refetchAllLocations: fetchAllLocations,


    optimisticUpdateShipment: (shipmentId, newDeliveryDate) => {
      setShipments((prev) =>
        prev.map((s) =>
          s._id === shipmentId ? { ...s, delivery_date: newDeliveryDate } : s
        )
      );
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}