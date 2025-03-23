"use server";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import type { User } from "next-auth";

export default async function login({
  redirectTo,
  email,
  password,
  role,
}: {
  redirectTo: string;
  email: string;
  password: string;
  role: string;
}) {
  console.log(`Logging in as ${role}`);

  try {
    const result = await signIn(
      "credentials",
      { 
        email, 
        password, 
        role,
        redirect: false 
      }
    );
    
    if (!result?.ok) {
      throw new Error(result?.error || "Invalid credentials");
    }

    console.log("User logged in successfully");
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    redirect(redirectTo);
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Failed to login. Please check your credentials.");
  }
}
