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
  const [courseCode, setCourseCode] = React.useState("");
  const [courseOutcomes, setCourseOutcomes] = React.useState<
    Array<{
      code: string;
      description: string;
      bloomsLevel: string;
    }>
  >([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [joinCode, setJoinCode] = React.useState("");
  const [outcomeCode, setOutcomeCode] = React.useState("");
  const [outcomeDescription, setOutcomeDescription] = React.useState("");
  const [outcomeBloomsLevel, setOutcomeBloomsLevel] = React.useState("Apply");

  const initialFetchDone = React.useRef(false);

  React.useEffect(() => {
    if (!initialFetchDone.current) {
      if (session) {
        fetchClasses();
        initialFetchDone.current = true;
      }
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
          courseCode: courseCode,
          courseOutcomes: courseOutcomes,
        },
        session?.user?.token as string
      );
      setClasses([...classes, newClass]);
      setNewClassName("");
      setCourseCode("");
      setCourseOutcomes([]);
    } catch (err) {
      setError("Failed to create class");
      console.error(err);
    }
  };

  const handleAddOutcome = () => {
    if (!outcomeCode || !outcomeDescription) return;

    setCourseOutcomes([
      ...courseOutcomes,
      {
        code: outcomeCode,
        description: outcomeDescription,
        bloomsLevel: outcomeBloomsLevel,
      },
    ]);
    setOutcomeCode("");
    setOutcomeDescription("");
  };

  const handleRemoveOutcome = (index: number) => {
    const updatedOutcomes = [...courseOutcomes];
    updatedOutcomes.splice(index, 1);
    setCourseOutcomes(updatedOutcomes);
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
              <DialogContent className="sm:max-w-[600px]">
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="courseCode"
                      className="text-right text-gray-600"
                    >
                      Course Code
                    </Label>
                    <Input
                      id="courseCode"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="col-span-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter course code (e.g. DJS22ITL307.1)..."
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-700 mb-4">
                      Course Outcomes
                    </h3>

                    <div className="grid grid-cols-12 items-center gap-4 mb-4">
                      <Label
                        htmlFor="outcomeCode"
                        className="text-right text-gray-600 col-span-2"
                      >
                        Code
                      </Label>
                      <Input
                        id="outcomeCode"
                        value={outcomeCode}
                        onChange={(e) => setOutcomeCode(e.target.value)}
                        className="col-span-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="DJS22ITL307.1"
                      />

                      <Label
                        htmlFor="outcomeDescription"
                        className="text-right text-gray-600 col-span-2"
                      >
                        Description
                      </Label>
                      <Input
                        id="outcomeDescription"
                        value={outcomeDescription}
                        onChange={(e) => setOutcomeDescription(e.target.value)}
                        className="col-span-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Develop web applications."
                      />

                      <Label
                        htmlFor="bloomsLevel"
                        className="text-gray-600 col-span-1"
                      >
                        Level
                      </Label>
                      <select
                        id="bloomsLevel"
                        value={outcomeBloomsLevel}
                        onChange={(e) => setOutcomeBloomsLevel(e.target.value)}
                        className="col-span-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="Remember">Remember</option>
                        <option value="Understand">Understand</option>
                        <option value="Apply">Apply</option>
                        <option value="Analyze">Analyze</option>
                        <option value="Evaluate">Evaluate</option>
                        <option value="Create">Create</option>
                      </select>

                      <Button
                        onClick={handleAddOutcome}
                        type="button"
                        className="col-span-1 bg-green-600 hover:bg-green-700"
                      >
                        +
                      </Button>
                    </div>

                    {courseOutcomes.length > 0 && (
                      <div className="border rounded-md p-4 bg-gray-50 max-h-44 overflow-y-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left border-b">
                              <th className="pb-2 text-sm font-medium text-gray-700 w-1/6">
                                Code
                              </th>
                              <th className="pb-2 text-sm font-medium text-gray-700 w-3/6">
                                Description
                              </th>
                              <th className="pb-2 text-sm font-medium text-gray-700 w-1/6">
                                Bloom's Level
                              </th>
                              <th className="pb-2 text-sm font-medium text-gray-700 w-1/6">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {courseOutcomes.map((outcome, index) => (
                              <tr
                                key={index}
                                className="border-b last:border-b-0"
                              >
                                <td className="py-2 text-sm">{outcome.code}</td>
                                <td className="py-2 text-sm">
                                  {outcome.description}
                                </td>
                                <td className="py-2 text-sm">
                                  {outcome.bloomsLevel}
                                </td>
                                <td className="py-2 text-sm">
                                  <Button
                                    onClick={() => handleRemoveOutcome(index)}
                                    variant="ghost"
                                    className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
