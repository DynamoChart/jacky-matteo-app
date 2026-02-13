// src/Sidebar.jsx
import { useState } from "react";
import { Button } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Megaphone, Settings,PackageSearch, User, CircleGauge, LogOut,Truck,Users,Building2,MapPin } from "lucide-react";

import logodd from "./newp.png";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <CircleGauge size={22} />, label: "Dashboard", path: "/" },
    { icon: <PackageSearch size={22} />, label: "Counter Requests", path: "/counter-requests" }, // added icon suggestion, change if you want
    { icon: <Truck size={22} />, label: "Shipments", path: "/shipments" },
    { icon: <Users size={22} />, label: "Users", path: "/users" },
    { icon: <Building2 size={22} />, label: "Suppliers", path: "/suppliers" },
    { icon: <MapPin size={22} />, label: "Locations", path: "/locations" },
  ];

  const menuItems2 = [
    { icon: <LogOut size={22} />, label: "Logout", path: "/filters" }, // kept as-is, even though path is unused
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login'; // or use navigate()
  };

  return (
    <aside 
      className={`h-screen bg-primary-soft  transition-[width] duration-300 ease-in-out flex flex-col pl-4 relative shadow-xl ${isOpen ? "w-50" : "w-15"}`}
      
    >
      {/* Toggle button */}
      <Button 
        isIconOnly 
        size="sm" 
        variant="solid" 
        className="absolute -right-3 top-3 rounded-full shadow-md z-50" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </Button>

      <div className="flex items-center justify-center mr-6">
        <img src={logodd} alt="picof" className={`${isOpen ? "w-30 h-10 mt-4":"w-0 h-10 mt-4"}`} />
      </div>

      {/* Menu items */}
      <div className="flex flex-col gap-1 mt-8 flex-grow overflow-hidden">
        {menuItems.map((item) => (
          <Button 
            key={item.path}
            variant={location.pathname === item.path ? "danger-soft" : "light"}
            color={location.pathname === item.path ? "primary" : "default"}
            className="flex items-center gap-0 w-[170px] justify-start h-10 border overflow-hidden"
            size="sm"
            onClick={() => navigate(item.path)}
          >
            <div className="min-w-[24px] flex justify-center">{item.icon}</div>
            <span className={`transition-opacity duration-300 whitespace-nowrap ${isOpen ? "opacity-100" : "opacity-0"}`}>
              {item.label}
            </span>
          </Button>
        ))}
      </div>

      <div className="mt-auto mb-4 ">
        <div className="flex flex-col gap-1 mt-18 flex-grow overflow-hidden">
          {menuItems2.map((item) => (
            <Button 
              key={item.path}
            
              className="flex items-center gap-0 w-[170px] justify-start h-10 border overflow-hidden bg-warning-soft text-gray-900"
              size="sm"
              onClick={handleLogout}
            >
              <div className="min-w-[24px] flex justify-center">{item.icon}</div>
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isOpen ? "opacity-100" : "opacity-0"}`}>
                {item.label}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}