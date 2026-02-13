// src/pages/Suppliers.jsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAppContext } from "./context/DataContext";
import {
  Table,
  Space,
  Tooltip,
  Input as AntInput,
  Button as AntButton,
  Pagination,
} from "antd";
import { Button, Chip } from "@heroui/react";
import { Search, Download, Edit, Trash2, Plus,Building2 } from "lucide-react";
import { LayoutHeaderCellsLarge } from "@gravity-ui/icons";
import * as XLSX from "xlsx";
import LoadingStates from "./components/LoadingStates"; // the reusable component

// Modals
import SupplierModalCreate from "./components/SupplierModalCreate";
import SupplierModalEdit from "./components/SupplierModalEdit";
import SupplierModalDelete from "./components/SupplierModalDelete";

export default function Suppliers() {
  const {
    allSuppliers,
    suppliersLoading,
    suppliersError,
    isAdmin,
    refetchAllSuppliers,
  } = useAppContext();

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const refreshData = async () => {
      setIsInitialLoading(true);
      try {
        await refetchAllSuppliers?.();
      } catch (err) {
        console.error("Suppliers initial refetch failed:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    refreshData();
  }, [refetchAllSuppliers]);

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const addRef = useRef(null);
  const editRef = useRef(null);
  const deleteRef = useRef(null);

  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filteredSuppliers = useMemo(() => {
    if (!allSuppliers?.length) return [];

    if (!debouncedSearch?.trim()) return allSuppliers;

    const searchLower = debouncedSearch.trim().toLowerCase();
    return allSuppliers.filter((sup) =>
      (sup.name || "").toLowerCase().includes(searchLower)
    );
  }, [allSuppliers, debouncedSearch]);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage]);

  const handleExportExcel = () => {
    if (!filteredSuppliers.length) {
      alert("No data to export");
      return;
    }

    const exportData = filteredSuppliers.map((s) => ({
      Name: s.name || "—",
      "Created At": s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
    XLSX.writeFile(wb, `Suppliers_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="font-medium text-blue-700 truncate block">
            {text || "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Nummber of Users",
      dataIndex: "userCount",
      key: "userCount",
      width: 300,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="font-medium text-blue-700 truncate block">
            {text || "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Nummber of Shipments",
      dataIndex: "shipmentCount",
      key: "shipmentCount",
      width: 300,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="font-medium text-blue-700 truncate block">
            {text || "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => (date ? new Date(date).toLocaleDateString() : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <AntButton
            type="text"
            icon={<Edit className="h-4 w-4 text-blue-600" />}
            onClick={() => {
              setSelectedSupplier(record);
              editRef.current?.click();
            }}
          />
          <AntButton
            type="text"
            danger
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => {
              setSelectedSupplier(record);
              deleteRef.current?.click();
            }}
            disabled={!isAdmin}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <LoadingStates
        isInitialLoading={isInitialLoading}
        shipmentsLoading={suppliersLoading}
        shipmentsError={suppliersError}
        shipments={allSuppliers}
        refetchShipments={refetchAllSuppliers}
        emptyIcon={<Building2 className="h-16 w-16 text-gray-400 mx-auto mb-6" />}
        emptyTitle="No Suppliers Found"
        emptyDescription="There are no suppliers registered in the system yet."
        retryButtonText="Refresh Suppliers"
      />

      {!isInitialLoading && (
        <div className="bg-white min-h-screen py-8">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header + Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Building2 className="h-7 w-7 text-indigo-600" />
                Suppliers
              </h2>

              <Space size="middle">
                {isAdmin && (
                  <Button
                    variant="secondary"
                    onClick={() => addRef.current?.click()}
                  >
                    <Plus className="h-4 w-4" />
                    Add Supplier
                  </Button>
                )}

                <Button
                  className="bg-[#33C866]"
                  icon={<Download className="h-4 w-4" />}
                  onClick={handleExportExcel}
                >
                  <LayoutHeaderCellsLarge />
                  Export Excel
                </Button>
              </Space>
            </div>

            {/* Search */}
            <div className="flex justify-right w-[25%]">
              <AntInput
                placeholder="Search supplier name..."
                allowClear
                size="large"
                prefix={<Search className="h-5 w-5 text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="rounded-xl shadow-sm w-[300px] border border-blue-300 h-[35px]"
              />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Table
                columns={columns}
                dataSource={paginatedSuppliers}
                rowKey="_id"
                pagination={false}
                loading={suppliersLoading}
                bordered={false}
                size="middle"
                scroll={{ x: "max-content" }}
                className="custom-ant-table"
                locale={{ emptyText: "No suppliers match your search" }}
              />
            </div>

            {/* Pagination */}
            {filteredSuppliers.length > pageSize && (
              <div className="flex justify-center py-6">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredSuppliers.length}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showTotal={(total) => `Showing ${paginatedSuppliers.length} of ${total} suppliers`}
                />
              </div>
            )}
          </div>

          {/* Modals – NO onSuccess reload anymore */}
          <SupplierModalCreate triggerRef={addRef} />
          <SupplierModalEdit supplier={selectedSupplier} triggerRef={editRef} />
          <SupplierModalDelete supplier={selectedSupplier} triggerRef={deleteRef} />
        </div>
      )}
    </>
  );
}