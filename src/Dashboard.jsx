// src/Dashboard.jsx
import { useState,useRef,useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ClockCheck } from "lucide-react";
import { Button, Chip,Modal,Card } from "@heroui/react";
import DashTable from "./components/DashTable";
import KpiDashboard from "./components/KpiDashboard";
import { CalendarDays, Package } from "lucide-react";
import { GridView } from "./components/GridView";
import {
  format,
  startOfMonth,
  endOfMonth,
  addDays,
  startOfWeek,
  endOfWeek,
  parseISO,
  isSameDay,
} from "date-fns";
import { useAppContext } from "./context/DataContext";
import MonthlyCalendar from "./components/MonthlyCalendar";
import WeeklyCalendar from "./components/WeeklyCalendar";
import DailyCalendar from "./components/DailyCalendar";
import LoadingStates from "./components/LoadingStates";

import { notification } from "antd";
import "antd/dist/antd.css";

export default function Dashboard() {
  const { shipments, shipmentsLoading,optimisticUpdateShipment, shipmentsError, token, user, refetchShipments,currentUser } =
    useAppContext();

  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const triggerRef = useRef(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  useEffect(() => {
    const refreshData = async () => {
      setIsInitialLoading(true);
      try {
        await refetchShipments();
      } catch (err) {
        console.error("Dashboard initial refetch failed:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
  
    refreshData();
  }, [refetchShipments]);
  // Handler for day click
  const handleCalendarDayClick = (date) => {
    setSelectedCalendarDate(date);
    if (triggerRef.current) {
      triggerRef.current.click();
    }
  };
  const canDrag = true;

  // Days calculation
  const getDays = () => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      const days = [];
      let d = start;
      while (d <= end) {
        days.push(d);
        d = addDays(d, 1);
      }
      return days;
    }
    if (view === "week") {
      const start = startOfWeek(currentDate);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    return [currentDate];
  };

  const days = getDays();

  // Navigation
  const goPrev = () => {
    if (view === "month") setCurrentDate(addDays(startOfMonth(currentDate), -1));
    else if (view === "week") setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const goNext = () => {
    if (view === "month") setCurrentDate(addDays(endOfMonth(currentDate), 1));
    else if (view === "week") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };


  const goToday = () => setCurrentDate(new Date());

  const title = {
    month: format(currentDate, "MMMM yyyy"),
    week: `${format(startOfWeek(currentDate), "MMM d")} – ${format(
      endOfWeek(currentDate),
      "MMM d, yyyy"
    )}`,
    day: format(currentDate, "EEEE, MMMM d, yyyy"),
  }[view];

  // Update function
// In Dashboard.jsx – replace the updateDeliveryDate function

const updateDeliveryDate = async (shipmentId, newIsoDate) => {
  if (!canDrag || !token) return;

  // 1. Store original value for rollback
  const originalShipment = shipments.find((s) => s._id === shipmentId);
  if (!originalShipment) return;

  // 2. Optimistic update – move immediately
  optimisticUpdateShipment(shipmentId, newIsoDate);
console.log("newIsoDate",newIsoDate)
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shipment/update-delivery-date`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: shipmentId,
        delivery_date: newIsoDate,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error ${res.status}`);
    }

    // Success – sync with server
    await refetchShipments();

    notification.success({
      title: "Success",
      description: "Delivery date has been updated.",
      placement: "topRight",
      duration: 4.5,
      className: "modern-toast",
      style: {
        border: "none",
        borderRadius: 16,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        padding: "16px 20px",
      },
      icon: <ClockCheck style={{ color: "#10b981", fontSize: 24 }} />,
    });
  } catch (err) {
    console.error("Update failed:", err);

    // 3. Rollback optimistic change on error
    optimisticUpdateShipment(shipmentId, originalShipment.delivery_date);

    notification.error({
      message: "Error",
      description: "Failed to update delivery date: " + (err.message || "Unknown error"),
      placement: "topRight",
      duration: 6,
    });
  }
};



  return (
    <>
    <LoadingStates
  isInitialLoading={isInitialLoading}
  shipmentsLoading={shipmentsLoading}
  shipmentsError={shipmentsError}
  shipments={shipments}
  refetchShipments={refetchShipments}
  emptyIcon={<Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />}
  emptyTitle="No Shipments in Dashboard"
  emptyDescription="No shipment data available at the moment or none scheduled in the selected period."
  retryButtonText="Refresh Dashboard"
/>
    <DndProvider backend={HTML5Backend}>
      {/* Main content wrapper – constrained height + scroll */}
      <div className="flex flex-col bg-white ">

        {/* Header – fixed height, no scroll */}
        <div className="px-6 pt-6 pb-4 md:px-8 bg-white md:pt-8 md:pb-6 border-b mb-3 ">
          <div className="flex flex-col sm:flex-row justify-between items-start h-[10px]  sm:items-center gap-4">
            <Chip
              variant="soft"
              color="accent"
              size="lg"
              radius="sm"
            >
              {title}
            </Chip>

            <div className="flex flex-wrap bg-white rounded-xl shadow-sm px-3 py-1 items-center gap-2">
              <Button variant="danger-soft" size="sm" onPress={goPrev}>
                ← Prev
              </Button>
              <Button variant="outline" size="sm" onPress={goToday}>
                Today
              </Button>
              <Button variant="danger-soft" size="sm" onPress={goNext}>
                Next →
              </Button>

              <div className="flex gap-1">
                <Button
                  variant={view === "month" ? "primary" : "ghost"}
                  size="sm"
                  onPress={() => setView("month")}
                >
                  Month
                </Button>
                <Button
                  variant={view === "week" ? "primary" : "ghost"}
                  size="sm"
                  onPress={() => setView("week")}
                >
                  Week
                </Button>
                <Button
                  variant={view === "day" ? "primary" : "ghost"}
                  size="sm"
                  onPress={() => setView("day")}
                >
                  Day
                </Button>



              {currentUser?.role !== "supplier" &&  <GridView/>}








              </div>
            </div>
          </div>
        </div>
        <div className="px-2 md:px-3 py-3 mx-8 mt-0">
  
          <KpiDashboard shipments={shipments} />
        </div>
        {/* Calendar area – scrollable, takes remaining height */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 md:px-8 bg-white md:pb-8 bg-gray-50">
          <div className="border rounded-lg overflow-hidden bg-white shadow ">
            {view === "month" && (
              <MonthlyCalendar
                days={days}
                currentDate={currentDate}
                shipments={shipments}
                canDrag={canDrag}
                onUpdate={updateDeliveryDate}
                onDayClick={handleCalendarDayClick}
              />
            )}
            <Modal size="xl">
  <Button
    variant="secondary"
    ref={triggerRef}
    className="hidden"
  >
    Open (hidden)
  </Button>

  <Modal.Backdrop>
    <Modal.Container>
      <Modal.Dialog className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <Modal.CloseTrigger />

        <Modal.Header>
          <Modal.Heading>
            <div className="flex items-center gap-3">
              <CalendarDays className="size-6 text-blue-600" />
              Shipments on {selectedCalendarDate ? format(selectedCalendarDate, "MMM d, yyyy") : "—"}
            </div>
          </Modal.Heading>

          {/* Status breakdown chips */}
          {(() => {
  if (!selectedCalendarDate) return null;

  const dayShipments = shipments.filter((s) => {
    const dateStr = s.delivery_date || s.actual_delivery_date;
    if (!dateStr) return false;
    try {
      return isSameDay(parseISO(dateStr), selectedCalendarDate);
    } catch {
      return false;
    }
  });

            const statusCounts = dayShipments.reduce((acc, s) => {
              const key = s.missed_delivery ? "Missed" : s.status || "Unknown";
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {});

            return (
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip variant="soft" color="default" size="sm">
                  Total: {dayShipments.length}
                </Chip>
                {Object.entries(statusCounts).map(([status, count]) => {
                  let color = "default";
                  if (status === "Received") color = "success";
                  if (status === "Not Received") color = "primary";
                  if (status === "Delay") color = "warning";
                  if (status === "TBD") color = "secondary";
                  if (status === "Missed") color = "danger";

                  return (
                    <Chip key={status} variant="soft" color={color} size="sm">
                      {status}: {count}
                    </Chip>
                  );
                })}
              </div>
            );
          })()}
        </Modal.Header>

        <Modal.Body className="pt-6 pb-8">
        {(() => {
  if (!selectedCalendarDate) return null;

  const dayShipments = shipments.filter((s) => {
    const dateStr = s.delivery_date || s.actual_delivery_date;
    if (!dateStr) return false;
    try {
      return isSameDay(parseISO(dateStr), selectedCalendarDate);
    } catch {
      return false;
    }
  });

  if (dayShipments.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12 text-lg">
        No shipments on this day.
      </p>
    );
  }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dayShipments.map((shipment, idx) => {
                  let colors = {
                    bg: "bg-[#0088F6]",
                    border: "border-blue-700/50",
                    text: "text-white",
                    time: "text-blue-100",
                  };

                  if (shipment.status === "Received") {
                    colors = { bg: "bg-[#198754]", border: "border-green-700/50", text: "text-white", time: "text-green-100" };
                  } else if (shipment.status === "Delay") {
                    colors = { bg: "bg-[#fd7e14]", border: "border-orange-800/50", text: "text-white", time: "text-orange-100" };
                  } else if (shipment.status === "TBD") {
                    colors = { bg: "bg-[#6f42c1]", border: "border-purple-700/50", text: "text-white", time: "text-purple-100" };
                  }

                  if (shipment.missed_delivery) {
                    colors = { bg: "bg-[#dc3545]", border: "border-red-700/50", text: "text-white", time: "text-red-100" };
                  }

                  return (
                    <Card
                      key={shipment._id || idx}
                      className={`w-full ${colors.bg} ${colors.border} shadow-md rounded-xl overflow-hidden`}
                    >
                      <Package
                        aria-label="Package icon"
                        className={`${colors.time} size-6 ml-5 mt-5`}
                        role="img"
                      />

                      <Card.Header className="pb-2 px-5 pt-2">
                        <Card.Title className={`${colors.text} text-base font-semibold flex items-center gap-2`}>
                          {shipment.shortId || shipment.tracking_number || "No ID"}
                          {shipment.missed_delivery && " • Missed"}
                        </Card.Title>
                        <Card.Description className={`${colors.time} text-xs mt-1`}>
                          {format(parseISO(shipment.delivery_date), "MMM d, yyyy • HH:mm")}
                        </Card.Description>
                      </Card.Header>

                      <div className="px-5 pb-4 text-xs space-y-2.5">
                        {/* same grid and fields as before */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div><span className={`${colors.time} font-medium`}>Supplier:</span> <p className={`${colors.text}`}>{shipment.supplier?.name || "—"}</p></div>
                          <div><span className={`${colors.time} font-medium`}>Location:</span> <p className={`${colors.text}`}>{shipment.location?.name || "—"}</p></div>
                          <div><span className={`${colors.time} font-medium`}>PO:</span> <p className={`${colors.text}`}>{shipment.tracking_number || "—"}</p></div>
                          <div><span className={`${colors.time} font-medium`}>PO Line:</span> <p className={`${colors.text}`}>{shipment.items?.[0]?.po_line || "—"}</p></div>
                          <div><span className={`${colors.time} font-medium`}>Qty:</span> <p className={`${colors.text}`}>{shipment.items?.[0]?.quantity || "?"} {shipment.items?.[0]?.uom || ""}</p></div>
                          <div><span className={`${colors.time} font-medium`}>Carrier:</span> <p className={`${colors.text}`}>{shipment.courier || "—"}</p></div>
                        </div>

                        <div>
                          <span className={`${colors.time} font-medium`}>Description:</span>
                          <p className={`${colors.text} line-clamp-2`}>{shipment.items?.[0]?.description || "—"}</p>
                        </div>

                        <div className="pt-2 border-t border-white/20">
                          <span className={`${colors.time} font-medium`}>Status:</span>
                          <strong className={`${colors.text} ml-2`}>{shipment.status || "—"}</strong>
                        </div>
                      </div>

                      <Card.Footer className="px-5 py-3 border-t border-white/20 text-xs">
                        <div className={`${colors.time}`}>
                          Tracking: {shipment.tracking_number || "—"}
                        </div>
                      </Card.Footer>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </Modal.Body>
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>

            {view === "week" && (
              <WeeklyCalendar
                days={days}
                shipments={shipments}
                canDrag={canDrag}
                onUpdate={updateDeliveryDate}
              />
            )}

            {view === "day" && (
              <DailyCalendar
               day={currentDate}
                shipments={shipments}
                canDrag={canDrag}
                onUpdate={updateDeliveryDate}
              />
            )}
          </div>
        </div>

      
        
      </div>
  
    </DndProvider>
    </>
  );
}