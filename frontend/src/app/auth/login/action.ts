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

    const user = await signIn(
      "credentials",
      { 
        email, 
        password, 
        role,
        redirectTo: redirectTo,
      }
    );
    
    if(!user) {
      throw new Error("User does not exist");
    }
    console.log("User logged in successfully");
    
    
  
}
