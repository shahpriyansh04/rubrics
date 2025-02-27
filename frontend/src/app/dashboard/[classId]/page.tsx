"use client";

import * as React from "react";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Student {
  id: number;
  name: string;
}

interface Criterion {
  id: number;
  name: string;
  maxMarks: number;
}

interface Class {
  id: number;
  name: string;
  students: Student[];
  criteria: Criterion[];
}

const TOTAL_MARKS = 25;

// Mock data (replace with actual data fetching in a real application)
const mockClass: Class = {
  id: 1,
  name: "Mathematics 101",
  students: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ],
  criteria: [
    { id: 1, name: "Problem Solving", maxMarks: 10 },
    { id: 2, name: "Calculation Accuracy", maxMarks: 8 },
    { id: 3, name: "Presentation", maxMarks: 7 },
  ],
};

export default function ClassDetails() {
  const params = useParams();
  const classId = params.classId;

  const [classData, setClassData] = React.useState<Class>(mockClass);
  const [newStudentName, setNewStudentName] = React.useState("");
  const [newCriterion, setNewCriterion] = React.useState({
    name: "",
    maxMarks: 0,
  });

  const handleAddStudent = () => {
    if (newStudentName) {
      const newStudent: Student = {
        id: Math.max(0, ...classData.students.map((s) => s.id)) + 1,
        name: newStudentName,
      };
      setClassData({
        ...classData,
        students: [...classData.students, newStudent],
      });
      setNewStudentName("");
    }
  };

  const handleAddCriterion = () => {
    if (newCriterion.name && newCriterion.maxMarks > 0) {
      const totalMaxMarks = classData.criteria.reduce(
        (sum, c) => sum + c.maxMarks,
        0
      );

      if (totalMaxMarks + newCriterion.maxMarks > TOTAL_MARKS) {
        alert(`Total max marks cannot exceed ${TOTAL_MARKS}`);
        return;
      }

      const newCrit: Criterion = {
        id: Math.max(0, ...classData.criteria.map((c) => c.id)) + 1,
        ...newCriterion,
      };
      setClassData({
        ...classData,
        criteria: [...classData.criteria, newCrit],
      });
      setNewCriterion({ name: "", maxMarks: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-4xl font-bold text-gray-800">{classData.name}</h1>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold text-gray-700">Students</h2>
        <div className="mb-4 flex items-center gap-2">
          <Input
            placeholder="New student name"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            className="w-64"
          />
          <Button
            onClick={handleAddStudent}
            className="bg-green-500 hover:bg-green-600"
          >
            Add Student
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classData.students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/${classId}/${student.id}`}>
                      View Rubrics
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-semibold text-gray-700">
          Rubric Configuration
        </h2>
        <div className="mb-4 flex items-end gap-2">
          <div>
            <Label htmlFor="criterionName">Criterion Name</Label>
            <Input
              id="criterionName"
              value={newCriterion.name}
              onChange={(e) =>
                setNewCriterion({ ...newCriterion, name: e.target.value })
              }
              className="w-64"
            />
          </div>
          <div>
            <Label htmlFor="maxMarks">Max Marks</Label>
            <Input
              id="maxMarks"
              type="number"
              value={newCriterion.maxMarks}
              onChange={(e) =>
                setNewCriterion({
                  ...newCriterion,
                  maxMarks: Number(e.target.value),
                })
              }
              className="w-24"
            />
          </div>
          <Button
            onClick={handleAddCriterion}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Add Criterion
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criterion</TableHead>
              <TableHead>Max Marks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classData.criteria.map((criterion) => (
              <TableRow key={criterion.id}>
                <TableCell>{criterion.name}</TableCell>
                <TableCell>{criterion.maxMarks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
