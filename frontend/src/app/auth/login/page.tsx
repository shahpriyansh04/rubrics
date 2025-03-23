"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import login from "./action";

const tabs = ["User"];

export default function CreativeLogin() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const role = tabs[activeTab].toLowerCase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({
        redirectTo: "/dashboard",
        email,
        password,
        role,
      });
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTab = (index: number) => {
    setActiveTab(index);
    setEmail("");
    setPassword("");
    setError("");
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
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="text-red-500 text-sm text-center">
                      {error}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`Enter your email`}
                      required
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
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#0e7b9b] hover:bg-[#0c6a87] text-white"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Logging in..."
                      : `Log In as ${tabs[activeTab]}`}
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
