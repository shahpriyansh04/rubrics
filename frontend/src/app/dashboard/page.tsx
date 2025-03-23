"use client";

import * as React from "react";
import { Book, PlusCircle, Users, School, LogOut } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { classApi, type Class } from "@/services/api";
import logout from "../auth/action";

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [newClassName, setNewClassName] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [joinCode, setJoinCode] = React.useState("");

  const initialFetchDone = React.useRef(false);

  React.useEffect(() => {
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    if (!initialFetchDone.current) {
      fetchClasses();
      initialFetchDone.current = true;
    }
  }, [session, router]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const data = await classApi.getClasses(session?.user?.token as string);
      setClasses(data);
    } catch (err) {
      setError("Failed to fetch classes");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode || session?.user?.role !== "student") return;

    try {
      await classApi.joinClass(joinCode, session?.user?.token as string);
      setJoinCode("");
      fetchClasses();
    } catch (err) {
      setError("Failed to join class");
      console.error(err);
    }
  };

  const handleAddClass = async () => {
    if (!newClassName || session?.user?.role !== "teacher") return;

    try {
      const newClass = await classApi.createClass(
        {
          name: newClassName,
        },
        session?.user?.token as string
      );
      setClasses([...classes, newClass]);
      setNewClassName("");
    } catch (err) {
      setError("Failed to create class");
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 text-red-500">{error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 mb-8">
            <School className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">
              {session?.user?.role === "teacher" ? "Teacher" : "Student"}{" "}
              Dashboard
            </h1>
          </div>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:border-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-semibold text-gray-700">
              Your Classes
            </h2>
          </div>

          {session?.user?.role === "teacher" ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Create New Class
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right text-gray-600">
                      Class Name
                    </Label>
                    <Input
                      id="name"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="col-span-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter class name..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddClass}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    Create Class
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Join Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Join a Class
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="code" className="text-right text-gray-600">
                      Join Code
                    </Label>
                    <Input
                      id="code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="col-span-3 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      placeholder="Enter class code..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleJoinClass}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    Join Class
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card
              key={cls._id}
              className="hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border-gray-200"
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                <CardTitle className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                  <Book className="h-5 w-5 text-blue-600" />
                  {cls.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  {cls.students.length}{" "}
                  {cls.students.length === 1 ? "student" : "students"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <Button
                  onClick={() => router.push(`/dashboard/${cls._id}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  <Book className="mr-2 h-4 w-4" />
                  View Class
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
