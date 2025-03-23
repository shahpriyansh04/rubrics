"use client";

import * as React from "react";
import { ArrowLeft, PlusCircle, Settings } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { classApi, type Class, userApi } from "@/services/api";

export default function ClassDetails() {
  const params = useParams();
  const { data: session, status } = useSession();
  const classId = params.classId as string;

  const [classData, setClassData] = React.useState<Class | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [newStudentEmail, setNewStudentEmail] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCriteriaDialogOpen, setIsCriteriaDialogOpen] = React.useState(false);
  const [criteria, setCriteria] = React.useState<
    Array<{ name: string; maxMarks: number; enabled: boolean }>
  >([]);
  const [tempCriteria, setTempCriteria] = React.useState<
    Array<{ name: string; maxMarks: number; enabled: boolean }>
  >([]);
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [isColumnsDialogOpen, setIsColumnsDialogOpen] = React.useState(false);
  const [tempColumns, setTempColumns] = React.useState<
    Array<{ name: string; type: "Experiment" | "Assignment" | "Mini Project" }>
  >([]);
  const [newColumnName, setNewColumnName] = React.useState("");
  const [newColumnType, setNewColumnType] = React.useState<
    "Experiment" | "Assignment" | "Mini Project"
  >("Experiment");

  React.useEffect(() => {
    if (status === "authenticated") {
      fetchClassDetails();
    }
  }, [classId, status]);
  const fetchClassDetails = async () => {
    try {
      setIsLoading(true);
      console.log(session?.user?.token);
      const data = await classApi.getClass(
        classId,
        session?.user?.token as string
      );
      setClassData(data);
      setCriteria(data.rubrics || []);
      setTempCriteria(data.rubrics || []);
      setTempColumns(data.columns || []);
    } catch (err) {
      setError("Failed to fetch class details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentEmail || !classData || session?.user?.role !== "teacher")
      return;

    try {
      const student = await userApi.getUserBySapId(
        newStudentEmail,
        session?.user?.token as string
      );

      if (!student) {
        setError("Student not found");
        return;
      }

      const updatedClass = await classApi.addStudent(
        classId,
        student._id,
        session?.user?.token as string
      );
      setClassData(updatedClass);
      setNewStudentEmail("");
      setError(null);
    } catch (err) {
      setError("Failed to add student");
      console.error(err);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!classData || session?.user?.role !== "teacher") return;

    try {
      const updatedClass = await classApi.removeStudent(
        classId,
        studentId,
        session?.user?.token as string
      );
      setClassData(updatedClass);
    } catch (err) {
      setError("Failed to remove student");
      console.error(err);
    }
  };

  const handleTempCriteriaChange = (
    index: number,
    field: "enabled" | "maxMarks",
    value: boolean | number
  ) => {
    const newCriteria = [...tempCriteria];
    newCriteria[index] = {
      ...newCriteria[index],
      [field]: value,
    };
    setTempCriteria(newCriteria);
  };

  const handleSaveCriteria = async () => {
    if (!classData || session?.user?.role !== "teacher") return;

    const totalMarks = tempCriteria.reduce((sum, c) => {
      const marks = c.enabled ? c.maxMarks : 0;
      console.log(
        `Criterion: ${c.name}, Enabled: ${c.enabled}, Marks: ${marks}`
      );
      return sum + marks;
    }, 0);

    console.log("Total marks:", totalMarks);

    if (totalMarks !== 25) {
      setModalError(`Total marks must equal 25 (current: ${totalMarks})`);
      return;
    }

    try {
      const updatedClass = await classApi.updateRubrics(
        classId,
        tempCriteria,
        session?.user?.token as string
      );
      setClassData(updatedClass);
      setCriteria(tempCriteria);
      setModalError(null);
      setIsCriteriaDialogOpen(false);
    } catch (err) {
      setModalError("Failed to update criteria");
      console.error(err);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsCriteriaDialogOpen(open);
    if (!open) {
      setTempCriteria(criteria);
      setModalError(null);
    }
  };

  const handleColumnsDialogOpenChange = (open: boolean) => {
    setIsColumnsDialogOpen(open);
    if (!open) {
      setTempColumns(classData?.columns || []);
      setModalError(null);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName) return;

    const newColumn = {
      name: newColumnName,
      type: newColumnType,
    };

    setTempColumns([...tempColumns, newColumn]);
    setNewColumnName("");
  };

  const handleRemoveColumn = (index: number) => {
    const newColumns = tempColumns.filter((_, i) => i !== index);
    setTempColumns(newColumns);
  };

  const handleSaveColumns = async () => {
    if (!classData || session?.user?.role !== "teacher") return;

    try {
      const updatedClass = await classApi.updateColumns(
        classId,
        tempColumns,
        session?.user?.token as string
      );
      setClassData(updatedClass);
      setModalError(null);
      setIsColumnsDialogOpen(false);
    } catch (err) {
      setModalError("Failed to update experiments/assignments");
      console.error(err);
    }
  };

  const filteredStudents = React.useMemo(() => {
    if (!classData?.students) return [];

    let filtered = [...classData.students];

    filtered.sort((a, b) => {
      if (!a.rollno && !b.rollno) return 0;
      if (!a.rollno) return 1;
      if (!b.rollno) return -1;
      return a.rollno.localeCompare(b.rollno);
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((student) => {
        const fullName =
          `${student.firstName} ${student.lastName}`.toLowerCase();
        return (
          fullName.includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.sapid.toLowerCase().includes(query) ||
          student.rollno.toLowerCase().includes(query) ||
          student.class.toLowerCase().includes(query) ||
          student.batch.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [classData?.students, searchQuery]);

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
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-4xl font-bold text-gray-800">{classData.name}</h1>
      </div>

      {session?.user?.role === "teacher" && (
        <>
          <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-semibold text-gray-700">
              Join Code
            </h2>
            <div className="flex items-center gap-4">
              <div className="rounded-md bg-gray-100 px-4 py-2 font-mono text-lg font-bold text-gray-800">
                {classData.code}
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(classData.code);
                }}
              >
                Copy Code
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Share this code with your students so they can join the class.
            </p>
          </div>

          <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-700">
                Grading Criteria
              </h2>
              <Dialog
                open={isCriteriaDialogOpen}
                onOpenChange={handleDialogOpenChange}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Manage Criteria
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800">
                      Manage Grading Criteria
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {modalError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                        {modalError}
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Criterion</TableHead>
                          <TableHead>Max Marks</TableHead>
                          <TableHead>Enabled</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tempCriteria.map((criterion, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {criterion.name}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                value={criterion.maxMarks}
                                onChange={(e) =>
                                  handleTempCriteriaChange(
                                    index,
                                    "maxMarks",
                                    parseInt(e.target.value)
                                  )
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={criterion.enabled}
                                onCheckedChange={(checked) =>
                                  handleTempCriteriaChange(
                                    index,
                                    "enabled",
                                    checked
                                  )
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="text-sm text-gray-600">
                      Total marks:{" "}
                      {tempCriteria.reduce(
                        (sum, c) => sum + (c.enabled ? c.maxMarks : 0),
                        0
                      )}
                      /25
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSaveCriteria}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criteria.map((criterion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    criterion.enabled
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {criterion.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {criterion.maxMarks} marks
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {criterion.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-700">
                Experiments & Assignments
              </h2>
              <Dialog
                open={isColumnsDialogOpen}
                onOpenChange={handleColumnsDialogOpenChange}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Manage Items
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800">
                      Manage Experiments & Assignments
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {modalError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                        {modalError}
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <Input
                        placeholder="Item name"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        className="flex-1"
                      />
                      <select
                        value={newColumnType}
                        onChange={(e) =>
                          setNewColumnType(
                            e.target.value as
                              | "Experiment"
                              | "Assignment"
                              | "Mini Project"
                          )
                        }
                        className="rounded-md border border-input bg-background px-3 py-2"
                      >
                        <option value="Experiment">Experiment</option>
                        <option value="Assignment">Assignment</option>
                        <option value="Mini Project">Mini Project</option>
                      </select>
                      <Button onClick={handleAddColumn}>Add</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tempColumns.map((column, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {column.name}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  column.type === "Experiment"
                                    ? "bg-blue-100 text-blue-700"
                                    : column.type === "Assignment"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {column.type}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                onClick={() => handleRemoveColumn(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <DialogFooter>
                      <Button
                        onClick={handleSaveColumns}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classData.columns.map((column, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    column.type === "Experiment"
                      ? "bg-blue-50 border-blue-200"
                      : column.type === "Assignment"
                      ? "bg-purple-50 border-purple-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{column.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        column.type === "Experiment"
                          ? "bg-blue-100 text-blue-700"
                          : column.type === "Assignment"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {column.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold text-gray-700">Students</h2>
        <div className="mb-4 flex items-center gap-2">
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          {session?.user?.role === "teacher" && (
            <>
              <Input
                placeholder="Student SAP ID"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                className="w-64"
              />
              <Button
                onClick={handleAddStudent}
                className="bg-green-500 hover:bg-green-600"
              >
                Add Student
              </Button>
            </>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SAP ID</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Sem</TableHead>
              {session?.user?.role === "teacher" && (
                <TableHead>Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.rollno}</TableCell>
                <TableCell>
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell>{student.sapid}</TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>{student.batch}</TableCell>
                <TableCell>{student.sem}</TableCell>
                {session?.user?.role === "teacher" && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveStudent(student._id)}
                      >
                        Remove
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/${classId}/${student._id}`}>
                          View Rubrics
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                )}
                {session?.user?.role === "student" &&
                  student._id === session.user.id && (
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/${classId}/${student._id}`}>
                          View Rubrics
                        </Link>
                      </Button>
                    </TableCell>
                  )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
