// src/components/UserModalDelete.jsx
"use client";

import { useState,useEffect } from "react";
import {
  Modal,
  Button,
  ModalHeader,
  ModalIcon,
  ModalHeading,
  ModalBody,
  ModalFooter,
  useOverlayState,
} from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";
import { useAppContext } from "../context/DataContext";
import { notification } from "antd";
import "antd/dist/antd.css";

export default function UserModalDelete({
  mode = "delete",
  user,
  triggerRef,
  setSelectedUser,
}) {
  const { token, refetchAllUsers } = useAppContext();

  // HeroUI v3 recommended way to control modal
  const state = useOverlayState({
    defaultOpen: false,
  });

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

  const handleDelete = async () => {
    if (!user?._id) {
      notification.warning({
        message: "Warning",
        description: "No user selected",
        placement: "topRight",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: user._id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Delete failed");
      }

      // Success
      notification.success({
        message: "Success",
        description: "User deleted successfully!",
        placement: "topRight",
        duration: 4.5,
      });

      await refetchAllUsers?.();   // refresh table
      state.close();               // ← close modal using HeroUI state
      setSelectedUser(null);       // clear selection
    } catch (err) {
      console.error("Delete error:", err);
      notification.error({
        message: "Error",
        description: err.message || "Failed to delete user",
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
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />

            <ModalHeader>
              <div className="flex items-center">
                <ModalIcon className="bg-red-100 text-red-600 mr-2">
                  <TrashBin />
                </ModalIcon>

                <ModalHeading className="mt-2">
                  Delete User
                </ModalHeading>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              <p className="text-gray-600">
                Are you sure you want to delete{" "}
                <strong>{user?.username || user?.email || "this user"}</strong>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone.
              </p>
            </ModalBody>

            <ModalFooter>
              <Button variant="outline" slot="close" disabled={loading}>
                Cancel
              </Button>

              <Button
                variant="danger"
                loading={loading}
                onClick={handleDelete}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </ModalFooter>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}