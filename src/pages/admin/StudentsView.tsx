import React, { useState } from 'react';
import type { TrainingStudent } from '@/content/types';
import { useStore } from '@/lib/store';
import { fmtMoney, waLink } from '@/lib/money';
import {
  Users, CheckCircle2, Clock, Search, Filter, MessageSquare,
  Mail, Download, Plus, X, Trash2, ArrowUpRight, Check
} from 'lucide-react';

export function StudentsView() {
  const { students, activeCohort, content, markStudentPaid, updateStudent, deleteStudent, registerStudent } = useStore();

  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'payment_pending'>('all');
  const [filterTrack, setFilterTrack] = useState<'all' | 'business' | 'creators'>('all');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [undoToast, setUndoToast] = useState<{ studentId: string; studentName: string; ref: string } | null>(null);
  const undoTimeoutRef = React.useRef<any>(null);

  const handleMarkPaidWithUndo = (student: TrainingStudent) => {
    markStudentPaid(student.id);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast({ studentId: student.id, studentName: student.name, ref: student.ref });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 10000);
  };

  const handleUndo = () => {
    if (undoToast) {
      updateStudent(undoToast.studentId, { status: 'payment_pending' });
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      setUndoToast(null);
    }
  };

  // Manual Add Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [country, setCountry] = useState('NG');
  const [track, setTrack] = useState<'business' | 'creators'>('business');
  const [businessName, setBusinessName] = useState('');
  const [status, setStatus] = useState<'registered' | 'payment_pending' | 'paid'>('paid');

  const filtered = students.filter((s) => {
    if (s.cohortId !== activeCohort.id && s.cohortId !== 'all') return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterTrack !== 'all' && s.track !== filterTrack) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.whatsapp.includes(q) ||
        (s.businessName && s.businessName.toLowerCase().includes(q)) ||
        s.ref.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paidCount = students.filter((s) => s.cohortId === activeCohort.id && (s.status === 'paid' || s.status === 'confirmed')).length;
  const pendingCount = students.filter((s) => s.cohortId === activeCohort.id && (s.status === 'registered' || s.status === 'payment_pending')).length;

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim() || !email.trim()) return;

    const countryObj = content.countries.find((c) => c.code === country) || content.countries[0];
    const priceObj = activeCohort.prices[country] || activeCohort.prices.NG || { founding: 19997, regular: 29997 };

    const student = await registerStudent({
      cohortId: activeCohort.id,
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      country,
      track,
      businessName: track === 'business' ? businessName.trim() : undefined,
      experienceLevel: 'beginner',
      goal: track === 'business' ? 'Commercial ads' : 'AI filmmaking',
      price: priceObj.founding,
      currency: countryObj.currency,
    });

    if (status === 'paid') {
      markStudentPaid(student.id, 'Manually added as paid');
    }

    setName('');
    setEmail('');
    setWhatsapp('');
    setBusinessName('');
    setAddOpen(false);
  };

  const exportCsv = () => {
    const headers = ['Ref', 'Name', 'Email', 'WhatsApp', 'Country', 'Track', 'Business Name', 'Status', 'Price', 'Currency', 'Date'];
    const rows = filtered.map((s) => [
      s.ref,
      `"${s.name.replace(/"/g, '""')}"`,
      s.email,
      s.whatsapp,
      s.country,
      s.track,
      `"${(s.businessName || '').replace(/"/g, '""')}"`,
      s.status,
      s.price,
      s.currency,
      s.date,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `advibe-students-${activeCohort.id}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
            Enrolled Students
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Cohort 1 Registrations
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#f5a524] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-black hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* METRIC PILLS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span>CONFIRMED PAID</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-white">{paidCount}</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-amber-400">
            <span>PENDING PAYMENT</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-white">{pendingCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-white/50">
            <span>BUSINESS OWNERS</span>
            <span>🏢</span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {students.filter((s) => s.cohortId === activeCohort.id && s.track === 'business').length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs font-mono text-white/50">
            <span>CREATORS</span>
            <span>🎬</span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {students.filter((s) => s.cohortId === activeCohort.id && s.track === 'creators').length}
          </p>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search student name, phone, email, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-3 text-base sm:text-sm text-white placeholder:text-white/30 focus:border-[#f5a524] focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setFilterStatus('all')}
            className={`min-h-[44px] rounded-xl px-4 py-2.5 transition active:scale-[0.98] ${filterStatus === 'all' ? 'bg-[#f5a524] text-black font-bold shadow-md' : 'border border-white/10 bg-white/5 text-white/70 hover:text-white'}`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`min-h-[44px] rounded-xl px-4 py-2.5 transition active:scale-[0.98] ${filterStatus === 'paid' ? 'bg-emerald-500 text-black font-bold shadow-md' : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:text-emerald-200'}`}
          >
            Paid ({paidCount})
          </button>
          <button
            onClick={() => setFilterStatus('payment_pending')}
            className={`min-h-[44px] rounded-xl px-4 py-2.5 transition active:scale-[0.98] ${filterStatus === 'payment_pending' ? 'bg-amber-500 text-black font-bold shadow-md' : 'border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:text-amber-200'}`}
          >
            Pending ({pendingCount})
          </button>
        </div>
      </div>

      {/* MOBILE-FIRST STUDENT CARDS LIST */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-xs text-white/40">
            No students found matching your filters.
          </div>
        ) : (
          filtered.map((student) => {
            const isPaid = student.status === 'paid' || student.status === 'confirmed';
            const countryObj = content.countries.find((c) => c.code === student.country);

            const waDirect = waLink(
              student.whatsapp,
              `Hello ${student.name}! 👋 This is AdVibe Studios regarding your enrollment in ${activeCohort.name}.`
            );

            return (
              <div
                key={student.id}
                className="rounded-2xl border border-white/10 bg-[#121518] p-4 text-white shadow-sm transition hover:border-white/20 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Student Info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#f5a524]">
                        {student.ref}
                      </span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/60">
                        {countryObj?.flag || student.country} {student.country}
                      </span>
                      <span className="rounded bg-[#f5a524]/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#f5a524] capitalize">
                        {student.track === 'business' ? '🏢 Business' : '🎬 Creator'}
                      </span>
                    </div>

                    <h4 className="font-display text-base font-bold text-white sm:text-lg">
                      {student.name}
                    </h4>

                    {student.businessName && (
                      <p className="text-xs text-white/70 font-medium">
                        Brand: <strong>{student.businessName}</strong>
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 font-mono">
                      <span>{student.email}</span>
                      <span>·</span>
                      <span>{student.whatsapp}</span>
                      <span>·</span>
                      <span>{student.date}</span>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    {/* Status Pill */}
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {isPaid ? '● Paid' : '○ Pending'}
                    </span>

                    {/* Quick WhatsApp button */}
                    <a
                      href={waDirect}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10"
                      title="Open WhatsApp chat"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Fast "Mark as Paid" action */}
                    {!isPaid ? (
                      <button
                        onClick={() => handleMarkPaidWithUndo(student)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Mark Paid</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStudent(student.id, { status: 'payment_pending' })}
                        className="rounded-xl border border-white/10 px-2.5 py-2 text-xs text-white/40 hover:text-white"
                        title="Revert to pending"
                      >
                        Revert
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${student.name} from registrations?`)) {
                          deleteStudent(student.id);
                        }
                      }}
                      className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 text-white/40 hover:bg-red-500/20 hover:text-red-300"
                      title="Delete student"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MANUAL ADD STUDENT MODAL */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleManualAdd}
            className="relative w-full max-w-md rounded-3xl border border-white/20 bg-[#14181c] p-6 text-white shadow-2xl sm:p-8 space-y-4 my-8"
          >
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5a524]">
                Staff Manual Entry
              </span>
              <h3 className="font-display text-xl font-bold tracking-tight text-white">
                Add Student to {activeCohort.name}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">WhatsApp Number *</label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl border border-white/15 bg-[#181d22] px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
                >
                  {content.countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Track</label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value as 'business' | 'creators')}
                  className="w-full min-h-[48px] rounded-xl border border-white/15 bg-[#181d22] px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
                >
                  <option value="business">Business Owner</option>
                  <option value="creators">Creator / Filmmaker</option>
                </select>
              </div>
            </div>

            {track === 'business' && (
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Initial Payment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full min-h-[48px] rounded-xl border border-white/15 bg-[#181d22] px-4 py-3 text-base sm:text-sm text-white focus:border-[#f5a524] focus:outline-none"
              >
                <option value="paid">Confirmed Paid (Counts towards seats)</option>
                <option value="payment_pending">Payment Pending</option>
              </select>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 min-h-[48px] rounded-xl bg-[#f5a524] py-3 px-5 font-display text-sm font-bold uppercase tracking-wider text-black hover:brightness-110 active:scale-[0.98] transition shadow-lg"
              >
                Add Student
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="min-h-[48px] rounded-xl border border-white/15 px-5 py-3 text-xs font-semibold text-white/60 hover:text-white active:scale-[0.98] transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 10-SECOND UNDO TOAST NOTIFICATION */}
      {undoToast && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-[#121c15] px-4 py-3.5 text-xs text-white shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Marked <strong>{undoToast.studentName}</strong> ({undoToast.ref}) as Paid.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              className="rounded-lg bg-emerald-500/20 px-3 py-1 font-bold text-emerald-300 hover:bg-emerald-500/30 transition border border-emerald-500/30"
            >
              Undo (10s)
            </button>
            <button
              onClick={() => { if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current); setUndoToast(null); }}
              className="text-white/40 hover:text-white p-1"
              aria-label="Dismiss undo notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
