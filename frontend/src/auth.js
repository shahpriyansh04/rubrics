import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        role: {},
      },
      async authorize(credentials) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                identifier: credentials?.email,
                password: credentials?.password,
              }),
            }
          );

          if (!response.ok) {
            return null;
          }

          const { data } = await response.json();

          return {
            ...data,
            name: `${data.firstName} ${data.lastName}`,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user;
        return {
          ...token,
          id: authUser.id,
          email: authUser.email,
          firstName: authUser.firstName,
          lastName: authUser.lastName,
          role: authUser.role,
          sapid: authUser.sapid,
          rollno: authUser.rollno,
          year: authUser.year,
          class: authUser.class,
          batch: authUser.batch,
          sem: authUser.sem,
          token: authUser.token,
          name: `${authUser.firstName} ${authUser.lastName}`,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          email: token.email,
          firstName: token.firstName,
          lastName: token.lastName,
          role: token.role,
          sapid: token.sapid,
          rollno: token.rollno,
          year: token.year,
          class: token.class,
          batch: token.batch,
          sem: token.sem,
          token: token.token,
          name: `${token.firstName} ${token.lastName}`,
        },
        token: token.token,
      };
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
