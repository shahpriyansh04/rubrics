import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        role: {}, // Added role to the credentials
      },
      authorize: async (credentials) => {
        console.log(credentials);

        let endpoint;
        if (credentials.role === "student") {
          endpoint = "http://localhost:4000/login-student";
        } else if (credentials.role === "teacher") {
          endpoint = "http://localhost:4000/login-teacher";
        } else {
          throw new Error("Invalid role");
        }
        console.log(endpoint);
        //Prepare the request body
        const bodyContent = JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        });

        // Make the API request
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: bodyContent,
        });

        // Handle the response
        if (!response.ok) {
          throw new Error("Failed to authenticate");
        }

        const data = await response.json();
        console.log(data);

        // Return user data if authentication is successful
        return data.data;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Merge user data into the JWT token
      return { ...token, ...user };
    },
    async session({ session, token }) {
      // Attach user information to the session
      session.user = token;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
