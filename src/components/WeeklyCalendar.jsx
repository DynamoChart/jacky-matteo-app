// src/WeeklyCalendar.jsx
import { useState, useRef, useMemo } from "react";
import { useDrop, useDrag } from "react-dnd";
import {
  format,
  parseISO,
  isSameDay,
  getHours,
  getMinutes,
} from "date-fns";
import { Modal, Button, Chip, Card } from "@heroui/react";
import { CalendarDays, Package } from "lucide-react";

const ItemTypes = { SHIPMENT: "shipment" };

const hours = Array.from({ length: 15 }, (_, i) => 6 + i); // 06:00 to 20:00

export default function WeeklyCalendar({
  days,
  shipments,
  canDrag,
  onUpdate,
}) {
  const [selectedSlot, setSelectedSlot] = useState(null); // { date: Date, hour: number, display: string }
  const triggerRef = useRef(null);

  const handleCellClick = (day, hour) => {
    setSelectedSlot({
      date: day,
      hour,
      display: `${format(day, "MMM d, yyyy")} • ${hour.toString().padStart(2, "0")}:00`,
    });

    // Trigger modal if your library requires it
    if (triggerRef.current) {
      triggerRef.current.click();
    }
  };

  return (
    <>
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
        {/* Header: Weekdays + Dates */}
        <div
          className="grid sticky top-0 z-10 h-9 bg-gray-50 border-b"
          style={{ gridTemplateColumns: "60px repeat(7, minmax(100px, 1fr))" }}
        >
          <div className="border-r pl-3 text-xs font-medium text-gray-600 bg-gray-100 flex items-center pointer-events-none">
            Time
          </div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="p-1.5 text-center text-xs font-semibold text-gray-800 border-r last:border-r-0 flex flex-col justify-center pointer-events-none"
            >
              <div>{format(day, "EEE")}</div>
              <div className="text-[10px] text-gray-500">{format(day, "MMM d")}</div>
            </div>
          ))}
        </div>

        {/* Time slot rows */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid border-b last:border-b-0 h-[60px]"
            style={{ gridTemplateColumns: "60px repeat(7, minmax(100px, 1fr))" }}
          >
            {/* Hour label */}
            <div className="border-r pl-3 text-xs text-gray-600 bg-gray-50/80 flex items-center pointer-events-none">
              {hour.toString().padStart(2, "0")}:00
            </div>

            {/* Day columns */}
            {days.map((day) => (
              <HourCell
                key={`${day.toISOString()}-${hour}`}
                day={day}
                hour={hour}
                shipments={shipments}
                canDrag={canDrag}
                onUpdate={onUpdate}
                onCellClick={handleCellClick}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Modal – shows only shipments from the clicked hour slot */}
      {selectedSlot && (
        <Modal size="xl">
          {/* Hidden trigger button – keep if your Modal component needs it */}
          <Button
            variant="secondary"
            ref={triggerRef}
            className="hidden"
          >
            Open
          </Button>

          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-5xl max-h-[80vh] overflow-y-auto p-6">
                <Modal.CloseTrigger onClick={() => setSelectedSlot(null)} />

                <Modal.Header>
                  <Modal.Heading>
                    <div className="flex items-center gap-3">
                      <CalendarDays className="size-6 text-blue-600" />
                      Shipments – {selectedSlot.display}
                    </div>
                  </Modal.Heading>

                  {/* Status summary chips */}
                  {(() => {
                    const slotShipments = shipments.filter((s) => {
                      if (!s.delivery_date) return false;
                      const dt = parseISO(s.delivery_date);
                      return isSameDay(dt, selectedSlot.date) && getHours(dt) === selectedSlot.hour;
                    });

                    const statusCounts = slotShipments.reduce((acc, s) => {
                      const key = s.missed_delivery ? "Missed" : s.status || "Unknown";
                      acc[key] = (acc[key] || 0) + 1;
                      return acc;
                    }, {});

                    return (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Chip variant="soft" color="default" size="sm">
                          Total: {slotShipments.length}
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

                <Modal.Body className="pt-2 pb-8">
                  {(() => {
                    const slotShipments = shipments
                      .filter((s) => {
                        if (!s.delivery_date) return false;
                        const dt = parseISO(s.delivery_date);
                        return isSameDay(dt, selectedSlot.date) && getHours(dt) === selectedSlot.hour;
                      })
                      .sort((a, b) => parseISO(a.delivery_date) - parseISO(b.delivery_date));

                    if (slotShipments.length === 0) {
                      return (
                        <p className="text-center text-gray-500 py-12 text-lg">
                          No shipments scheduled in this time slot.
                        </p>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {slotShipments.map((shipment, idx) => {
                          let colors = {
                            bg: "bg-[#0088F6]",
                            border: "border-blue-700/50",
                            text: "text-white",
                            time: "text-blue-100",
                          };

                          if (shipment.status === "Received") {
                            colors = {
                              bg: "bg-[#198754]",
                              border: "border-green-700/50",
                              text: "text-white",
                              time: "text-green-100",
                            };
                          } else if (shipment.status === "Delay") {
                            colors = {
                              bg: "bg-[#fd7e14]",
                              border: "border-orange-800/50",
                              text: "text-white",
                              time: "text-orange-100",
                            };
                          } else if (shipment.status === "TBD") {
                            colors = {
                              bg: "bg-[#6f42c1]",
                              border: "border-purple-700/50",
                              text: "text-white",
                              time: "text-purple-100",
                            };
                          }

                          if (shipment.missed_delivery) {
                            colors = {
                              bg: "bg-[#dc3545]",
                              border: "border-red-700/50",
                              text: "text-white",
                              time: "text-red-100",
                            };
                          }

                          return (
                            <Card
                              key={shipment._id || idx}
                              className={`w-full p-1 ${colors.bg} ${colors.border} shadow-md rounded-xl overflow-hidden`}
                            >
                              <Card.Header className="pb-2 mt-3 px-5 pt-2">
                                <Card.Title className={`${colors.text} text-base flex font-semibold items-center gap-2`}>
                                  <Package
                                    aria-label="Package icon"
                                    className={`${colors.time} size-6`}
                                    role="img"
                                  />
                                  {shipment.shortId || shipment.tracking_number || "No ID"}
                                  {shipment.missed_delivery && " • Missed"}
                                </Card.Title>

                                <Card.Description className={`${colors.time} text-xs mt-1`}>
                                  {format(parseISO(shipment.delivery_date), "MMM d, yyyy • HH:mm")}
                                </Card.Description>
                              </Card.Header>

                              <div className="px-5 pb-4 text-xs space-y-2.5">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <div>
                                    <span className={`${colors.time} font-medium`}>Supplier:</span>
                                    <p className={`${colors.text}`}>{shipment.supplier?.name || "—"}</p>
                                  </div>
                                  <div>
                                    <span className={`${colors.time} font-medium`}>Location:</span>
                                    <p className={`${colors.text}`}>{shipment.location?.name || "—"}</p>
                                  </div>
                                  <div>
                                    <span className={`${colors.time} font-medium`}>PO:</span>
                                    <p className={`${colors.text}`}>{shipment.tracking_number || "—"}</p>
                                  </div>
                                  <div>
                                    <span className={`${colors.time} font-medium`}>PO Line:</span>
                                    <p className={`${colors.text}`}>{shipment.items?.[0]?.po_line || "—"}</p>
                                  </div>
                                  <div>
                                    <span className={`${colors.time} font-medium`}>Qty:</span>
                                    <p className={`${colors.text}`}>
                                      {shipment.items?.[0]?.quantity || "?"} {shipment.items?.[0]?.uom || ""}
                                    </p>
                                  </div>
                                  <div>
                                    <span className={`${colors.time} font-medium`}>Carrier:</span>
                                    <p className={`${colors.text}`}>{shipment.courier || "—"}</p>
                                  </div>
                                </div>

                                <div>
                                  <span className={`${colors.time} font-medium`}>Description:</span>
                                  <p className={`${colors.text} line-clamp-2`}>
                                    {shipment.items?.[0]?.description || "—"}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-white/20 flex justify-between">
                                  <span className="text-[#FDEDD3] font-bold">
                                    Status: <strong className={colors.text}>{shipment.status || "—"}</strong>
                                  </span>
                                </div>
                              </div>

                              <Card.Footer className="px-5 py-2 text-md border-t border-black/80">
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
      )}
    </>
  );
}

function HourCell({ day, hour, shipments, canDrag, onUpdate, onCellClick }) {
  const slotShipments = useMemo(() => {
    return shipments.filter(
      (s) =>
        s.delivery_date &&
        isSameDay(parseISO(s.delivery_date), day) &&
        getHours(parseISO(s.delivery_date)) === hour
    );
  }, [shipments, day, hour]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.SHIPMENT,
    drop: (item) => {
      const original = parseISO(item.delivery_date);
      const newDate = new Date(day);
      newDate.setHours(hour, getMinutes(original), 0, 0);
      onUpdate(item.id, newDate.toISOString());
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  const sorted = [...slotShipments].sort(
    (a, b) => parseISO(a.delivery_date) - parseISO(b.delivery_date)
  );

  const maxVisible = 1;
  const visible = sorted.slice(0, maxVisible);
  const hidden = sorted.length - maxVisible;

  return (
    <div
      ref={drop}
      onClick={() => onCellClick(day, hour)}
      className={`
        relative h-full p-1 transition-all duration-100
        ${isOver ? "bg-amber-50/70 ring-2 ring-amber-300/50" : "hover:bg-gray-50/50"}
        border-r last:border-r-0 cursor-pointer select-none
      `}
    >
      {visible.map((s) => (
        <TimedShipmentCard
          key={s._id}
          shipment={s}
          canDrag={canDrag}
        />
      ))}

      {hidden > 0 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-800/85 text-white rounded-full shadow">
            +{hidden}
          </span>
        </div>
      )}
    </div>
  );
}
// Smaller, tighter card
function TimedShipmentCard({ shipment, canDrag }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHIPMENT,
    item: { id: shipment._id, delivery_date: shipment.delivery_date },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    canDrag,
  }));

  const date = parseISO(shipment.delivery_date);
  const minutes = getMinutes(date);
  const topPercent = (minutes / 60) * 100;

  let colors = {
    bg: "bg-[#0088F6]",
    border: "border-blue-700/50",
    text: "text-white",
    time: "text-blue-100",
  };

  if (shipment.status === "Received") {
    colors = {
      bg: "bg-[#198754]",
      border: "border-green-700/50",
      text: "text-white",
      time: "text-green-100",
    };
  } else if (shipment.status === "Not Received") {
    colors = {
      bg: "bg-[#0088F6]",
      border: "border-blue-700/50",
      text: "text-white",
      time: "text-blue-100",
    };
  } else if (shipment.status === "Delay") {
    colors = {
      bg: "bg-[#fd7e14]",
      border: "border-orange-800/50",
      text: "text-white",
      time: "text-orange-100",
    };
  } else if (shipment.status === "TBD") {
    colors = {
      bg: "bg-[#6f42c1]",
      border: "border-purple-700/50",
      text: "text-white",
      time: "text-purple-100",
    };
  }

  if (shipment.missed_delivery) {
    colors = {
      bg: "bg-[#dc3545]",
      border: "border-red-700/50",
      text: "text-white",
      time: "text-red-100",
    };
  }

  const timeStr = format(date, "HH:mm");

  return (
    <div
      ref={drag}
      style={{
        top: `${topPercent}%`,
        transform: "translateY(+5%)",
      }}
      className={`
        absolute left-1 right-1 z-10 rounded border px-1.5 py-1 text-[10px] shadow-sm
        cursor-grab active:cursor-grabbing transition-all duration-150
        leading-tight
        ${isDragging
          ? "opacity-50 scale-95 rotate-[0.5deg] shadow-lg z-30"
          : "hover:shadow hover:scale-[1.02] hover:z-20"}
        ${colors.bg} ${colors.border} ${colors.text}
      `}
    >
      <div className="font-medium truncate flex items-center gap-1">
        <span className={colors.time}>{timeStr}</span>
        <span className="opacity-60">·</span>
        <span className="truncate">
          {shipment.tracking_number || shipment.shortId}
        </span>
      </div>

      <div className="mt-0.5 text-[9px] opacity-85 truncate">
        {shipment.supplier?.name || "—"} → {shipment.location?.name || "—"}
      </div>
    </div>
  );
}