import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user && Object.keys(session.user).length > 0) {
    redirect("/dashboard");
  }

  return <div>{children}</div>;
}
