"use client";

import * as React from "react";
import { Book, PlusCircle } from "lucide-react";
import Link from "next/link";

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

interface Class {
  id: number;
  name: string;
  studentCount: number;
}

const initialClasses: Class[] = [
  { id: 1, name: "Mathematics 101", studentCount: 25 },
  { id: 2, name: "Physics 202", studentCount: 20 },
  { id: 3, name: "Chemistry 303", studentCount: 18 },
];

export default function Dashboard() {
  const [classes, setClasses] = React.useState<Class[]>(initialClasses);
  const [newClassName, setNewClassName] = React.useState("");

  const handleAddClass = () => {
    if (newClassName) {
      const newClass: Class = {
        id: classes.length + 1,
        name: newClassName,
        studentCount: 0,
      };
      setClasses([...classes, newClass]);
      setNewClassName("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-800">
        Teacher Dashboard
      </h1>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-700">Your Classes</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Class Name
                </Label>
                <Input
                  id="name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddClass}>Add Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <Card
            key={cls.id}
            className="hover:shadow-lg transition-shadow duration-300"
          >
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-xl font-semibold text-blue-800">
                {cls.name}
              </CardTitle>
              <CardDescription>{cls.studentCount} students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                asChild
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <Link href={`/dashboard/${cls.id}`}>View Class</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
