// src/components/UserModaledit.jsx
"use client";

import { useState, useEffect } from "react";
import { Check, PencilToSquare } from "@gravity-ui/icons";
import {
  Modal,
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
  ListBoxItemIndicator,useOverlayState,
} from "@heroui/react";
import { useAppContext } from "../context/DataContext"; // adjust path if needed
import { notification } from "antd";   // ← ADD THIS
import "antd/dist/antd.css";
export default function UserModaledit({
  mode = "edit",
  user,                  // ← the selected user object (must be passed when opening)
  triggerRef,
  onSuccess,
}) {
  const { allSuppliers, allLocations, token,refetchAllUsers } = useAppContext();
  const [loading, setLoading] = useState(false);

  // Form state – prefill from user when component mounts / user changes
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",           // empty = don't update password
    role: "supplier",
    supplier: null,
    locations: null,        // note: you used "locations" name in form
  });

  const [selectedRole, setSelectedRole] = useState("supplier");
  const state = useOverlayState({
    defaultOpen: false,
  });

  // Connect hidden trigger ref to open the modal
  useEffect(() => {
    if (!triggerRef?.current) return;

    const openModal = () => state.open();
    triggerRef.current.addEventListener("click", openModal);

    return () => {
      triggerRef.current?.removeEventListener("click", openModal);
    };
  }, [triggerRef, state]);
  useEffect(() => {
    if (user) {
      const roleLower = (user.role || "supplier").toLowerCase();
      setFormData({
        name: user.username || "",
        email: user.email || "",
        password: "", // NEVER prefill password for security
        role: roleLower,
        supplier: user.supplier?._id || null,
        locations: user.location?._id || null,
      });
      setSelectedRole(roleLower === "admin" ? "Admin" :
                      roleLower === "location" ? "Location" :
                      "Supplier");
    }
  }, [user]);

  const selectedState = { name: selectedRole }; // mimic your structure

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      id: user?._id,                    // required for update
      username: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role.toLowerCase(),
      password: formData.password.trim() || undefined, // omit if empty
      supplier: null,
      location: null,
    };

    if (payload.role === "admin") {
      // nothing
    } else if (payload.role === "location") {
      payload.location = formData.locations || null;
    } else if (payload.role === "supplier") {
      payload.supplier = formData.supplier || null;
    }

    // Basic validation (same as create)
    if (!payload.username) return alert("Username is required");
    if (!payload.email) return alert("Email is required");
    if (payload.role === "supplier" && !payload.supplier) return alert("Please select a supplier");
    if (payload.role === "location" && !payload.location) return alert("Please select a location");

    console.log("Update payload:", payload);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to update user");
      }

            // Success toast + close modal + refresh table
            notification.success({
              message: "Success",
              description: "User updated successfully!",
              placement: "topRight",
              duration: 4.5,
            });
      
            await refetchAllUsers?.();   // refresh table
            state.close();               // close modal

      // Optional: reset form or close modal logic here if needed
    } catch (err) {
      console.error("Update user error:", err);
      notification.error({
        message: "Error",
        description: err.message || "Failed to update user",
        placement: "topRight",
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Modal state={state}>
      {/* Hidden trigger – your pattern */}
      <Button ref={triggerRef} className="hidden">
        open edit modal
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />

            <Modal.Header>
              <div className="flex items-center">
                <Modal.Icon className="bg-blue-100 text-blue-600 mr-2">
                  <PencilToSquare />
                </Modal.Icon>
                <Modal.Heading className="mt-2">
                  Edit User
                </Modal.Heading>
              </div>
            </Modal.Header>

            <Modal.Body>
              <Form className="flex w-full p-4 flex-col gap-4" onSubmit={handleSubmit}>
                <TextField isRequired>
                  <Label>Username</Label>
                  <Input
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder="john"
                    className="rounded-xl border border-border/70 bgsurface px-4 py-2 text-md shadow-sm focus-visible:border-primary"
                  />
                </TextField>

                <TextField isRequired>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    placeholder="john@example.com"
                    className="rounded-xl border border-border/70 bgsurface px-4 py-2 text-md shadow-sm focus-visible:border-primary"
                  />
                </TextField>

                <TextField>
                  <Label>Password (leave empty to keep current)</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    placeholder="New password (optional)"
                    className="rounded-xl border border-border/70 bgsurface px-4 py-2 text-md shadow-sm focus-visible:border-primary"
                  />
                  <Description>Min 8 chars, 1 uppercase, 1 number — optional</Description>
                </TextField>

                <Select
                  isRequired
                  className="w-full"
                  name="role"
                  placeholder="Select Role"
                  value={selectedRole}
                  onChange={(value) => {
                    setSelectedRole(value);
                    setFormData((prev) => ({
                      ...prev,
                      role: value.toLowerCase(),
                      supplier: null,
                      locations: null,
                    }));
                  }}
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
                </Select>

                {selectedState?.name === "Supplier" && (
                  <Select
                    isRequired
                    className="w-full"
                    name="supplier"
                    placeholder="Select Supplier"
                    value={formData.supplier || undefined}
                    onChange={(val) => setFormData((prev) => ({ ...prev, supplier: val }))}
                  >
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
                  </Select>
                )}

                {selectedState?.name === "Location" && (
                  <Select
                    isRequired
                    className="w-full"
                    name="locations"
                    placeholder="Select Location"
                    value={formData.locations || undefined}
                    onChange={(val) => setFormData((prev) => ({ ...prev, locations: val }))}
                  >
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
    {loading ? "Updating..." : "Update"}
  </Button>
  <Button slot="close" variant="secondary" disabled={loading}>
    Cancel
  </Button>
</div>
              </Form>
            </Modal.Body>

            {/* Optional footer if you want extra Cancel button outside form */}
            <Modal.Footer>
              {/* You can leave empty or add <Button slot="close">Cancel</Button> */}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}