"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import login from "./action";

const tabs = ["Student", "Teacher"];

export default function CreativeLogin() {
  const { data: session } = useSession();
  console.log(session?.user);

  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const role = tabs[activeTab]; // Automatically set role based on active tab

  const handleLogin = async () => {
    console.log("Logging in as:", role);
    login({
      redirectTo: "/dashboard",
      email,
      password,
      role: tabs[activeTab].toLowerCase(), // Include the role
    });
  };

  const updateTab = (index: number) => {
    setActiveTab(index);
    setEmail(""); // Clear fields when switching tabs
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0e7b9b] via-[#b7efe7] to-white p-4">
      <div className="w-full max-w-md">
        <motion.div
          className="bg-white rounded-3xl shadow-xl overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#0e7b9b] rounded-full -translate-x-1/2 -translate-y-1/2 z-0" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#b7efe7] rounded-full translate-x-1/2 translate-y-1/2 z-0" />

          <div className="relative z-10 p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-[#0e7b9b]">
              Log In
            </h1>

            <div className="flex justify-center mb-8">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === index
                      ? "bg-[#0e7b9b] text-white"
                      : "text-[#0e7b9b] hover:bg-[#b7efe7]"
                  }`}
                  onClick={() => updateTab(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`Enter your email`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-[#0e7b9b] hover:bg-[#0c6a87] text-white"
                  >
                    Log In as {role}
                  </Button>
                </form>
              </motion.div>
            </AnimatePresence>

            <p className="mt-4 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <a href="#" className="text-[#0e7b9b] hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// "use client";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   BookOpen,
//   GraduationCap,
//   Palette,
//   Pencil,
//   Sparkles,
//   Users,
// } from "lucide-react";
// import { useState } from "react";
// import login from "./action";

// const LoginForm = ({
//   userType,
//   email,
//   setEmail,
//   password,
//   setPassword,
//   handleLogin,
// }: {
//   userType: string;
//   email: string;
//   setEmail: (email: string) => void;
//   password: string;
//   setPassword: (password: string) => void;
//   handleLogin: (userType: string) => void;
// }) => (
//   <form
//     onSubmit={(e) => {
//       e.preventDefault();
//       handleLogin(userType);
//     }}
//   >
//     <div className="grid w-full items-center gap-4">
//       <div className="flex flex-col space-y-1.5">
//         <Label
//           htmlFor={`${userType}-email`}
//           className="text-purple-700 font-semibold"
//         >
//           Email
//         </Label>
//         <Input
//           id={`${userType}-email`}
//           placeholder="Enter your Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="border-purple-300 focus:border-purple-500 bg-white"
//         />
//       </div>
//       <div className="flex flex-col space-y-1.5">
//         <Label
//           htmlFor={`${userType}-password`}
//           className="text-purple-700 font-semibold"
//         >
//           Password
//         </Label>
//         <Input
//           id={`${userType}-password`}
//           type="password"
//           placeholder="Enter your password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="border-purple-300 focus:border-purple-500 bg-white"
//         />
//       </div>
//     </div>
//     <CardFooter className="flex justify-between mt-6">
//       <Button
//         variant="outline"
//         className="text-blue-600 border-blue-600 hover:bg-blue-100"
//       >
//         Forgot Password
//       </Button>
//       <Button
//         type="submit"
//         className="bg-purple-500 hover:bg-purple-600 text-white"
//       >
//         Login
//       </Button>
//     </CardFooter>
//   </form>
// );

// export default function ColorfulLoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const handleLogin = async (userType: string) => {
//     console.log(`Logging in as ${userType}`);
//     console.log({ email, password, role: userType });
//     login({
//       redirectTo: "/",
//       email: email,
//       password,
//       role: userType,
//     });
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-4">
//       <Card className="w-full max-w-[400px] border-4 border-purple-300 shadow-lg overflow-hidden relative">
//         <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-green-200 to-blue-200 opacity-30"></div>
//         <CardHeader className="relative bg-purple-300 text-purple-900">
//           <CardTitle className="text-3xl font-bold text-center">
//             EduFun Login
//           </CardTitle>
//           <CardDescription className="text-center text-purple-700 font-medium">
//             Welcome back to colorful learning!
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="pt-6 relative bg-white bg-opacity-80">
//           <Tabs defaultValue="students" className="w-full">
//             <TabsList className="grid w-full grid-cols-3 bg-purple-100 p-1 rounded-lg mb-4">
//               <TabsTrigger
//                 value="students"
//                 className="rounded-md data-[state=active]:bg-red-400 data-[state=active]:text-white transition-all"
//               >
//                 <GraduationCap className="w-4 h-4 mr-2" />
//                 Students
//               </TabsTrigger>
//               <TabsTrigger
//                 value="teachers"
//                 className="rounded-md data-[state=active]:bg-green-400 data-[state=active]:text-white transition-all"
//               >
//                 <BookOpen className="w-4 h-4 mr-2" />
//                 Teachers
//               </TabsTrigger>
//               <TabsTrigger
//                 value="parents"
//                 className="rounded-md data-[state=active]:bg-orange-400 data-[state=active]:text-white transition-all"
//               >
//                 <Users className="w-4 h-4 mr-2" />
//                 Parents
//               </TabsTrigger>
//             </TabsList>
//             <TabsContent value="students">
//               <LoginForm
//                 userType="student"
//                 email={email}
//                 setEmail={setEmail}
//                 password={password}
//                 setPassword={setPassword}
//                 handleLogin={handleLogin}
//               />
//             </TabsContent>
//             <TabsContent value="teachers">
//               <LoginForm
//                 userType="teacher"
//                 email={email}
//                 setEmail={setEmail}
//                 password={password}
//                 setPassword={setPassword}
//                 handleLogin={handleLogin}
//               />
//             </TabsContent>
//             <TabsContent value="parents">
//               <LoginForm
//                 userType="parent"
//                 email={email}
//                 setEmail={setEmail}
//                 password={password}
//                 setPassword={setPassword}
//                 handleLogin={handleLogin}
//               />
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//       <Pencil className="absolute top-4 left-4 w-12 h-12 text-yellow-400 animate-bounce" />
//       <BookOpen className="absolute bottom-4 right-4 w-12 h-12 text-green-400 animate-pulse" />
//       <Palette className="absolute top-4 right-4 w-12 h-12 text-blue-500 animate-spin" />
//       <Sparkles className="absolute bottom-4 left-4 w-12 h-12 text-pink-400 animate-ping" />
//     </div>
//   );
// }
