// src/pages/Users.jsx  (or wherever it fits)
"use client";

import { useState,useEffect, useMemo, useRef } from "react";
import { useAppContext } from "./context/DataContext"; // adjust path
import {
  Table,
  Spin,
  Alert,
  Space,
  Tooltip,
  Input as AntInput,
  Button as AntButton,
  Pagination,
} from "antd";
import {
  Button,
  Chip,
  Card,
  Modal, // if you want modal for add/edit/delete
} from "@heroui/react";
import {
  Search,
  Download,
  Edit,
  Trash2,
  Plus,
  Building2,
  UsersRound,
  Truck
} from "lucide-react";
import {Envelope, Globe, LayoutHeaderCellsLarge,TrashBin} from "@gravity-ui/icons";
import UserModal from "./components/UserModal";
import UserModaledit from "./components/UserModaledit";
import ShipmentModal from "./components/ShipmentModal";
import TestForm from "./components/TestForm";
import * as XLSX from "xlsx";
import UserModalDelete from "./components/UserModalDelete";
import LoadingStates from "./components/LoadingStates"; // the reusable component
export default function Users() {
  const { allUsers, usersLoading, userLoading, isAdmin, refetchAllUsers,refetchAllSuppliers } = useAppContext();

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const addRef = useRef(null);
  const editRef = useRef(null);
  const deleteRef = useRef(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  useEffect(() => {
    const refreshSuppliers = async () => {
      setIsInitialLoading(true);
      try {
        await refetchAllUsers?.();
      } catch (err) {
        console.error("Suppliers initial refetch failed:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
  
    refreshSuppliers();
  }, [refetchAllUsers]);
  // ── Filter logic ────────────────────────────────────────────────────────
 // At top of component
const [debouncedSearch, setDebouncedSearch] = useState(searchText);

// Debounce effect
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchText);
  }, 300); // 300ms delay

  return () => clearTimeout(timer);
}, [searchText]);

// Then use debouncedSearch in useMemo instead of searchText
const filteredUsers = useMemo(() => {
  if (!allUsers?.length) return [];

  if (!debouncedSearch?.trim()) return allUsers;

  const searchLower = debouncedSearch.trim().toLowerCase();

  return allUsers.filter((user) => {
    const combined = [
      user.username || "",
      user.email || "",
      user.role || "",
      user.supplier?.name || "",
      user.location?.name || "",
    ].join(" ").toLowerCase();

    return combined.includes(searchLower);
  });
}, [allUsers, debouncedSearch]);






  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  // ── Excel Export ────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!filteredUsers.length) {
      alert("No data to export");
      return;
    }

    const exportData = filteredUsers.map((u) => ({
      Name: u.username || "—",
      Email: u.email || "—",
      Role: u.role || "—",
      Allocation: u.supplier?.name || u.location?.name || "—",
     
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `Users_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Columns (Ant Design style like Shipments) ───────────────────────────
  const columns = [
    {
      title: "Name",
      dataIndex: "username",
      key: "username",
      width: 180,
      render: (text, record) => (
        <Tooltip title={text || "—"}>
          <span className="font-medium text-blue-700 truncate block">
            {text || "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="truncate block">{text || "—"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (role) => {
        let color = "default";
        if (role === "admin") color = "success";
        if (role === "supplier") color = "warning";
        if (role === "location") color = "processing";

        return (
          <Chip variant="soft" color={color} size="sm">
            {role?.toUpperCase() || "—"}
          </Chip>
        );
      },
    },
    {
      title: "Allocation",
      key: "allocation",
      width: 180,
      render: (_, record) => (
        <Tooltip title={record.supplier?.name || record.location?.name || "—"}>
          <span className="truncate block">
            {record.supplier?.name || record.location?.name || "—"}
          </span>
        </Tooltip>
      ),
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
              setSelectedUser(record);
              editRef.current?.click();
            }}
          />
          <AntButton
            type="text"
            danger
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => {
              setSelectedUser(record);
              deleteRef.current?.click();
            }}
            disabled={!isAdmin}
          />
        </Space>
      ),
    },
  ];

  // ── Delete handler (placeholder – add real API later) ───────────────────
  const handleDelete = async () => {
    if (!selectedUser) return;
    // TODO: await fetch DELETE + refetchAllUsers()
    console.log("Delete user:", selectedUser._id);
    // refetchAllUsers?.();
  };



  return (
    <>
    <LoadingStates
      isInitialLoading={isInitialLoading}
      shipmentsLoading={usersLoading}
      shipmentsError={userLoading}
      shipments={allUsers}
      refetchShipments={refetchAllUsers}
      emptyIcon={<Building2 className="h-16 w-16 text-gray-400 mx-auto mb-6" />}
      emptyTitle="No Suppliers Found"
      emptyDescription="There are no suppliers registered in the system yet."
      retryButtonText="Refresh Suppliers"
    />
    <div className="bg-white min-h-screen py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header + Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <UsersRound className="h-7 w-7 text-indigo-600" />
            Users
          </h2>

          <Space size="middle">
          {isAdmin && (
            <Button
              variant="secondary"
              onClick={() => addRef.current?.click()}
            >
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          )}

            <Button
              className="bg-[#33C866]"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportExcel}
            >
                <LayoutHeaderCellsLarge/>
              Export Excel
            </Button>
          </Space>
        </div>

        {/* Search */}
        <div className="flex justify-right w-[25%]">
          <AntInput
            placeholder="Search name, email, role, allocation..."
            allowClear
            size="large"
            prefix={<Search className="h-5 w-5 text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-xl shadow-sm  w-[300px] border border-blue-300 h-[35px]"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            columns={columns}
            dataSource={paginatedUsers}
            rowKey="_id"
            pagination={false} // we handle manually below
            loading={usersLoading}
            bordered={false}
            size="middle"
            scroll={{ x: "max-content" }}
            className="custom-ant-table"
            locale={{ emptyText: "No users match your search" }}
          />
        </div>

        {/* Pagination (match Shipments style) */}
        {filteredUsers.length > pageSize && (
          <div className="flex justify-center py-6">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredUsers.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showTotal={(total) => `Showing ${paginatedUsers.length} of ${total} users`}
            />
          </div>
        )}
      </div>

      {/* Modals – use your existing pattern with trigger refs */}



<UserModal
  mode="create"
  triggerRef={addRef}
 
/>
<UserModalDelete
user={selectedUser}
setSelectedUser={setSelectedUser}
  mode="delete"
  triggerRef={deleteRef}
  
/>
<UserModaledit
  mode="edit"
  user={selectedUser}           // ← add this line
  triggerRef={editRef}

/>

      
    </div>
    </>
  );
}