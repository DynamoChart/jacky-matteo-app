// src/components/SupplierModalCreate.jsx
"use client";

import { useState, useEffect } from "react";
import { Check, Plus } from "@gravity-ui/icons";
import {
  Modal,
  Button,
  Form,
  Input,
  Label,
  TextField,
  useOverlayState,           // ← HeroUI v3 state hook
} from "@heroui/react";
import { useAppContext } from "../context/DataContext";
import { notification } from "antd";
import "antd/dist/antd.css";

export default function SupplierModalCreate({ triggerRef }) {
  const { token, refetchAllSuppliers } = useAppContext();

  // HeroUI v3 modal state
  const state = useOverlayState({
    defaultOpen: false,
  });

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Connect hidden trigger button to open modal
  useEffect(() => {
    if (!triggerRef?.current) return;

    const openModal = () => state.open();
    triggerRef.current.addEventListener("click", openModal);

    return () => {
      triggerRef.current?.removeEventListener("click", openModal);
    };
  }, [triggerRef, state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      notification.warning({
        message: "Warning",
        description: "Supplier name is required",
        placement: "topRight",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/supplier/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to create supplier");
      }

      // Success
      notification.success({
        message: "Success",
        description: "Supplier created successfully!",
        placement: "topRight",
        duration: 4.5,
      });

      await refetchAllSuppliers?.();   // refresh table
      state.close();                   // close modal
      setName("");                     // reset form
    } catch (err) {
      console.error("Create supplier error:", err);
      notification.error({
        message: "Error",
        description: err.message || "Failed to create supplier",
        placement: "topRight",
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal state={state}>
      {/* Hidden trigger */}
      <Button ref={triggerRef} className="hidden">
        open
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />

            <Modal.Header>
              <div className="flex items-center">
                <Modal.Icon className="bg-green-100 text-green-600 mr-2">
                  <Plus />
                </Modal.Icon>
                <Modal.Heading className="mt-2">Add Supplier</Modal.Heading>
              </div>
            </Modal.Header>

            <Modal.Body>
              <Form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
                <TextField isRequired>
                  <Label>Supplier Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="rounded-xl border border-border/70 bgsurface px-4 py-2 shadow-sm focus-visible:border-primary"
                  />
                </TextField>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    <Check />
                    {loading ? "Creating..." : "Create"}
                  </Button>
                  <Button slot="close" variant="secondary" disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}