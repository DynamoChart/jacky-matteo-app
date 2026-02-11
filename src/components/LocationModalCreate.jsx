// src/components/LocationModalCreate.jsx
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
  useOverlayState,
  ModalHeader,
  ModalIcon,
  ModalHeading,
  ModalBody,
} from "@heroui/react";
import { useAppContext } from "../context/DataContext";
import { notification } from "antd";
import "antd/dist/antd.css";

export default function LocationModalCreate({ triggerRef }) {
  const { token, refetchAllLocations } = useAppContext();

  const state = useOverlayState({ defaultOpen: false });

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

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
    const trimmed = name.trim();
    if (!trimmed) {
      notification.warning({
        message: "Warning",
        description: "Location name is required",
        placement: "topRight",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/location/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to create location");
      }

      notification.success({
        message: "Success",
        description: "Location created successfully!",
        placement: "topRight",
        duration: 4.5,
      });

      await refetchAllLocations?.();
      state.close();
      setName("");
    } catch (err) {
      notification.error({
        message: "Error",
        description: err.message || "Failed to create location",
        placement: "topRight",
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal state={state}>
      <Button ref={triggerRef} className="hidden">
        open
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />

            <ModalHeader>
              <div className="flex items-center">
                <ModalIcon className="bg-green-100 text-green-600 mr-2">
                  <Plus />
                </ModalIcon>
                <ModalHeading className="mt-2">Add Location</ModalHeading>
              </div>
            </ModalHeader>

            <ModalBody>
              <Form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
                <TextField isRequired>
                  <Label>Location Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Warehouse A, Berlin Office"
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
            </ModalBody>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}