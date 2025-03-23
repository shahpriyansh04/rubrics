import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    sapid: string;
    rollno: string;
    year: string;
    class: string;
    batch: string;
    sem: string;
    firstName: string;
    lastName: string;
    role: "student" | "teacher" | "admin";
    token: string;
  }

  interface Session {
    user: User;
  }
} 