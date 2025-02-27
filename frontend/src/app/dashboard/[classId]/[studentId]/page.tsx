"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
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

// Mock data (replace with actual data fetching in a real application)
const mockData = {
  student: { id: 1, name: "Alice" },
  criteria: [
    { id: 1, name: "Problem Solving", maxMarks: 10 },
    { id: 2, name: "Calculation Accuracy", maxMarks: 8 },
    { id: 3, name: "Presentation", maxMarks: 7 },
  ],
};

const MAX_EXPERIMENTS = 8;
const TOTAL_MARKS = 25;

export default function StudentRubrics() {
  const params = useParams();
  const classId = params.classId;
  const studentId = params.studentId;

  const [student, setStudent] = React.useState(mockData.student);
  const [criteria, setCriteria] = React.useState(mockData.criteria);
  const [grades, setGrades] = React.useState<number[][]>(
    Array(criteria.length).fill(Array(MAX_EXPERIMENTS).fill(0))
  );

  const handleGradeChange = (
    criterionIndex: number,
    experimentIndex: number,
    value: number
  ) => {
    const newGrades = grades.map((row, i) =>
      i === criterionIndex
        ? row.map((grade, j) => (j === experimentIndex ? value : grade))
        : row
    );

    // Ensure total doesn't exceed TOTAL_MARKS
    const columnTotal = newGrades.reduce(
      (sum, row) => sum + row[experimentIndex],
      0
    );
    if (columnTotal > TOTAL_MARKS) {
      const excess = columnTotal - TOTAL_MARKS;
      newGrades[criterionIndex][experimentIndex] -= excess;
    }

    setGrades(newGrades);
  };

  const calculateTotalMarks = (experimentIndex: number) => {
    return grades.reduce((sum, row) => sum + row[experimentIndex], 0);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href={`/dashboard/${classId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Class
          </Link>
        </Button>
        <h1 className="text-4xl font-bold text-gray-800">
          Rubrics for {student.name}
        </h1>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-blue-50">Criterion</TableHead>
              {Array.from({ length: MAX_EXPERIMENTS }, (_, i) => (
                <TableHead key={i} className="bg-blue-50">
                  Exp {i + 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {criteria.map((criterion, criterionIndex) => (
              <TableRow key={criterion.id}>
                <TableCell className="font-medium">
                  {criterion.name} (/{criterion.maxMarks})
                </TableCell>
                {Array.from({ length: MAX_EXPERIMENTS }, (_, expIndex) => (
                  <TableCell key={expIndex}>
                    <Input
                      type="number"
                      min="0"
                      max={criterion.maxMarks}
                      value={grades[criterionIndex][expIndex] || ""}
                      onChange={(e) =>
                        handleGradeChange(
                          criterionIndex,
                          expIndex,
                          Number(e.target.value)
                        )
                      }
                      className="w-16"
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-bold bg-green-50">
                Total (/{TOTAL_MARKS})
              </TableCell>
              {Array.from({ length: MAX_EXPERIMENTS }, (_, expIndex) => (
                <TableCell key={expIndex} className="font-bold bg-green-50">
                  {calculateTotalMarks(expIndex)}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
