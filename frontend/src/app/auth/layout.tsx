import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const session = await auth();
  // console.log(session?.user);

  //   if (session?.user) redirect("/dashboard");

  return <div>{children}</div>;
}
