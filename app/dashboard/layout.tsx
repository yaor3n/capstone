// app/layout.tsx or app/dashboard/layout.tsx
import InitUserStore from "@/components/init-user-store";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <InitUserStore />
      <main>{children}</main>
    </>
  );
}
