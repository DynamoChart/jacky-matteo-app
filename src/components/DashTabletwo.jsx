// src/DashTabletwo.jsx  (or rename to MissedShipmentsTable.jsx)
"use client";

import { useState, useMemo, useRef } from "react";
import { useAppContext } from "../context/DataContext";
import { Table, Spin, Alert, DatePicker, Space } from "antd";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Modal, Button, Chip } from "@heroui/react";
import { Card } from "@heroui/react";
import { CalendarDays, Package, AlertCircle } from "lucide-react";

const { RangePicker } = DatePicker;

export default function DashTabletwo() {
  const { shipments, shipmentsLoading, shipmentsError } = useAppContext();
  const triggerRef = useRef(null);

  const [dateRange, setDateRange] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Group only dates that have at least one MISSED shipment ──
  const groupedData = useMemo(() => {
    if (shipmentsLoading || shipmentsError || !shipments || shipments.length === 0) {
      return [];
    }

    const map = new Map();

    shipments.forEach((shipment) => {
      const dateStr = shipment.delivery_date || shipment.actual_delivery_date;
      if (!dateStr) return;

      // Only process if this shipment is missed
      if (!shipment.missed_delivery) return;

      try {
        const dateObj = parseISO(dateStr);
        const key = format(dateObj, "yyyy-MM-dd");
        const display = format(dateObj, "MMM d, yyyy");

        const entry = map.get(key) || { key, display, dateObj, count: 0 };
        entry.count += 1;
        map.set(key, entry);
      } catch (err) {
        console.warn("Invalid date in missed shipment:", dateStr, err);
      }
    });

    return Array.from(map.values());
  }, [shipments, shipmentsLoading, shipmentsError]);

  // Apply date range filter (same as before)
  const filteredData = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return groupedData;

    const [start, end] = dateRange;
    const filterStart = startOfDay(start);
    const filterEnd = endOfDay(end);

    return groupedData.filter((item) =>
      isWithinInterval(item.dateObj, { start: filterStart, end: filterEnd })
    );
  }, [groupedData, dateRange]);

  // Sort newest first
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => b.dateObj - a.dateObj);
  }, [filteredData]);

  // ── Loading / Error / Empty ──
  if (shipmentsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spin size="large" tip="Loading shipments..." />
      </div>
    );
  }

  if (shipmentsError) {
    return (
      <Alert
        message="Error"
        description={shipmentsError || "Failed to load shipments"}
        type="error"
        showIcon
        className="max-w-2xl mx-auto my-8"
      />
    );
  }

  if (!shipments || shipments.length === 0) {
    return (
      <Alert
        message="No Data"
        description="No shipments found."
        type="info"
        showIcon
        className="max-w-2xl mx-auto my-8"
      />
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600 bg-white rounded-xl shadow border mx-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold">No Missed Shipments</h3>
        <p className="mt-2">All deliveries were completed on time in the selected period.</p>
      </div>
    );
  }

  const handleRowClick = (record) => {
    setSelectedDate(record);
    console.log("Missed date clicked:", record);
    if (triggerRef.current) {
      triggerRef.current.click();
    }
  };

  const columns = [
    {
      title: "Delivery Date",
      dataIndex: "display",
      key: "display",
      sorter: (a, b) => a.dateObj - b.dateObj,
      defaultSortOrder: "descend",
      render: (text) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-md">
            <CalendarDays className="h-5 w-5 text-red-600" />
          </div>
          <span className="font-medium text-gray-900">{text}</span>
        </div>
      ),
    },
    {
      title: "Missed Shipments",
      dataIndex: "count",
      key: "count",
      width: 180,
      align: "center",
      sorter: (a, b) => a.count - b.count,
      render: (count) => (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-700 rounded-full font-semibold">
          <AlertCircle className="h-4 w-4" />
          {count}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white">
      <div className="bg-white mx-0 rounded-2xl shadow-sm border border-red-100/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className=" text-red-800 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            Missed Shipments by Date
          </h2>

          <Space>
            <RangePicker
              format="MMM D, YYYY"
              onChange={(dates) => setDateRange(dates)}
              allowClear
              placeholder={["From Date", "To Date"]}
              className="w-full sm:w-auto"
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={sortedData}
          rowKey="key"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total) => `Total ${total} dates with missed shipments`,
            position: ["bottomCenter"],
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: "pointer" },
            className: "hover:bg-red-50/60 transition-colors duration-150",
          })}
          className="custom-ant-table"
          locale={{ emptyText: "No missed shipments in the selected range" }}
        />
      </div>

      {/* ── Modal ── (same as before, but focused on missed) */}
      <Modal size="xl">
        <Button variant="secondary" ref={triggerRef} className="hidden">
          Open (hidden)
        </Button>

        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-5xl max-h-[80vh] overflow-y-auto p-6">
              <Modal.CloseTrigger />

              <Modal.Header>
                <Modal.Heading>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="size-6 text-red-600" />
                    Missed Shipments on {selectedDate?.display || "—"}
                  </div>
                </Modal.Heading>

                {/* Status breakdown – will show only missed + related */}
                {(() => {
                  const dayShipments = shipments.filter((s) => {
                    const dateStr = s.delivery_date || s.actual_delivery_date;
                    if (!dateStr) return false;
                    try {
                      return format(parseISO(dateStr), "yyyy-MM-dd") === selectedDate?.key;
                    } catch {
                      return false;
                    }
                  }).filter((s) => s.missed_delivery); // only missed!

                  const statusCounts = dayShipments.reduce((acc, s) => {
                    const key = s.status || "Unknown";
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                  }, {});

                  return (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Chip variant="soft" color="danger" size="sm">
                        Missed: {dayShipments.length}
                      </Chip>
                      {Object.entries(statusCounts).map(([status, count]) => (
                        <Chip key={status} variant="soft" color="default" size="sm">
                          {status}: {count}
                        </Chip>
                      ))}
                    </div>
                  );
                })()}
              </Modal.Header>

              <Modal.Body className="pt-2 pb-8">
                {(() => {
                  const dayShipments = shipments
                    .filter((s) => {
                      const dateStr = s.delivery_date || s.actual_delivery_date;
                      if (!dateStr) return false;
                      try {
                        return format(parseISO(dateStr), "yyyy-MM-dd") === selectedDate?.key;
                      } catch {
                        return false;
                      }
                    })
                    .filter((s) => s.missed_delivery); // only show missed ones

                  if (dayShipments.length === 0) {
                    return (
                      <p className="text-center text-gray-500 py-12 text-lg">
                        No missed shipments found for this date.
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {dayShipments.map((shipment, idx) => {
                        const colors = {
                          bg: "bg-[#dc3545]",
                          border: "border-red-700/50",
                          text: "text-white",
                          time: "text-red-100",
                        };

                        return (
                          <Card
                            key={shipment._id || idx}
                            className={`w-full max-w-md p-1 ${colors.bg} ${colors.border} shadow-md rounded-xl overflow-hidden`}
                          >
                            <Card.Header className="pb-2 mt-3 px-5 pt-2">
                              <Card.Title className={`${colors.text} text-base flex font-semibold`}>
                                <div className="flex items-center">
                                  <Package
                                    aria-label="Package icon"
                                    className={`${colors.time} size-6 mr-2`}
                                    role="img"
                                  />
                                  {shipment.shortId || shipment.tracking_number || "No ID"}
                                  {" • Missed"}
                                </div>
                              </Card.Title>

                              <Card.Description className={`${colors.time} text-xs mt-1`}>
                                {shipment.delivery_date
                                  ? format(parseISO(shipment.delivery_date), "MMM d, yyyy • HH:mm")
                                  : "—"}
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
    </div>
  );
}