import { signOut } from "next-auth/react";

export default async function logout() {
    await signOut({
        redirectTo: "/auth/login",
    });
}