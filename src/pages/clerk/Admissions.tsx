import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

const CLASSES = ['LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];

const initialFormData = {
  student_id: '',
  fname: '',
  mname: '',
  lname: '',
  mother_fname: '',
  mother_mname: '',
  mother_lname: '',
  father_fname: '',
  father_mname: '',
  father_lname: '',
  nationality: 'Indian',
  mother_tongue: '',
  religion: '',
  caste: '',
  sub_caste: '',
  place_of_birth: '',
  taluka: '',
  district: '',
  city: '',
  state: '',
  dob: '',
  dob_words: '',
  previous_school: '',
  admission_class: '',
  date_of_admission: '',
  current_class: '',
  email: '',
  password: '',
};

export default function Admissions() {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{ show: boolean; studentId: string; email: string; password: string; name: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const convertDateToWords = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    setFormData((prev) => ({ ...prev, dob, dob_words: convertDateToWords(dob) }));
  };

  const combine = (...parts: string[]) => parts.filter(Boolean).join(' ').trim();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const studentName = combine(formData.fname, formData.mname, formData.lname);

    const payload = {
      student_id: formData.student_id,
      password: formData.password,
      email: formData.email,
      name: studentName,
      mother_name: combine(formData.mother_fname, formData.mother_mname, formData.mother_lname),
      father_name: combine(formData.father_fname, formData.father_mname, formData.father_lname),
      nationality: formData.nationality,
      mother_tongue: formData.mother_tongue,
      religion: formData.religion,
      caste: formData.caste,
      sub_caste: formData.sub_caste,
      place_of_birth: formData.place_of_birth,
      taluka: formData.taluka,
      district: formData.district,
      city: formData.city,
      state: formData.state,
      dob: formData.dob,
      dob_words: formData.dob_words,
      previous_school: formData.previous_school || null,
      admission_class: formData.admission_class,
      date_of_admission: formData.date_of_admission,
      class: formData.current_class || formData.admission_class,
    };

    const { error } = await supabase.from('students').insert([payload]);

    if (error) {
      toast.error(error.message || 'Error submitting admission');
    } else {
      toast.success('Admission recorded successfully!');
      setCredentialsModal({
        show: true,
        studentId: formData.student_id,
        email: formData.email,
        password: formData.password,
        name: studentName,
      });
      setFormData(initialFormData);
    }
    setLoading(false);
  };

  const fieldClass = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h1 className="text-3xl font-bold font-display text-gray-900">New Student Admission</h1>
        <p className="text-gray-500 mt-1">Fill in the student details to record a new admission.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {/* Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className={labelClass}>Student ID (Username) *</Label>
            <Input name="student_id" value={formData.student_id} onChange={handleChange} required placeholder="e.g., STU-2025-001" className="mt-1" />
          </div>
          <div>
            <Label className={labelClass}>Login Email *</Label>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="e.g., student@school.com" className="mt-1" />
          </div>
          <div>
            <Label className={labelClass}>Login Password *</Label>
            <Input type="text" name="password" value={formData.password} onChange={handleChange} required placeholder="e.g., password123" className="mt-1" />
          </div>
        </div>

        {/* Student Name */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-sm font-semibold text-gray-700 px-2">Student Full Name</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div><Label className={labelClass}>First Name *</Label><Input name="fname" value={formData.fname} onChange={handleChange} required className="mt-1" /></div>
            <div><Label className={labelClass}>Middle Name</Label><Input name="mname" value={formData.mname} onChange={handleChange} className="mt-1" /></div>
            <div><Label className={labelClass}>Last Name *</Label><Input name="lname" value={formData.lname} onChange={handleChange} required className="mt-1" /></div>
          </div>
        </fieldset>

        {/* Mother Name */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-sm font-semibold text-gray-700 px-2">Mother's Full Name</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div><Label className={labelClass}>First Name *</Label><Input name="mother_fname" value={formData.mother_fname} onChange={handleChange} required className="mt-1" /></div>
            <div><Label className={labelClass}>Middle Name</Label><Input name="mother_mname" value={formData.mother_mname} onChange={handleChange} className="mt-1" /></div>
            <div><Label className={labelClass}>Last Name *</Label><Input name="mother_lname" value={formData.mother_lname} onChange={handleChange} required className="mt-1" /></div>
          </div>
        </fieldset>

        {/* Father Name */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-sm font-semibold text-gray-700 px-2">Father's Full Name</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div><Label className={labelClass}>First Name *</Label><Input name="father_fname" value={formData.father_fname} onChange={handleChange} required className="mt-1" /></div>
            <div><Label className={labelClass}>Middle Name</Label><Input name="father_mname" value={formData.father_mname} onChange={handleChange} className="mt-1" /></div>
            <div><Label className={labelClass}>Last Name *</Label><Input name="father_lname" value={formData.father_lname} onChange={handleChange} required className="mt-1" /></div>
          </div>
        </fieldset>

        {/* Demographics */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-sm font-semibold text-gray-700 px-2">Demographics</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div><Label className={labelClass}>Nationality</Label><Input name="nationality" value={formData.nationality} onChange={handleChange} className="mt-1" /></div>
            <div><Label className={labelClass}>Mother Tongue *</Label><Input name="mother_tongue" value={formData.mother_tongue} onChange={handleChange} required className="mt-1" /></div>
            <div><Label className={labelClass}>Religion *</Label><Input name="religion" value={formData.religion} onChange={handleChange} required className="mt-1" /></div>
            <div><Label className={labelClass}>Caste</Label><Input name="caste" value={formData.caste} onChange={handleChange} className="mt-1" /></div>
            <div><Label className={labelClass}>Sub-Caste</Label><Input name="sub_caste" value={formData.sub_caste} onChange={handleChange} className="mt-1" /></div>
          </div>
        </fieldset>

        {/* Place of Birth */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-sm font-semibold text-gray-700 px-2">Place of Birth</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div><Label className={labelClass}>Place/Village</Label><Input name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} className="mt-1" /></div>
            <div><Label className={labelClass}>Taluka</Label><Input name="taluka" value={formData.taluka} onChange={handleChange} className="mt-1" /></div>
            <div><Label className={labelClass}>District</Label><Input name="district" value={formData.district} onChange={handleChange} className="mt-1" /></div>
            <div><Label className={labelClass}>City</Label><Input name="city" value={formData.city} onChange={handleChange} className="mt-1" /></div>
            <div><Label className={labelClass}>State</Label><Input name="state" value={formData.state} onChange={handleChange} className="mt-1" /></div>
          </div>
        </fieldset>

        {/* DOB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className={labelClass}>Date of Birth *</Label><Input type="date" name="dob" value={formData.dob} onChange={handleDobChange} required className="mt-1" /></div>
          <div><Label className={labelClass}>DOB in Words</Label><Input name="dob_words" value={formData.dob_words} readOnly className="mt-1 bg-gray-50" /></div>
        </div>

        {/* Previous School */}
        <div>
          <Label className={labelClass}>Previous School (if any)</Label>
          <Input name="previous_school" value={formData.previous_school} onChange={handleChange} className="mt-1" />
        </div>

        {/* Admission Details */}
        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-sm font-semibold text-gray-700 px-2">Admission Details</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div>
              <Label className={labelClass}>Class of Admission *</Label>
              <select name="admission_class" value={formData.admission_class} onChange={handleChange} required className={fieldClass + " mt-1"}>
                <option value="">Select Class</option>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label className={labelClass}>Date of Admission *</Label><Input type="date" name="date_of_admission" value={formData.date_of_admission} onChange={handleChange} required className="mt-1" /></div>
            <div>
              <Label className={labelClass}>Current Class</Label>
              <select name="current_class" value={formData.current_class} onChange={handleChange} className={fieldClass + " mt-1"}>
                <option value="">Same as admission class</option>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? 'Submitting...' : 'Submit Admission'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setFormData(initialFormData)}>
            Clear Form
          </Button>
        </div>
      </form>

      {/* Credentials Modal */}
      {credentialsModal?.show && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up text-center relative border-t-8 border-emerald-500">
            <h3 className="text-2xl font-bold text-gray-900">Admission Recorded!</h3>
            <p className="text-sm text-gray-500">
              The credentials for <span className="font-semibold text-emerald-700">{credentialsModal.name}</span> have been generated successfully.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border space-y-3 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Student ID (Username)</span>
                  <p className="font-mono text-sm font-bold text-gray-800">{credentialsModal.studentId}</p>
                </div>
                <button onClick={() => copyToClipboard(credentialsModal.studentId)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-slate-100 rounded">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Login Email</span>
                  <p className="font-mono text-sm font-bold text-gray-800">{credentialsModal.email}</p>
                </div>
                <button onClick={() => copyToClipboard(credentialsModal.email)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-slate-100 rounded">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Portal Password</span>
                  <p className="font-mono text-sm font-bold text-gray-800">{credentialsModal.password}</p>
                </div>
                <button onClick={() => copyToClipboard(credentialsModal.password)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-slate-100 rounded">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Button onClick={() => setCredentialsModal(null)} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Done & Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
