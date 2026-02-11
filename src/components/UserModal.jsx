// src/components/UserModal.jsx  ← the parent modal component
"use client";

import { useEffect } from "react";
import {
  Modal,
  Button,
  useOverlayState,
  ModalHeader,
  ModalIcon,
  ModalHeading,
  ModalBody
} from "@heroui/react";
import { Plus } from "@gravity-ui/icons";
import TestForm from "./TestForm"; // your form
import { notification } from "antd";
import "antd/dist/antd.css";
import { useAppContext } from "../context/DataContext";

export default function UserModal({ mode = "create", triggerRef }) {
  const { refetchAllUsers } = useAppContext();

  // HeroUI v3 recommended controlled state
  const state = useOverlayState({
    defaultOpen: false,
  });

  // Connect trigger ref to open modal
  useEffect(() => {
    if (!triggerRef?.current) return;

    const openModal = () => state.open();
    triggerRef.current.addEventListener("click", openModal);

    return () => {
      triggerRef.current?.removeEventListener("click", openModal);
    };
  }, [triggerRef, state]);

  // Callback to be called from TestForm on success
  const handleSuccess = () => {
    notification.success({
      message: "Success",
      description: "User created successfully!",
      placement: "topRight",
      duration: 4.5,
    });

    refetchAllUsers?.();     // refresh table
    state.close();           // close modal
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
                <ModalIcon className="bg-blue-100 text-blue-600 mr-2">
                  <Plus />
                </ModalIcon>
                <ModalHeading className="mt-2">
                  Add User
                </ModalHeading>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              {/* Pass handleSuccess to TestForm */}
              <TestForm onSuccess={handleSuccess} />
            </ModalBody>

            {/* No footer needed if form has its own buttons */}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}