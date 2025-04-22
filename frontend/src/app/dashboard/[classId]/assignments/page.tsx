"use client";

import * as React from "react";
import { ArrowLeft, Save } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classApi, type Class } from "@/services/api";

interface GradeResponse {
  column: string;
  grades: { criterion: string; marks: number }[];
  submittedAt?: string;
  submittedBy?: string;
}

interface SubmissionDetails {
  submittedAt: string;
  submittedBy: string;
}

export default function AssignmentGrading() {
  const params = useParams();
  const { data: session, status } = useSession();
  const classId = params.classId as string;

  const [classData, setClassData] = React.useState<Class | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    React.useState<string>("");
  const [studentGrades, setStudentGrades] = React.useState<
    Record<string, Record<string, number>>
  >({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);
  const [savingStudentId, setSavingStudentId] = React.useState<string | null>(
    null
  );
  const [isLoadingGrades, setIsLoadingGrades] = React.useState(false);
  const [submittedGrades, setSubmittedGrades] = React.useState<
    Record<string, SubmissionDetails>
  >({});

  console.log(studentGrades);
  console.log(submittedGrades);

  React.useEffect(() => {
    if (status === "authenticated") {
      fetchClassDetails();
    }
  }, [classId, status]);

  const fetchClassDetails = async () => {
    try {
      setIsLoading(true);
      const data = await classApi.getClass(
        classId,
        session?.user?.token as string
      );
      setClassData(data);

      // Initialize student grades
      const initialGrades: Record<string, Record<string, number>> = {};
      if (data.students) {
        data.students.forEach((student) => {
          initialGrades[student._id] = {};
        });
      }
      setStudentGrades(initialGrades);
    } catch (err) {
      setError("Failed to fetch class details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentChange = async (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    setSaveSuccess(false);
    setLastSavedAt(null);

    if (!classData) return;

    try {
      setIsLoadingGrades(true);
      // Initialize empty grades for all students
      const initialGrades: Record<string, Record<string, number>> = {};
      const initialSubmitted: Record<string, SubmissionDetails> = {};

      // Fetch existing grades for all students
      const gradePromises = classData.students.map(async (student) => {
        try {
          const grades = (await classApi.getStudentGrades(
            classId,
            student._id,
            session?.user?.token as string
          )) as GradeResponse[];

          // Find grades for the selected assignment
          const assignmentGrades = grades.find(
            (g) => g.column === assignmentId
          );

          if (assignmentGrades) {
            // Convert array of grades to object format
            const gradesObject: Record<string, number> = {};
            assignmentGrades.grades.forEach((grade) => {
              gradesObject[grade.criterion] = grade.marks;
            });
            initialGrades[student._id] = gradesObject;

            // Store submission details if available
            // Check for submittedAt directly from assignmentGrades
            if (assignmentGrades.submittedAt) {
              console.log(`Found submission for student ${student._id}:`, {
                submittedAt: assignmentGrades.submittedAt,
                submittedBy: assignmentGrades.submittedBy,
              });

              initialSubmitted[student._id] = {
                submittedAt: assignmentGrades.submittedAt,
                submittedBy: assignmentGrades.submittedBy || "",
              };
            }
          }
        } catch (err) {
          console.error(
            `Failed to fetch grades for student ${student._id}:`,
            err
          );
        }
      });

      await Promise.all(gradePromises);

      // Log the data before setting state
      console.log("Initial grades:", JSON.stringify(initialGrades, null, 2));
      console.log(
        "Initial submitted:",
        JSON.stringify(initialSubmitted, null, 2)
      );

      // Set the state
      setStudentGrades(initialGrades);
      setSubmittedGrades(initialSubmitted);

      // Log the submission state for debugging
      console.log("Submission state after loading:", initialSubmitted);
    } catch (err) {
      setError("Failed to fetch grades");
      console.error(err);
    } finally {
      setIsLoadingGrades(false);
    }
  };

  const handleGradeChange = (
    studentId: string,
    criterion: string,
    value: string
  ) => {
    if (!selectedAssignment) return;

    // Check if grades are already submitted
    if (isGradesSubmitted(studentId)) {
      setError("Grades have already been submitted");
      return;
    }

    const numericValue = value === "none" ? 0 : parseFloat(value);

    setStudentGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [criterion]: numericValue,
      },
    }));
  };

  const handleSaveMarks = async () => {
    if (!classData || !selectedAssignment || session?.user?.role !== "teacher")
      return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Update each student's marks
      const updatePromises = Object.entries(studentGrades).map(
        async ([studentId, grades]) => {
          if (Object.keys(grades).length > 0) {
            // Convert the grades object to the format expected by the API
            const gradesArray = Object.entries(grades).map(
              ([criterion, marks]) => ({
                criterion,
                marks,
              })
            );

            // Use column instead of selectedAssignment to match API expectations
            await classApi.updateStudentGrades(
              classId,
              studentId,
              selectedAssignment, // column name from the selected assignment
              gradesArray,
              session?.user?.token as string
            );
          }
        }
      );

      await Promise.all(updatePromises);

      // Set the current date and time
      const now = new Date();
      setLastSavedAt(now.toLocaleString());
      setSaveSuccess(true);

      // Refresh class data
      await fetchClassDetails();
    } catch (err) {
      setSaveError("Failed to save marks");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitStudentGrades = async (studentId: string) => {
    if (!classData || !selectedAssignment || session?.user?.role !== "teacher")
      return;

    setSavingStudentId(studentId);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // First save the grades
      const grades = studentGrades[studentId] || {};

      if (Object.keys(grades).length > 0) {
        // Convert the grades object to the format expected by the API
        const gradesArray = Object.entries(grades).map(
          ([criterion, marks]) => ({
            criterion,
            marks,
          })
        );

        // Save the grades
        await classApi.updateStudentGrades(
          classId,
          studentId,
          selectedAssignment,
          gradesArray,
          session?.user?.token as string
        );

        // Then submit the grades
        const submittedGradesResponse = await classApi.submitGrades(
          classId,
          studentId,
          selectedAssignment,
          session?.user?.token as string
        );

        // Update the submitted grades state
        console.log("Updating submitted grades after submission:", {
          studentId,
          submittedAt: submittedGradesResponse.submittedAt,
          submittedBy: submittedGradesResponse.submittedBy,
        });

        setSubmittedGrades((prev) => {
          const updated = {
            ...prev,
            [studentId]: {
              submittedAt: submittedGradesResponse.submittedAt,
              submittedBy: submittedGradesResponse.submittedBy,
            },
          };
          console.log("Updated submitted grades:", updated);
          return updated;
        });

        // Set the current date and time
        const now = new Date();
        setLastSavedAt(now.toLocaleString());
        setSaveSuccess(true);
      }
    } catch (err) {
      setSaveError("Failed to submit grades");
      console.error(err);
    } finally {
      setSavingStudentId(null);
    }
  };

  const isGradesSubmitted = (studentId: string) => {
    const isSubmitted = !!submittedGrades[studentId]?.submittedAt;
    console.log(`Checking submission state for student ${studentId}:`, {
      submittedGrades: submittedGrades[studentId],
      isSubmitted,
    });
    return isSubmitted;
  };

  const getSubmittedDate = (studentId: string) => {
    const submittedAt = submittedGrades[studentId]?.submittedAt;
    console.log(
      `Getting submission date for student ${studentId}:`,
      submittedAt
    );
    return submittedAt;
  };

  // Get enabled criteria from the class data
  const enabledCriteria = React.useMemo(() => {
    if (!classData) return [];
    return classData.rubrics.filter((criterion) => criterion.enabled);
  }, [classData]);

  // Add a useEffect to log the submittedGrades state whenever it changes
  React.useEffect(() => {
    console.log("submittedGrades state updated:", submittedGrades);
  }, [submittedGrades]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href={`/dashboard/${classId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Class
          </Link>
        </Button>
        <h1 className="text-4xl font-bold text-gray-800">{classData.name}</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mt-2">
          Assignment Grading
        </h2>
      </div>

      {session?.user?.role === "teacher" && (
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4">
            <Label htmlFor="assignment-select">
              Select Assignment/Experiment
            </Label>
            <Select
              value={selectedAssignment}
              onValueChange={handleAssignmentChange}
            >
              <SelectTrigger id="assignment-select" className="w-full">
                <SelectValue placeholder="Select an assignment or experiment" />
              </SelectTrigger>
              <SelectContent>
                {classData.columns.map((column, index) => (
                  <SelectItem key={index} value={column.name}>
                    {column.name} ({column.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAssignment && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <Button
                  onClick={handleSaveMarks}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save All Marks"}
                </Button>

                {lastSavedAt && (
                  <span className="text-sm text-gray-500">
                    Last saved: {lastSavedAt}
                  </span>
                )}
              </div>

              {saveError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
                  Marks saved successfully!
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10">
                        Roll No
                      </TableHead>
                      <TableHead className="sticky left-0 bg-white z-10">
                        Name
                      </TableHead>
                      <TableHead className="sticky left-0 bg-white z-10">
                        SAP ID
                      </TableHead>
                      {enabledCriteria.map((criterion) => (
                        <TableHead key={criterion.name} className="text-center">
                          {criterion.name} (/{criterion.maxMarks})
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingGrades ? (
                      <TableRow>
                        <TableCell
                          colSpan={enabledCriteria.length + 4}
                          className="text-center py-8"
                        >
                          Loading grades...
                        </TableCell>
                      </TableRow>
                    ) : (
                      classData.students.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell className="sticky left-0 bg-white z-10">
                            {student.rollno}
                          </TableCell>
                          <TableCell className="sticky left-0 bg-white z-10">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell className="sticky left-0 bg-white z-10">
                            {student.sapid}
                          </TableCell>
                          {enabledCriteria.map((criterion) => (
                            <TableCell
                              key={criterion.name}
                              className="text-center"
                            >
                              <Select
                                value={String(
                                  studentGrades[student._id]?.[
                                    criterion.name
                                  ] || "none"
                                )}
                                onValueChange={(value) =>
                                  handleGradeChange(
                                    student._id,
                                    criterion.name,
                                    value
                                  )
                                }
                                disabled={isGradesSubmitted(student._id)}
                              >
                                <SelectTrigger className="w-20 mx-auto">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">-</SelectItem>
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
                          ))}
                          <TableCell className="text-center">
                            {isGradesSubmitted(student._id) ? (
                              <div className="text-sm text-gray-500">
                                Submitted on{" "}
                                {new Date(
                                  getSubmittedDate(student._id)!
                                ).toLocaleString()}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    handleSubmitStudentGrades(student._id)
                                  }
                                  disabled={savingStudentId === student._id}
                                >
                                  {savingStudentId === student._id
                                    ? "Submitting..."
                                    : "Submit"}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}

      {session?.user?.role !== "teacher" && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <p className="text-gray-700">Only teachers can access this page.</p>
        </div>
      )}
    </div>
  );
}
