"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/common/Modal";
import { ChannelForm } from "@/components/contacts/ChannelForm";

type Props = { contactId: string };

export function AddChannelButton({ contactId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Ajouter un canal
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un canal">
        <ChannelForm
          contactId={contactId}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
