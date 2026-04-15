"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/common/Modal";
import { ContactEditForm } from "@/components/companies/ContactEditForm";
import type { ContactDTO } from "@/lib/dto/contact";

type Props = {
  contact: ContactDTO;
};

export function ContactEditButton({ contact }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        Modifier
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Modifier le contact">
        <ContactEditForm
          contact={contact}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
