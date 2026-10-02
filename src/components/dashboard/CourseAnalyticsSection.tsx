"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/exportCsv";
import { CourseManagementModal } from "@/components/dashboard/CourseManagementModal";
import {
  IndividualStudentRecordModal,
  StudentAnalyticsItem,
} from "@/components/dashboard/IndividualStudentRecordModal";
import {
  BookOpen,
  Plus,
  Users,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export interface CourseSummary {
  id: string;
  code: string;
  name: string;
  department: string;
  studentLimit: number;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    enrollments: number;
    sessions: number;
  };
}

export interface CourseAnalyticsData {
  course: {
    id: string;
    code: string;
    name: string;
    department: string;
    studentLimit: number;
    totalSessions: number;
    enrolledCount: number;
    averageAttendanceRate: number;
  };
  students: StudentAnalyticsItem[];
  sessions: Array<{
    id: string;
    status: string;
    createdAt: string;
    classroom: string;
    attendeeCount: number;
  }>;
}

export interface CourseAnalyticsSectionProps {
  teacherId?: string;
  onStartSessionForCourse?: (courseId: string) => void;
}

export function CourseAnalyticsSection({
  teacherId,
  onStartSessionForCourse,
}: CourseAnalyticsSectionProps) {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CourseAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);

  // Individual student inspection modal state
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalyticsItem | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // 1. Fetch professor's courses
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch(`/api/v1/courses?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
          if (data.courses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(data.courses[0].id);
          }
        }
      }
    } catch (err) {
      console.error("[CourseAnalyticsSection] Failed to load courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  }, [selectedCourseId]);

  // 2. Fetch detailed analytics for selected course
  const fetchAnalytics = useCallback(async (courseId: string) => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/analytics?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalytics(data);
        }
      }
    } catch (err) {
      console.error("[CourseAnalyticsSection] Failed to fetch analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      void fetchAnalytics(selectedCourseId);
    }
  }, [selectedCourseId, fetchAnalytics]);

  // Download Course Master CSV
  const handleExportCourseCsv = () => {
    if (!analytics) return;

    const headers = [
      "Roll Number",
      "Student Name",
      "Email",
      "Department",
      "Total Lectures Held",
      "Lectures Attended",
      "Attendance Percentage",
      "Standing Status",
    ];

    const rows = analytics.students.map((st) => [
      st.rollNumber,
      st.name,
      st.email,
      st.department,
      st.totalSessions,
      st.attendedCount,
      `${st.attendancePercentage}%`,
      st.attendancePercentage >= 75 ? "GOOD (≥75%)" : "CRITICAL (<75%)",
    ]);

    downloadCsv(`MasterAttendance_${analytics.course.code}_${Date.now()}`, headers, rows);
  };

  const filteredStudents = analytics?.students.filter((st) => {
    const q = studentSearch.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.rollNumber.toLowerCase().includes(q) ||
      st.email.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Courses Bar & Add Class Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-400" />
            Class Directory & Attendance Analytics
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your courses, set student capacity limits, and audit individual student records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchCourses()}
            disabled={loadingCourses}
            className="text-xs gap-1.5 h-8 text-zinc-300 hover:text-white border-zinc-700 bg-zinc-800/60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingCourses ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddCourseOpen(true)}
            className="text-xs gap-1.5 h-8 shadow-md shadow-blue-600/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New Class
          </Button>
        </div>
      </div>

      {/* Course Selector Carousel / Pills */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {loadingCourses ? (
          <div className="flex gap-2.5">
            <div className="h-10 w-44 bg-zinc-800/60 animate-pulse rounded-xl" />
            <div className="h-10 w-44 bg-zinc-800/60 animate-pulse rounded-xl" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-xs text-zinc-500 py-2">
            No classes found. Click &quot;Add New Class&quot; to create your first course.
          </div>
        ) : (
          courses.map((c) => {
            const isSelected = c.id === selectedCourseId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all shrink-0 text-left ${
                  isSelected
                    ? "bg-zinc-800 border-blue-500/60 text-white shadow-lg shadow-blue-900/10 ring-1 ring-blue-500/30"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-zinc-100">{c.code}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-zinc-700 text-zinc-400">
                      Cap: {c.studentLimit || 60}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-zinc-400 max-w-[160px] truncate">{c.name}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selected Course Analytics View */}
      {loadingAnalytics ? (
        <div className="p-12 text-center space-y-3 border border-zinc-800 rounded-2xl bg-zinc-900/20 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-zinc-800 mx-auto" />
          <div className="h-4 w-48 bg-zinc-800 rounded mx-auto" />
          <div className="h-3 w-64 bg-zinc-800/60 rounded mx-auto" />
        </div>
      ) : analytics ? (
        <div className="space-y-5">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">Total Lectures Held</span>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {analytics.course.totalSessions}
              </div>
              <p className="text-[10px] text-zinc-500">Live dual presence sessions</p>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">Enrolled Students</span>
              <div className="text-2xl font-bold font-mono text-zinc-100 flex items-center gap-2">
                <span>{analytics.course.enrolledCount}</span>
                <span className="text-xs text-zinc-500 font-normal">/ {analytics.course.studentLimit} Limit</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((analytics.course.enrolledCount / (analytics.course.studentLimit || 60)) * 100))}%`,
                  }}
                />
              </div>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">Average Attendance</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {analytics.course.averageAttendanceRate}%
              </div>
              <p className="text-[10px] text-zinc-500">Across all completed lectures</p>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/40 p-4 space-y-2 flex flex-col justify-between">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">Classroom Export</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCourseCsv}
                className="w-full text-xs gap-1.5 h-8 text-zinc-200 border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700"
              >
                <Download className="h-3.5 w-3.5 text-blue-400" />
                Download Master CSV
              </Button>
            </Card>
          </div>

          {/* Student Roster Table with Individual Record Inspection */}
          <Card className="border-zinc-800 bg-zinc-900/30 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-400" />
                  Enrolled Students & Individual Attendance Records ({filteredStudents.length})
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Click on any student row to inspect their complete verification timestamp history
                </p>
              </div>

              {/* Student Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search name, roll no..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No students match your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase font-mono">
                    <tr>
                      <th className="py-2.5 px-4">Roll Number</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Lectures Attended</th>
                      <th className="py-2.5 px-4">Attendance Rate</th>
                      <th className="py-2.5 px-4">Standing</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredStudents.map((st) => {
                      const isGood = st.attendancePercentage >= 75;

                      return (
                        <tr
                          key={st.id}
                          onClick={() => {
                            setSelectedStudent(st);
                            setIsStudentModalOpen(true);
                          }}
                          className="hover:bg-zinc-800/40 cursor-pointer transition group"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-zinc-300 group-hover:text-blue-400">
                            {st.rollNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-zinc-100">{st.name}</div>
                            <div className="text-[11px] text-zinc-500">{st.email}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-300">
                            {st.attendedCount} / {st.totalSessions}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className={isGood ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                              {st.attendancePercentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isGood ? (
                              <Badge variant="success" className="text-[10px]">
                                Regular (≥75%)
                              </Badge>
                            ) : (
                              <Badge variant="error" className="text-[10px]">
                                Defaulter (&lt;75%)
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(st);
                                setIsStudentModalOpen(true);
                              }}
                              className="h-7 text-xs text-zinc-400 hover:text-white gap-1 group-hover:bg-zinc-800"
                            >
                              <span>View Dossier</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* Add Course Modal */}
      <CourseManagementModal
        isOpen={isAddCourseOpen}
        onClose={() => setIsAddCourseOpen(false)}
        onSuccess={(newCourse) => {
          void fetchCourses();
          setSelectedCourseId(newCourse.id);
        }}
        teacherId={teacherId}
      />

      {/* Individual Student Record Modal */}
      <IndividualStudentRecordModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        courseCode={analytics?.course.code || "COURSE"}
        courseName={analytics?.course.name || ""}
      />
    </div>
  );
}
