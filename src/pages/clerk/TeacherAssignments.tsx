import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, UserCheck, BookOpen, RefreshCw } from 'lucide-react';

const CLASSES = ['LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];
const SUBJECTS = ['English', 'Marathi', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Physics', 'Chemistry', 'Biology'];

interface Teacher {
  id: string;
  name: string;
  teacher_id: string | null;
}

interface SubjectAssignment {
  id: string;
  teacher_id: string;
  class: string;
  subject: string;
  faculty: {
    name: string;
    teacher_id: string | null;
  } | null;
}

interface ClassTeacherAssignment {
  id: string;
  class: string;
  teacher_id: string;
  faculty: {
    name: string;
    teacher_id: string | null;
  } | null;
}

export default function TeacherAssignments() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subjects' | 'classteachers'>('subjects');

  // Form States for Subject Assignment
  const [selTeacher, setSelTeacher] = useState('');
  const [selClass, setSelClass] = useState('Class 5');
  const [selSubject, setSelSubject] = useState('English');
  const [assigningSubject, setAssigningSubject] = useState(false);

  // Form States for Class Teacher
  const [ctClass, setCtClass] = useState('Class 5');
  const [ctTeacher, setCtTeacher] = useState('');
  const [assigningCT, setAssigningCT] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch teachers, subject assignments, and class teachers
      const [teachersRes, subAssignmentsRes, classTeachersRes] = await Promise.all([
        supabase.from('faculty').select('id, name, teacher_id').order('name'),
        supabase.from('teacher_subjects').select('*, faculty:teacher_id(name, teacher_id)'),
        supabase.from('class_teachers').select('*, faculty:teacher_id(name, teacher_id)')
      ]);

      if (teachersRes.error) throw teachersRes.error;
      if (subAssignmentsRes.error) throw subAssignmentsRes.error;
      if (classTeachersRes.error) throw classTeachersRes.error;

      setTeachers(teachersRes.data ?? []);
      setSubjectAssignments(subAssignmentsRes.data as any[] ?? []);
      setClassTeachers(classTeachersRes.data as any[] ?? []);

      // Set default teachers in select inputs if available
      if (teachersRes.data && teachersRes.data.length > 0) {
        setSelTeacher(teachersRes.data[0].id);
        setCtTeacher(teachersRes.data[0].id);
      }
    } catch (error: any) {
      toast.error('Failed to load assignments: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selTeacher || !selClass || !selSubject) {
      toast.error('Please select teacher, class, and subject');
      return;
    }
    setAssigningSubject(true);

    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .upsert(
          { teacher_id: selTeacher, class: selClass, subject: selSubject },
          { onConflict: 'class,subject' }
        );

      if (error) throw error;

      toast.success('Subject assigned successfully!');
      fetchData();
    } catch (error: any) {
      toast.error('Assignment failed: ' + error.message);
    } finally {
      setAssigningSubject(false);
    }
  };

  const handleRemoveSubject = async (id: string) => {
    if (!confirm('Are you sure you want to remove this subject assignment?')) return;
    try {
      const { error } = await supabase.from('teacher_subjects').delete().eq('id', id);
      if (error) throw error;
      toast.success('Assignment removed!');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to remove: ' + error.message);
    }
  };

  const handleAssignClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctClass || !ctTeacher) {
      toast.error('Please select class and teacher');
      return;
    }
    setAssigningCT(true);

    try {
      const { error } = await supabase
        .from('class_teachers')
        .upsert(
          { class: ctClass, teacher_id: ctTeacher },
          { onConflict: 'class' }
        );

      if (error) throw error;

      toast.success('Class Teacher assigned successfully!');
      fetchData();
    } catch (error: any) {
      toast.error('Class Teacher assignment failed: ' + error.message);
    } finally {
      setAssigningCT(false);
    }
  };

  const handleRemoveClassTeacher = async (id: string) => {
    if (!confirm('Are you sure you want to remove this Class Teacher assignment?')) return;
    try {
      const { error } = await supabase.from('class_teachers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Class Teacher unassigned!');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to remove: ' + error.message);
    }
  };

  const selectClass = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white";
  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">Teacher Assignments</h1>
          <p className="text-gray-500 mt-1">Assign teachers to subjects or assign Class Teachers for classrooms.</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="w-fit border-gray-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Subject Assignments
        </button>
        <button
          onClick={() => setActiveTab('classteachers')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'classteachers'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Class Teachers
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ASSIGNMENT FORM (Left Column) */}
          <div className="lg:col-span-1 space-y-6">
            {activeTab === 'subjects' ? (
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-gray-900">Assign Subject Teacher</h3>
                <form onSubmit={handleAssignSubject} className="space-y-4">
                  <div>
                    <Label className={labelClass}>Select Teacher</Label>
                    <select
                      value={selTeacher}
                      onChange={(e) => setSelTeacher(e.target.value)}
                      className={selectClass}
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.teacher_id || 'No ID'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className={labelClass}>Select Class</Label>
                    <select
                      value={selClass}
                      onChange={(e) => setSelClass(e.target.value)}
                      className={selectClass}
                    >
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className={labelClass}>Select Subject</Label>
                    <select
                      value={selSubject}
                      onChange={(e) => setSelSubject(e.target.value)}
                      className={selectClass}
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" disabled={assigningSubject || teachers.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    {assigningSubject ? 'Assigning...' : 'Assign Teacher'}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-gray-900">Assign Class Teacher</h3>
                <form onSubmit={handleAssignClassTeacher} className="space-y-4">
                  <div>
                    <Label className={labelClass}>Select Class</Label>
                    <select
                      value={ctClass}
                      onChange={(e) => setCtClass(e.target.value)}
                      className={selectClass}
                    >
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className={labelClass}>Select Class Teacher</Label>
                    <select
                      value={ctTeacher}
                      onChange={(e) => setCtTeacher(e.target.value)}
                      className={selectClass}
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.teacher_id || 'No ID'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" disabled={assigningCT || teachers.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    {assigningCT ? 'Assigning...' : 'Assign Class Teacher'}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* ASSIGNMENT LIST (Right Column) */}
          <div className="lg:col-span-2">
            {activeTab === 'subjects' ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-left">Class</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-left">Subject</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-left">Teacher Name</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {subjectAssignments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-gray-500">
                            No subject assignments found.
                          </td>
                        </tr>
                      ) : (
                        subjectAssignments.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{a.class}</td>
                            <td className="px-4 py-3">
                              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded border">
                                {a.subject}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {a.faculty?.name || 'Unknown Teacher'}
                              <span className="text-xs text-gray-400 font-mono block">
                                {a.faculty?.teacher_id || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveSubject(a.id)}
                                className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-left">Class</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-left">Class Teacher</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {classTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-12 text-gray-500">
                            No Class Teachers assigned yet.
                          </td>
                        </tr>
                      ) : (
                        classTeachers.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{a.class}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {a.faculty?.name || 'Unknown Teacher'}
                              <span className="text-xs text-gray-400 font-mono block">
                                {a.faculty?.teacher_id || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveClassTeacher(a.id)}
                                className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
