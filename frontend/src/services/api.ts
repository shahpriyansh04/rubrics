import axios, { InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  sapid: string;
  rollno: string;
  year: string;
  class: string;
  batch: string;
  sem: string;
  role: "student" | "teacher" | "admin";
};

export type Class = {
  _id: string;
  name: string;
  description?: string;
  code: string;
  teacher: User;
  students: User[];
  rubrics: Array<{
    name: string;
    maxMarks: number;
    enabled: boolean;
  }>;
  columns: Array<{
    name: string;
    type: "Experiment" | "Assignment" | "Mini Project";
  }>;
};

export const classApi = {
  getClasses: async (token: string): Promise<Class[]> => {
    const response = await api.get('/class', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  getClass: async (classId: string, token: string): Promise<Class> => {
    const response = await api.get(`/class/${classId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  createClass: async (data: { name: string; description?: string }, token: string): Promise<Class> => {
    const response = await api.post('/class', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  addStudent: async (classId: string, studentId: string, token: string): Promise<Class> => {
    const response = await api.post(`/class/${classId}/students`, { studentId }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  removeStudent: async (classId: string, studentId: string, token: string): Promise<Class> => {
    const response = await api.delete(`/class/${classId}/students/${studentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  joinClass: async (code: string, token: string): Promise<{ message: string }> => {
    const response = await api.post('/class/join', { code }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  updateRubrics: async (
    classId: string,
    rubrics: Array<{ name: string; maxMarks: number; enabled: boolean }>,
    token: string
  ): Promise<Class> => {
    const response = await fetch(`${API_URL}/class/${classId}/rubrics`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rubrics }),
    });

    if (!response.ok) {
      throw new Error("Failed to update rubrics");
    }

    return response.json();
  },

  updateColumns: async (
    classId: string,
    columns: Array<{ name: string; type: "Experiment" | "Assignment" | "Mini Project" }>,
    token: string
  ): Promise<Class> => {
    const response = await fetch(`${API_URL}/class/${classId}/columns`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ columns }),
    });

    if (!response.ok) {
      throw new Error("Failed to update columns");
    }

    return response.json();
  },

  getStudentGrades: async (
    classId: string,
    studentId: string,
    token: string
  ): Promise<Array<{
    column: string;
    grades: Array<{
      criterion: string;
      marks: number;
    }>;
  }>> => {
    const response = await api.get(`/grades/${classId}/${studentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  updateStudentGrades: async (
    classId: string,
    studentId: string,
    column: string,
    grades: Array<{
      criterion: string;
      marks: number;
    }>,
    token: string
  ): Promise<{
    class: string;
    student: string;
    column: string;
    grades: Array<{
      criterion: string;
      marks: number;
    }>;
  }> => {
    const response = await api.post(
      `/grades/${classId}/${studentId}`,
      { column, grades },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  submitGrades: async (
    classId: string,
    studentId: string,
    column: string,
    token: string
  ): Promise<{
    class: string;
    student: string;
    column: string;
    grades: Array<{
      criterion: string;
      marks: number;
    }>;
    submittedAt: string;
    submittedBy: string;
  }> => {
    const response = await api.post(
      `/grades/${classId}/${studentId}/submit`,
      { column },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};

export const userApi = {
  getUserBySapId: async (sapid: string, token: string): Promise<User> => {
    const response = await api.get(`/users/sapid/${sapid}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
}; 