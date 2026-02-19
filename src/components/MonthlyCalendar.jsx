// src/MonthlyCalendar.jsx
import { useState,memo } from "react";

import { useDrop, useDrag } from "react-dnd";
import {
  format,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

const ItemTypes = { SHIPMENT: "shipment" };

export default function MonthlyCalendar({
  days,
  currentDate,
  shipments = [],
  canDrag,
  onUpdate,
  onDayClick,
}) {
  const [expandedDays, setExpandedDays] = useState(new Set());
// If no shipments yet → show loading placeholder
if (shipments.length === 0) {
  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden shadow-sm border border-gray-200/70 min-h-[500px]">
      {/* Header row */}
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div
          key={day}
          className="bg-[#F9C97C] backdrop-blur-sm py-1.5 text-center text-xs font-semibold tracking-wide text-black uppercase"
        >
          {day}
        </div>
      ))}

      {/* Skeleton grid while loading */}
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border-b border-r border-gray-100 p-2 min-h-[7.5rem] animate-pulse"
        />
      ))}

      {/* Centered loading message */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 pointer-events-none">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-600 mb-2">Loading shipments...</div>
          <div className="text-sm text-gray-500">Please wait a moment</div>
        </div>
      </div>
    </div>
  );
}
  const toggleExpand = (date) => {
    const key = date.toISOString();
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDayClick = (date) => {
    if (onDayClick) onDayClick(date);
  };

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden shadow-sm border border-gray-200/70">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div
          key={day}
          className="bg-[#F9C97C] backdrop-blur-sm py-1.5 text-center text-xs font-semibold tracking-wide text-black uppercase"
        >
          {day}
        </div>
      ))}

      {days.map((date) => (
        <DayCell
          key={date.toISOString()}
          date={date}
          currentDate={currentDate}
          isExpanded={expandedDays.has(date.toISOString())}
          toggleExpand={() => toggleExpand(date)}
          dayShipments={shipments.filter((s) =>
            s.delivery_date ? isSameDay(parseISO(s.delivery_date), date) : false
          )}
          canDrag={canDrag}
          onUpdate={onUpdate}
          onDayClick={handleDayClick}
        />
      ))}
    </div>
  );
}

function DayCell({
  date,
  currentDate,
  isExpanded,
  toggleExpand,
  dayShipments,
  canDrag,
  onUpdate,
  onDayClick,
}) {
  const isCurrentMonth = isSameMonth(date, currentDate);
  const isToday = isSameDay(date, new Date());

  console.log(`DayCell ${format(date, 'MMM d')} - canDrag:`, canDrag, 'shipments:', dayShipments.length);

  const sortedShipments = [...dayShipments].sort((a, b) => {
    const timeA = a.delivery_date ? parseISO(a.delivery_date).getTime() : 0;
    const timeB = b.delivery_date ? parseISO(b.delivery_date).getTime() : 0;
    return timeA - timeB;
  });

  const visibleShipments = isExpanded ? sortedShipments : sortedShipments.slice(0, 2);
  const hiddenCount = dayShipments.length - 2;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.SHIPMENT,
    drop: (item) => {
      console.log("DROPPED SUCCESSFULLY in monthly view!", {
        itemId: item.id,
        originalDate: item.delivery_date,
        targetDay: format(date, 'yyyy-MM-dd'),
      });

      const original = parseISO(item.delivery_date);
      const newDate = new Date(date);                    // start from target day
      newDate.setHours(original.getHours(), original.getMinutes(), 0, 0);

      console.log("New ISO date being sent:", newDate.toISOString());

      onUpdate(item.id, newDate.toISOString());
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  return (
    <div
      className={`
        group relative rounded-sm lg:min-h-[7rem] p-2 
        flex flex-col bg-white transition-colors duration-200
        hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]
        active:scale-[0.995]
        border-b border-r border-gray-100 last:border-r-0
        ${!isCurrentMonth ? "opacity-10 bg-gray-50/40" : ""}
        ${isToday ? "bg-blue-50/30 ring-1 ring-blue-200/70" : ""}
        ${isOver ? "bg-amber-50/60 ring-2 ring-amber-300/50" : ""}
      `}
      style={{ minHeight: isExpanded ? "auto" : "7.5rem" }}
    >
      <div
        ref={drop}
        onClick={() => onDayClick(date)}
        className="flex-1 flex flex-col h-full"
      >
        <div className="flex items-start justify-between">
          <div
            className={`
              text-right text-[10px] tracking-tight
              ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
              ${isToday ? "text-blue-600" : ""}
            `}
          >
            {format(date, "d")}
          </div>

          {dayShipments.length > 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand();
              }}
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
            >
              {isExpanded ? (
                <>Show less <ChevronUp size={14} /></>
              ) : (
                <>+{hiddenCount} <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>

        <div className="mt-1 ml-2 flex-1 space-y-1 overflow-hidden">
          {visibleShipments.map((s) => (
            <ShipmentCard key={s._id} shipment={s} canDrag={canDrag} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ShipmentCard({ shipment, canDrag }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHIPMENT,
    item: { id: shipment._id, delivery_date: shipment.delivery_date },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    canDrag,
  }));

  const time = format(parseISO(shipment.delivery_date), "HH:mm");

  let colors = {
    bg: "bg-[#0088F6]",
    border: "border-blue-700/40",
    text: "text-white",
    time: "text-blue-100/90",
  };

  if (shipment.status === "Received") {
    colors = {
      bg: "bg-[#198754]",
      border: "border-green-700/40",
      text: "text-white",
      time: "text-green-100/90",
    };
  } else if (shipment.status === "Not Received") {
    colors = {
      bg: "bg-[#0088F6]",
      border: "border-blue-700/40",
      text: "text-white",
      time: "text-blue-100/90",
    };
  } else if (shipment.status === "Delay") {
    colors = {
      bg: "bg-[#fd7e14]",
      border: "border-orange-800/40",
      text: "text-white",
      time: "text-orange-100/90",
    };
  } else if (shipment.status === "TBD") {
    colors = {
      bg: "bg-[#6f42c1]",
      border: "border-purple-700/40",
      text: "text-white",
      time: "text-purple-100/90",
    };
  }

  if (shipment.missed_delivery) {
    colors = {
      bg: "bg-[#dc3545]",
      border: "border-red-700/40",
      text: "text-white",
      time: "text-red-100/90",
    };
  }

  return (
    <div
      ref={drag}
      className={`
        px-1.5 py-1 h-[40px] rounded-lg border text-xs leading-snug
        transition-all duration-150 cursor-grab active:cursor-grabbing
        shadow-sm hover:shadow-md hover:brightness-110
        ${isDragging ? "opacity-60 scale-95 rotate-1 shadow-lg" : ""}
        ${colors.bg} ${colors.border} ${colors.text}
      `}
    >
      <div className="font-semibold truncate text-[10px] flex items-baseline gap-1.5">
        <span className={`font-medium ${colors.time}`}>{time}</span>
        <span className="opacity-70">·</span>
        <span className="truncate">
          {shipment.tracking_number || shipment.shortId}
        </span>
      </div>

      <div className="mt-0.5 text-[12px] truncate line-clamp-1 opacity-90">
        {shipment.supplier?.name || "—"} → {shipment.location?.name || "—"}
      </div>
    </div>
  );
}