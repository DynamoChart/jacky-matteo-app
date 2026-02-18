import React from 'react'
import Dashboard from './Dashboard';
import DashTable from './components/DashTable';
import Chartsi from "./components/Chartsi";
import { useAppContext } from "./context/DataContext";

export default function Dash() {
  const { shipments } = useAppContext();
  return (
    <div>
       {/* <Chartsi/> */}
   <Dashboard/>
   <DashTable/>
  
    </div>
  )
}
