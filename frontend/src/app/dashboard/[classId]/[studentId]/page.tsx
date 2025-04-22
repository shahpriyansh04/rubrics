"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classApi, type Class } from "@/services/api";
import { DownloadRubricButton } from "@/components/DownloadRubricButton";

const TOTAL_MARKS = 25;

export default function StudentRubrics() {
  const params = useParams();
  const { data: session, status } = useSession();
  const classId = params.classId as string;
  const studentId = params.studentId as string;

  const [classData, setClassData] = React.useState<Class | null>(null);
  const [studentGrades, setStudentGrades] = React.useState<
    Array<{
      column: string;
      grades: Array<{
        criterion: string;
        marks: number;
      }>;
      submittedAt?: string;
      submittedBy?: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "student" && session.user.id !== studentId) {
        setError("You can only view your own rubrics");
        setIsLoading(false);
        return;
      }
      fetchData();
    }
  }, [classId, studentId, status, session?.user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [classResponse, gradesResponse] = await Promise.all([
        classApi.getClass(classId, session?.user?.token as string),
        classApi.getStudentGrades(
          classId,
          studentId,
          session?.user?.token as string
        ),
      ]);
      setClassData(classResponse);
      setStudentGrades(gradesResponse);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeChange = async (
    criterion: string,
    column: string,
    value: number
  ) => {
    if (!classData || session?.user?.role !== "teacher") return;

    try {
      const columnGrades = studentGrades.find((g) => g.column === column);
      const existingGrades = columnGrades?.grades || [];

      if (columnGrades?.submittedAt) {
        setError("Grades have already been submitted");
        return;
      }

      const updatedGrades = existingGrades.some(
        (g) => g.criterion === criterion
      )
        ? existingGrades.map((g) =>
            g.criterion === criterion ? { ...g, marks: value } : g
          )
        : [...existingGrades, { criterion, marks: value }];

      const totalMarks = updatedGrades.reduce((sum, g) => sum + g.marks, 0);
      if (totalMarks > TOTAL_MARKS) {
        setError(`Total marks cannot exceed ${TOTAL_MARKS}`);
        return;
      }

      setStudentGrades((prev) =>
        prev.some((g) => g.column === column)
          ? prev.map((g) =>
              g.column === column ? { ...g, grades: updatedGrades } : g
            )
          : [...prev, { column, grades: updatedGrades }]
      );
    } catch (err) {
      setError("Failed to update grade");
      console.error(err);
    }
  };

  const handleSubmitGrades = async (column: string) => {
    if (!classData || session?.user?.role !== "teacher") return;

    try {
      const columnGrades = studentGrades.find((g) => g.column === column);
      if (!columnGrades) {
        setError("No grades to submit");
        return;
      }

      await classApi.updateStudentGrades(
        classId,
        studentId,
        column,
        columnGrades.grades,
        session?.user?.token as string
      );

      const submittedGrades = await classApi.submitGrades(
        classId,
        studentId,
        column,
        session?.user?.token as string
      );

      setStudentGrades((prev) =>
        prev.map((g) =>
          g.column === column
            ? {
                ...g,
                submittedAt: submittedGrades.submittedAt,
                submittedBy: submittedGrades.submittedBy,
              }
            : g
        )
      );
    } catch (err) {
      setError("Failed to submit grades");
      console.error(err);
    }
  };

  const getGradeForCriterion = (criterion: string, column: string) => {
    const columnGrades = studentGrades.find((g) => g.column === column);
    return (
      columnGrades?.grades.find((g) => g.criterion === criterion)?.marks || 0
    );
  };

  const calculateTotalMarks = (column: string) => {
    return (
      studentGrades
        .find((g) => g.column === column)
        ?.grades.reduce((sum, g) => sum + g.marks, 0) || 0
    );
  };

  const isGradesSubmitted = (column: string) => {
    return !!studentGrades.find((g) => g.column === column)?.submittedAt;
  };

  const getSubmittedDate = (column: string) => {
    return studentGrades.find((g) => g.column === column)?.submittedAt;
  };

  if (status === "loading" || isLoading) {
    return <div className="min-h-screen bg-gray-100 p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 text-red-500">{error}</div>
    );
  }

  if (!classData) {
    return <div className="min-h-screen bg-gray-100 p-8">Class not found</div>;
  }

  const student = classData.students.find((s) => s._id === studentId);
  if (!student) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">Student not found</div>
    );
  }

  const enabledCriteria = classData.rubrics.filter((c) => c.enabled);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href={`/dashboard/${classId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Class
          </Link>
        </Button>
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">
            Rubrics for {student.firstName} {student.lastName}
          </h1>
          <DownloadRubricButton studentId={studentId} classId={classId} />
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">SAP ID</p>
            <p className="font-medium">{student.sapid}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Roll No</p>
            <p className="font-medium">{student.rollno}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Class</p>
            <p className="font-medium">{student.class}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Batch</p>
            <p className="font-medium">{student.batch}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Year</p>
            <p className="font-medium">{student.year}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Semester</p>
            <p className="font-medium">{student.sem}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-blue-50">Criterion</TableHead>
              {classData.columns.map((column) => {
                const columnGrades = studentGrades.find(
                  (g) => g.column === column.name
                );
                if (
                  session?.user?.role === "student" &&
                  !columnGrades?.submittedAt
                ) {
                  return null;
                }
                return (
                  <TableHead
                    key={column.name}
                    className={`bg-blue-50 ${
                      column.type === "Experiment"
                        ? "text-blue-700"
                        : column.type === "Assignment"
                        ? "text-purple-700"
                        : column.type === "Mini Project"
                        ? "text-green-700"
                        : "text-gray-700"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{column.name}</span>
                      {session?.user?.role === "teacher" &&
                        !isGradesSubmitted(column.name) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleSubmitGrades(column.name)}
                          >
                            Submit
                          </Button>
                        )}
                      {isGradesSubmitted(column.name) && (
                        <span className="text-sm text-gray-500 mt-2">
                          Submitted on{" "}
                          {new Date(
                            getSubmittedDate(column.name)!
                          ).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {enabledCriteria.map((criterion) => (
              <TableRow key={criterion.name}>
                <TableCell className="font-medium">
                  {criterion.name} (/{criterion.maxMarks})
                </TableCell>
                {classData.columns.map((column) => {
                  const columnGrades = studentGrades.find(
                    (g) => g.column === column.name
                  );
                  if (
                    session?.user?.role === "student" &&
                    !columnGrades?.submittedAt
                  ) {
                    return null;
                  }
                  return (
                    <TableCell key={column.name}>
                      <Select
                        value={String(
                          getGradeForCriterion(criterion.name, column.name)
                        )}
                        onValueChange={(value) =>
                          handleGradeChange(
                            criterion.name,
                            column.name,
                            Number(value)
                          )
                        }
                        disabled={
                          isGradesSubmitted(column.name) ||
                          session?.user?.role === "student"
                        }
                      >
                        <SelectTrigger
                          className={`w-16 ${
                            column.type === "Experiment"
                              ? "border-blue-200"
                              : column.type === "Assignment"
                              ? "border-purple-200"
                              : column.type === "Mini Project"
                              ? "border-green-200"
                              : ""
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === "Tab" && !e.shiftKey) {
                              e.preventDefault();
                              const currentIndex = enabledCriteria.findIndex(
                                (c) => c.name === criterion.name
                              );
                              const nextIndex =
                                (currentIndex + 1) % enabledCriteria.length;
                              const nextCriterion = enabledCriteria[nextIndex];
                              const nextTrigger = document.querySelector(
                                `[data-criterion="${nextCriterion.name}"][data-column="${column.name}"]`
                              ) as HTMLElement;
                              if (nextTrigger) {
                                nextTrigger.focus();
                              }
                            }
                          }}
                          data-criterion={criterion.name}
                          data-column={column.name}
                        >
                          <SelectValue placeholder="0" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: criterion.maxMarks + 1 },
                            (_, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {i}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-bold bg-green-50">
                Total (/{TOTAL_MARKS})
              </TableCell>
              {classData.columns.map((column) => (
                <TableCell key={column.name} className="font-bold bg-green-50">
                  {calculateTotalMarks(column.name)}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
