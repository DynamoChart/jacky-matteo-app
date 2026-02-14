"use client";

import { Calendar } from "@gravity-ui/icons";
import { Button, Modal, Card } from "@heroui/react";
import { useAppContext } from "../context/DataContext";
import { format, parseISO } from "date-fns";
import { CalendarDays, Package } from "lucide-react";
export function GridView() {
  const { shipments } = useAppContext();

  // Get today's date string in yyyy-MM-dd format for filtering
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Filter only today's shipments
  const dayShipments = shipments?.filter((s) => {
    const dateStr = s.delivery_date || s.actual_delivery_date;
    if (!dateStr) return false;
    try {
      return format(parseISO(dateStr), "yyyy-MM-dd") === todayStr;
    } catch {
      return false;
    }
  }) || [];

  // Format today's date nicely for display
  const todayDisplay = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="flex flex-wrap gap-4">
      <Modal>
        <Button variant="secondary">Grid</Button>

        <Modal.Backdrop>
          <Modal.Container size="full">
            <Modal.Dialog>
              <Modal.CloseTrigger />

              <Modal.Header>
                <div className="flex items-center gap-3">
                  <Modal.Icon className="bg-success-soft text-foreground">
                    <Calendar className="size-5" />
                  </Modal.Icon>
                  <Modal.Heading className="text-xl font-semibold">
                    {todayDisplay}
                  </Modal.Heading>
                </div>
              </Modal.Header>

              <Modal.Body>
                {dayShipments.length === 0 ? (
                  <p className="text-center text-gray-500 py-12 text-lg">
                    No shipments scheduled for today.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

                      const deliveryTime = shipment.delivery_date
                        ? format(parseISO(shipment.delivery_date), "HH:mm")
                        : "—";

                      return (
                        <Card
                          key={shipment._id || idx}
                          className={`w-full max-w-md p-1 ${colors.bg} ${colors.border} shadow-md rounded-xl overflow-hidden`}
                        >
                          <Card.Header className="pb-2 mt-3 px-5 pt-2">
                            <Card.Title className={`${colors.text} text-base flex font-semibold items-center gap-2`}>
                              <Package className={`${colors.time} size-5`} />
                              {shipment.tracking_number || "—"}  / ID: {shipment.shortId || "—"}  Time: {deliveryTime}
                              {shipment.missed_delivery && (
                                <span className="text-red-200 text-xs ml-1">Missed</span>
                              )}
                                 
                            </Card.Title>
                          </Card.Header>

                          <div className="px-5 pb-4 text-lg space-y-2">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                              <div>
                                <span className={`${colors.time} font-medium`}>Supplier → Location:</span>
                                <p className={`${colors.text}`}>
                                  {shipment.supplier?.name || "—"} → {shipment.location?.name || "—"}
                                </p>
                              </div>

                              <div>
                                <span className={`${colors.time} font-medium`}>Status:</span>
                                <p className={`${colors.text} font-medium`}>{status}</p>
                              </div>

             
                            </div>

                            <div className="pt-2">

                              <div className="mt-1 space-y-1">
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