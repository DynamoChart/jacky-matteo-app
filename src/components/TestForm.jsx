"use client";

import { useState } from "react";
import { Check } from "@gravity-ui/icons";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  Select,
  SelectTrigger,
  SelectValue,
  SelectIndicator,
  SelectPopover,
  ListBox,
  ListBoxItem,
  ListBoxItemIndicator,
  
  
} from "@heroui/react";
import { useAppContext } from "../context/DataContext"; // adjust path
import { notification } from "antd";
import "antd/dist/antd.css";


export default function TestForm({ onSuccess }) {
  const { allSuppliers, allLocations, token,refetchAllUsers } = useAppContext();
  const [loading, setLoading] = useState(false);
  

  const selectedRoles = [
    {
      id: "Admin",
      name: "Admin",

    },
    {
      id: "Location",
      name: "Location",
    },
    {
      id: "Supplier",
      name: "Supplier",
    },
   
  ];
  const [selectedRole, setSelectedRole] = useState("supplier");
  const selectedState = selectedRoles.find((s) => s.id === selectedRole);
  console.log("selectedState",selectedState?.id)
  const onSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData(e.currentTarget);
    const data = {};
  
    formData.forEach((value, key) => {
      data[key] = value.toString().trim();
    });
  
    console.log(`Form submitted with:\n${JSON.stringify(data, null, 2)}`);
  
    let role = (data.role || "supplier").toLowerCase();
  
    const payload = {
      username: data.name || "",
      email: data.email || "",
      password: data.password || "",
      role: role,
      supplier: null,
      location: null,
    };
  
    if (role === "admin") {
      payload.supplier = null;
      payload.location = null;
    } else if (role === "location") {
      payload.supplier = null;
      payload.location = data.locations || null;
    } else if (role === "supplier") {
      payload.location = null;
      payload.supplier = data.supplier || null;
    }
  
    console.log("Final payload to send:", payload);
  
    if (!payload.username) return alert("Username is required");
    if (!payload.email) return alert("Email is required");
    if (!payload.password) return alert("Password is required");
    if (role === "supplier" && !payload.supplier) return alert("Please select a supplier");
    if (role === "location" && !payload.location) return alert("Please select a location");
  
    setLoading(true);
  
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to create user");
      }
  

if (onSuccess) onSuccess();
await refetchAllUsers();   // refresh table

  
   
  
    } catch (err) {
      console.error("Create user error:", err);
      notification.error({
        message: "Error",
        description: err.message || "Failed to process user",
        placement: "topRight",
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form className="flex w-full p-4 flex-col gap-4" onSubmit={onSubmit}>
      <TextField isRequired name="name" type="text" >
        <Label>Username</Label>
        <Input placeholder="john" className="rounded-xl border border-border/70 bgsurface px-4 py-2 text-md shadow-sm focus-visible:border-primary"/>
        <FieldError />
      </TextField>

      <TextField
        isRequired
        name="email"
        type="email"
        validate={(value) => {
          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
            return "Please enter a valid email address";
          }
          return null;
        }}
      >
        <Label>Email</Label>
        <Input placeholder="john@example.com" className="rounded-xl border border-border/70 bgsurface px-4 py-2 text-md shadow-sm focus-visible:border-primary" />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        minLength={8}
        name="password"
        type="password"
        validate={(value) => {
          if (value.length < 4) {
            return "Password must be at least 8 characters";
          }
          if (!/[A-Z]/.test(value)) {
            return "Password must contain at least one uppercase letter";
          }
          if (!/[0-9]/.test(value)) {
            return "Password must contain at least one number";
          }
          return null;
        }}
      >
        <Label>Password</Label>
        <Input placeholder="Enter your password"  className="rounded-xl border border-border/70 bgsurface px-4 py-2 text-md shadow-sm focus-visible:border-primary"/>
        <Description>Must be at least 8 characters with 1 uppercase and 1 number</Description>
        <FieldError />
      </TextField>

      <Select isRequired className="w-full" name="role" placeholder="Select Role" 
      value={selectedRole}
      onChange={(value) => setSelectedRole(value)}
      >
        <Label>Role</Label>
        <SelectTrigger className="rounded-xl border border-border/70 bgsurface px-4 py-2 text-md shadow-sm focus-visible:border-primary">
          <Select.Value />
          <Select.Indicator />
        </SelectTrigger>
        <SelectPopover>
          <ListBox>
            <ListBoxItem id="Supplier" textValue="Supplier"> 
              Supplier
              <ListBoxItemIndicator />
            </ListBoxItem>
            <ListBoxItem id="Location" textValue="Location">
              Location
              <ListBoxItemIndicator />
            </ListBoxItem>
            <ListBoxItem id="Admin" textValue="Admin">
              Admin
              <ListBoxItemIndicator />
            </ListBoxItem>
          </ListBox>
        </SelectPopover>
        <FieldError />
      </Select>

    {/* Supplier dropdown – show ONLY if selectedRole is "Supplier" */}
{selectedState?.name === "Supplier" && (
  <Select isRequired className="w-full" name="supplier" placeholder="Select Supplier">
    <Label>Supplier</Label>
    <SelectTrigger className="rounded-xl border border-border/70 bgsurface px-4 py-2 text-md shadow-sm focus-visible:border-primary">
      <Select.Value />
      <Select.Indicator />
    </SelectTrigger>
    <SelectPopover>
      <ListBox className="max-h-64 overflow-y-auto scrollbar-hide p-1">
        {allSuppliers.map((sup) => (
          <ListBoxItem key={sup._id} id={sup._id} textValue={sup.name}>
            {sup.name}
            <ListBoxItemIndicator />
          </ListBoxItem>
        ))}
      </ListBox>
    </SelectPopover>
    <FieldError />
  </Select>
)}

{/* Location dropdown – show ONLY if selectedRole is "Location" */}
{selectedState?.name === "Location" && (
  <Select isRequired className="w-full" name="locations" placeholder="Select Location">
    <Label>Locations</Label>
    <SelectTrigger className="rounded-xl border border-border/70 bgsurface px-4 py-2 text-md shadow-sm focus-visible:border-primary">
      <Select.Value />
      <Select.Indicator />
    </SelectTrigger>
    <SelectPopover>
      <ListBox className="max-h-64 overflow-y-auto scrollbar-hide p-1">
        {allLocations.map((loc) => (
          <ListBoxItem key={loc._id} id={loc._id} textValue={loc.name}>
            {loc.name}
            <ListBoxItemIndicator />
          </ListBoxItem>
        ))}
      </ListBox>
    </SelectPopover>
  </Select>
)}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          <Check />
          {loading ? "Submitting..." : "Submit"}
        </Button>
        <Button type="reset" variant="secondary">
          Reset
        </Button>
      </div>
    </Form>
  );
}