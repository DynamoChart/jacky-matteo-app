"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Calendar } from "@gravity-ui/icons";
import { Button, Modal, Card } from "@heroui/react";
import { useAppContext } from "../context/DataContext";
import { format, parseISO } from "date-fns";
import { Package, RefreshCw } from "lucide-react";
import { notification } from "antd";

export function GridView() {
  const { shipments, refetchShipments } = useAppContext();

  const [countdown, setCountdown] = useState(5 * 60);
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);

  const scheduleNextRefresh = () => {
    if (!isMounted.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      refetchShipments?.();
      notification.info({
        message: "Data Refreshed",
        description: "Today's shipments updated. Refreshing in 5 minutes...",
        placement: "topRight",
        duration: 4,
      });
      setCountdown(5 * 60);
      scheduleNextRefresh();
    }, 5 * 60 * 1000);
  };

  useEffect(() => {
    isMounted.current = true;
    setCountdown(5 * 60);
    scheduleNextRefresh();
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [refetchShipments]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Filter + sort by time (earliest first)
  const dayShipments = useMemo(() => {
    const filtered = shipments?.filter((s) => {
      const dateStr = s.delivery_date || s.actual_delivery_date;
      if (!dateStr) return false;
      try {
        return format(parseISO(dateStr), "yyyy-MM-dd") === todayStr;
      } catch {
        return false;
      }
    }) || [];

    return filtered
      .map((shipment) => {
        const dateStr = shipment.actual_delivery_date || shipment.delivery_date;
        const date = dateStr ? parseISO(dateStr) : null;
        const timeMs = date ? date.getTime() : Infinity;
        const isPlanned = !shipment.actual_delivery_date;

        let timeLabel = date ? format(date, "HH:mm") : "—";
        if (isPlanned && timeLabel !== "—") {
          timeLabel += "";
        }

        return {
          ...shipment,
          sortTime: timeMs,
          timeLabel,
          isPlanned,
        };
      })
      .sort((a, b) => a.sortTime - b.sortTime); // earliest first
  }, [shipments]);

  const todayDisplay = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="flex flex-wrap gap-4 relative">
      <Modal isDismissable={false}>
        <Button variant="secondary">Grid</Button>

        <Modal.Backdrop>
          <Modal.Container size="full">
            <Modal.Dialog>
              <Modal.CloseTrigger />

              <Modal.Header>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Modal.Icon className="bg-success-soft text-foreground">
                      <Calendar className="size-5" />
                    </Modal.Icon>
                    <Modal.Heading className="text-xl font-semibold">
                      {todayDisplay}
                    </Modal.Heading>
                  </div>

                  <div className="text-sm text-gray-500 flex items-center gap-1.5 mr-6 -mt-8">
                    <RefreshCw size={14} />
                    Next refresh: {timeDisplay}
                  </div>
                </div>
              </Modal.Header>

              <Modal.Body>
                {dayShipments.length === 0 ? (
                  <p className="text-center text-gray-500 py-12 text-lg">
                    No shipments scheduled for today.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 w-full">
                    {dayShipments.map((shipment, idx) => {
                      let colors = {
                        bg: "bg-[#0088F6]",
                        border: "border-blue-700/50",
                        text: "text-white",
                        time: "text-blue-100",
                      };

                      const status = shipment.status || "SCHEDULED";

                      if (status === "Received") {
                        colors = {
                          bg: "bg-[#198754]",
                          border: "border-green-700/50",
                          text: "text-white",
                          time: "text-green-100",
                        };
                      } else if (status === "Delay") {
                        colors = {
                          bg: "bg-[#fd7e14]",
                          border: "border-orange-800/50",
                          text: "text-white",
                          time: "text-orange-100",
                        };
                      } else if (status === "TBD") {
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

                      const deliveryTime = shipment.timeLabel;

                      return (
                        <Card
                          key={shipment._id || idx}
                          className={`p-1 ${colors.bg} ${colors.border} shadow-md rounded-xl overflow-hidden p-0 m-0 mt-2 mr-2`}
                        >
                          <Card.Header className="pb-0 mt-3 px-5 pt-0">
                            <Card.Title className={`${colors.text} text-lg flex font-semibold items-center gap-2`}>
                              <Package className={`${colors.time} size-5`} />
                              {shipment.tracking_number || "—"} / Supplier: {shipment.supplier?.name || "—"} / Time: {deliveryTime}
                              {shipment.missed_delivery && (
                                <span className="text-red-200 text-xs ml-1">Missed</span>
                              )}
                              <p className={`${colors.text} font-semibold`}>{status}</p>
                            </Card.Title>
                          </Card.Header>

                          <div className="px-5 pb-0 text-md space-y-0">
                            <div className="grid grid-cols-1">
                              <div>
                                <p className={`${colors.text}`}>
                                  {shipment.supplier?.name || "—"} → {shipment.location?.name || "—"}
                                </p>
                              </div>
                            </div>

                            <div className=" w-full">
                              <div className="grid grid-cols-2 mt-1 space-y-0 wrap">
                                {shipment.items?.length > 0 ? (
                                  shipment.items.map((item, i) => (
                                    <div key={i} className={`${colors.text}`}>
                                      • {item.quantity || "?"} {item.uom || ""}
                                      {item.po && ` • PO ${item.po}`}
                                      {item.po_line && `-${item.po_line}`}
                                    </div>
                                  ))
                                ) : (
                                  <div className={`${colors.time}`}>No items</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}