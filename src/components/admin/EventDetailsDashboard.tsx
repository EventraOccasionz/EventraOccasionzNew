import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, MapPin, Heart, Users, Car, Hotel, FileText, 
  MessageSquare, Clock, PieChart, CheckCircle2, Plus, Edit, 
  Trash2, Save, Download, DollarSign, Briefcase, Clipboard, 
  PlusCircle, AlertCircle, Sparkles, User, UserCheck, RefreshCcw, Smartphone,
  Activity, CheckSquare, ListTodo
} from 'lucide-react';
import { Family, RSVP, TransportRequest, RoomBooking } from '../../types';
import { dataService } from '../../lib/dataService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface EventData {
  id: string;
  name: string;
  bride: string;
  groom: string;
  date: string;
  venue: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Archived' | 'Active';
  created_at: string;
  
  // New Event Creation Fields
  familyName?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  state?: string;
  clientName?: string;
  clientMobile?: string;
  clientEmail?: string;
  expectedGuests?: number;
  hotelName?: string;
}

export interface TaskItem {
  id: string;
  name: string;
  assigned_to: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  contact: string;
  quotation: number;
  advance_paid: number;
  remaining_amount: number;
  notes: string;
  status: 'Pending' | 'Active' | 'Paid';
}

export interface IncomeItem {
  id: string;
  source: string;
  amount: number;
  date: string;
}

export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  recipient: string;
  date: string;
}

export interface TimelineItem {
  id: string;
  name: string;
  time: string;
  date: string;
  venue: string;
  notes: string;
}

export interface StaffItem {
  id: string;
  name: string;
  role: string;
  mobile: string;
  status: 'Active' | 'Inactive';
  attendance: 'Present' | 'Absent' | 'N/A';
}

interface EventDetailsDashboardProps {
  event: EventData;
  onBack: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export default function EventDetailsDashboard({
  event,
  onBack,
  showToast
}: EventDetailsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'logistics' | 'tasks' | 'vendors' | 'budget' | 'timeline' | 'staff' | 'reports'>('overview');
  const [loading, setLoading] = useState(false);

  // Global Lists for RSVPs/Families/Logistics (Fetched and Filtered for Event)
  const [allFamilies, setAllFamilies] = useState<Family[]>([]);
  const [allRsvps, setAllRsvps] = useState<RSVP[]>([]);
  const [allTransports, setAllTransports] = useState<TransportRequest[]>([]);
  const [allRooms, setAllRooms] = useState<RoomBooking[]>([]);

  // Event Dashboard custom states
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [budgetIncome, setBudgetIncome] = useState<IncomeItem[]>([]);
  const [budgetExpenses, setBudgetExpenses] = useState<ExpenseItem[]>([]);
  const [advanceReceived, setAdvanceReceived] = useState<number>(0);
  const [pendingPayment, setPendingPayment] = useState<number>(0);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);

  // Editing Modals
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Partial<TaskItem> | null>(null);

  const [showVendorModal, setShowVendorModal] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<Partial<VendorItem> | null>(null);

  const [showIncomeModal, setShowIncomeModal] = useState<boolean>(false);
  const [editingIncome, setEditingIncome] = useState<Partial<IncomeItem> | null>(null);

  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Partial<ExpenseItem> | null>(null);

  const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);
  const [editingTimelineItem, setEditingTimelineItem] = useState<Partial<TimelineItem> | null>(null);

  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffItem> | null>(null);

  useEffect(() => {
    fetchEventSpecificData();
  }, [event.id]);

  const fetchEventSpecificData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Global Data
      const [f, r, t, rm] = await Promise.all([
        dataService.getFamilies(),
        dataService.getRSVPs(),
        dataService.getTransports(),
        dataService.getRooms()
      ]);

      // Filter elements by Event ID
      const filteredFams = f.filter(fam => fam.event_id === event.id);
      const famIds = new Set(filteredFams.map(fam => fam.id));
      
      setAllFamilies(filteredFams);
      setAllRsvps(r.filter(rsvp => rsvp.event_id === event.id || famIds.has(rsvp.family_id)));
      setAllTransports(t.filter(trans => trans.event_id === event.id || famIds.has(trans.family_id)));
      setAllRooms(rm.filter(room => room.event_id === event.id || famIds.has(room.family_id)));

      // 2. Fetch Modules from event_details/eventId
      if (dataService.isConfigured()) {
        const docRef = doc(db, 'event_details', event.id);
        const detailsDoc = await getDoc(docRef);
        if (detailsDoc.exists()) {
          const data = detailsDoc.data();
          setTasks(data.tasks || []);
          setVendors(data.vendors || []);
          setBudgetIncome(data.budget?.income || []);
          setBudgetExpenses(data.budget?.expenses || []);
          setAdvanceReceived(data.budget?.advance_received || 0);
          setPendingPayment(data.budget?.pending_payment || 0);
          setTimeline(data.timeline || []);
          setStaff(data.staff || []);
        } else {
          loadDefaultEventDetails();
        }
      } else {
        const cached = localStorage.getItem(`event_details_${event.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setTasks(parsed.tasks || []);
          setVendors(parsed.vendors || []);
          setBudgetIncome(parsed.budget?.income || []);
          setBudgetExpenses(parsed.budget?.expenses || []);
          setAdvanceReceived(parsed.budget?.advance_received || 0);
          setPendingPayment(parsed.budget?.pending_payment || 0);
          setTimeline(parsed.timeline || []);
          setStaff(parsed.staff || []);
        } else {
          loadDefaultEventDetails();
        }
      }
    } catch (err) {
      console.error('Error loading event data:', err);
      showToast('error', 'Failed to retrieve event parameters.');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultEventDetails = () => {
    // Default tasks
    const defaultTasks: TaskItem[] = [
      { id: 'tsk_1', name: 'Book Hotel Rooms', assigned_to: 'John Doe', priority: 'High', deadline: event.date, status: 'Pending' },
      { id: 'tsk_2', name: 'Decoration Setups', assigned_to: 'Alice Smith', priority: 'Medium', deadline: event.date, status: 'In Progress' },
      { id: 'tsk_3', name: 'Coordinate DJ & Sound', assigned_to: 'Rohan Sharma', priority: 'Medium', deadline: event.date, status: 'Pending' },
      { id: 'tsk_4', name: 'Arrange Photography Crew', assigned_to: 'Vikram Singh', priority: 'High', deadline: event.date, status: 'Completed' },
      { id: 'tsk_5', name: 'Food Catering Trial', assigned_to: 'Meera Roy', priority: 'High', deadline: event.date, status: 'Completed' },
      { id: 'tsk_6', name: 'Transport fleet dispatching', assigned_to: 'Driver Desk', priority: 'Medium', deadline: event.date, status: 'Pending' }
    ];
    setTasks(defaultTasks);
    setVendors([]);
    setBudgetIncome([]);
    setBudgetExpenses([]);
    setAdvanceReceived(0);
    setPendingPayment(0);
    
    // Default Schedule timeline
    const defaultTimeline: TimelineItem[] = [
      { id: 'tm_1', name: 'Haldi Ceremony', time: '10:00 AM', date: event.date, venue: event.venue, notes: 'Yellow dress code' },
      { id: 'tm_2', name: 'Mehndi Ceremony', time: '03:00 PM', date: event.date, venue: event.venue, notes: 'Traditional music playing' },
      { id: 'tm_3', name: 'Sangeet Soiree', time: '07:30 PM', date: event.date, venue: event.venue, notes: 'Dance performances scheduled' }
    ];
    setTimeline(defaultTimeline);
    setStaff([]);
  };

  const saveDetailsState = async (
    updatedTasks: TaskItem[],
    updatedVendors: VendorItem[],
    updatedIncome: IncomeItem[],
    updatedExpenses: ExpenseItem[],
    updatedAdvance: number,
    updatedPending: number,
    updatedTimeline: TimelineItem[],
    updatedStaff: StaffItem[]
  ) => {
    const payload = {
      tasks: updatedTasks,
      vendors: updatedVendors,
      budget: {
        income: updatedIncome,
        expenses: updatedExpenses,
        advance_received: updatedAdvance,
        pending_payment: updatedPending
      },
      timeline: updatedTimeline,
      staff: updatedStaff
    };

    try {
      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'event_details', event.id), payload, { merge: true });
      } else {
        localStorage.setItem(`event_details_${event.id}`, JSON.stringify(payload));
      }
    } catch (err) {
      console.error('Error persisting event modules:', err);
      showToast('error', 'Failed saving parameters to database.');
    }
  };

  // Dynamic statistics calculations
  const totalGuests = allRsvps.filter(r => r.attending).reduce((sum, r) => sum + (r.total_guests || 1), 0);
  const confirmedCount = allRsvps.filter(r => r.attending).length;
  const pendingCount = allFamilies.length - allRsvps.length;
  const rejectedCount = allRsvps.filter(r => !r.attending).length;
  const checkedInCount = allRsvps.filter(r => r.checked_in).length;
  const roomsAllocated = allRooms.length;
  const pickupPending = allRsvps.filter(r => r.pickup_required && !allTransports.some(t => t.family_id === r.family_id && t.driver_name)).length;
  const dropPending = allRsvps.filter(r => r.drop_required && !allTransports.some(t => t.family_id === r.family_id && t.driver_name)).length;
  const documentsPending = allFamilies.filter(f => !f.documents || f.documents.length === 0).length;

  // Live Budget Summary Calculations
  const totalIncome = budgetIncome.reduce((sum, i) => sum + i.amount, 0) + Number(advanceReceived);
  const totalExpenses = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVendorPayments = vendors.reduce((sum, v) => sum + Number(v.advance_paid), 0);
  const totalVendorRemaining = vendors.reduce((sum, v) => sum + Number(v.remaining_amount), 0);
  const remainingBudgetBalance = totalIncome - totalExpenses - totalVendorPayments;

  // --- Task Manager CRUD ---
  const handleOpenTaskModal = (task?: TaskItem) => {
    if (task) {
      setEditingTask({ ...task });
    } else {
      setEditingTask({ id: 'tsk_' + Math.random().toString(36).substring(2, 9), name: '', assigned_to: '', priority: 'Medium', deadline: event.date, status: 'Pending' });
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.name) return;

    let updated;
    const exists = tasks.some(t => t.id === editingTask.id);
    if (exists) {
      updated = tasks.map(t => t.id === editingTask.id ? (editingTask as TaskItem) : t);
    } else {
      updated = [...tasks, editingTask as TaskItem];
    }

    setTasks(updated);
    setShowTaskModal(false);
    await saveDetailsState(updated, vendors, budgetIncome, budgetExpenses, advanceReceived, pendingPayment, timeline, staff);
    showToast('success', 'Task list catalogued successfully.');
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Remove this task from trackpad?')) return;
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    await saveDetailsState(updated, vendors, budgetIncome, budgetExpenses, advanceReceived, pendingPayment, timeline, staff);
    showToast('success', 'Task removed.');
  };

  // --- Vendor Manager CRUD ---
  const handleOpenVendorModal = (v?: VendorItem) => {
    if (v) {
      setEditingVendor({ ...v });
    } else {
      setEditingVendor({ id: 'vnd_' + Math.random().toString(36).substring(2, 9), name: '', category: '', contact: '', quotation: 0, advance_paid: 0, notes: '', status: 'Pending' });
    }
    setShowVendorModal(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !editingVendor.name) return;

    const quotation = Number(editingVendor.quotation || 0);
    const advance = Number(editingVendor.advance_paid || 0);
    const remaining = Math.max(0, quotation - advance);

    const fullVendor: VendorItem = {
      ...(editingVendor as VendorItem),
      quotation,
      advance_paid: advance,
      remaining_amount: remaining
    };

    let updated;
    const exists = vendors.some(v => v.id === fullVendor.id);
    if (exists) {
      updated = vendors.map(v => v.id === fullVendor.id ? fullVendor : v);
    } else {
      updated = [...vendors, fullVendor];
    }

    setVendors(updated);
    setShowVendorModal(false);
    await saveDetailsState(tasks, updated, budgetIncome, budgetExpenses, advanceReceived, pendingPayment, timeline, staff);
    showToast('success', 'Vendor profile registered.');
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Delete this vendor? All financial records associated will reset.')) return;
    const updated = vendors.filter(v => v.id !== id);
    setVendors(updated);
    await saveDetailsState(tasks, updated, budgetIncome, budgetExpenses, advanceReceived, pendingPayment, timeline, staff);
    showToast('success', 'Vendor removed.');
  };

  // --- Budget CRUD ---
  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome || !editingIncome.source || !editingIncome.amount) return;

    let updated;
    const exists = budgetIncome.some(i => i.id === editingIncome.id);
    if (exists) {
      updated = budgetIncome.map(i => i.id === editingIncome.id ? (editingIncome as IncomeItem) : i);
    } else {
      updated = [...budgetIncome, editingIncome as IncomeItem];
    }

    setBudgetIncome(updated);
    setShowIncomeModal(false);
    await saveDetailsState(tasks, vendors, updated, budgetExpenses, advanceReceived, pendingPayment, timeline, staff);
    showToast('success', 'Income receipt saved.');
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.category || !editingExpense.amount) return;

    let updated;
    const exists = budgetExpenses.some(ex => ex.id === editingExpense.id);
    if (exists) {
      updated = budgetExpenses.map(ex => ex.id === editingExpense.id ? (editingExpense as ExpenseItem) : ex);
    } else {
      updated = [...budgetExpenses, editingExpense as ExpenseItem];
    }

    setBudgetExpenses(updated);
    setShowExpenseModal(false);
    await saveDetailsState(tasks, vendors, budgetIncome, updated, advanceReceived, pendingPayment, timeline, staff);
    showToast('success', 'Expense line-item saved.');
  };

  // --- Timeline CRUD ---
  const handleOpenTimelineModal = (item?: TimelineItem) => {
    if (item) {
      setEditingTimelineItem({ ...item });
    } else {
      setEditingTimelineItem({ id: 'tm_' + Math.random().toString(36).substring(2, 9), name: '', time: '12:00 PM', date: event.date, venue: event.venue, notes: '' });
    }
    setShowTimelineModal(true);
  };

  const handleSaveTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimelineItem || !editingTimelineItem.name) return;

    let updated;
    const exists = timeline.some(t => t.id === editingTimelineItem.id);
    if (exists) {
      updated = timeline.map(t => t.id === editingTimelineItem.id ? (editingTimelineItem as TimelineItem) : t);
    } else {
      updated = [...timeline, editingTimelineItem as TimelineItem];
    }

    setTimeline(updated);
    setShowTimelineModal(false);
    await saveDetailsState(tasks, vendors, budgetIncome, budgetExpenses, advanceReceived, pendingPayment, updated, staff);
    showToast('success', 'Event schedule slot updated.');
  };

  // --- Staff CRUD ---
  const handleOpenStaffModal = (s?: StaffItem) => {
    if (s) {
      setEditingStaff({ ...s });
    } else {
      setEditingStaff({ id: 'stf_' + Math.random().toString(36).substring(2, 9), name: '', role: '', mobile: '', status: 'Active', attendance: 'N/A' });
    }
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editingStaff.name) return;

    let updated;
    const exists = staff.some(s => s.id === editingStaff.id);
    if (exists) {
      updated = staff.map(s => s.id === editingStaff.id ? (editingStaff as StaffItem) : s);
    } else {
      updated = [...staff, editingStaff as StaffItem];
    }

    setStaff(updated);
    setShowStaffModal(false);
    await saveDetailsState(tasks, vendors, budgetIncome, budgetExpenses, advanceReceived, pendingPayment, timeline, updated);
    showToast('success', 'Event staff assigned.');
  };

  // --- CSV Export (Excel compatible) ---
  const handleExportCSV = (reportType: 'guest' | 'transport' | 'hotel' | 'budget' | 'vendor' | 'attendance') => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let fileName = `Report_${reportType}_${event.name.replace(/\s+/g, '_')}.csv`;

    switch (reportType) {
      case 'guest':
        headers = ['Guest Name', 'Email', 'Mobile', 'Attending', 'Adults Count', 'Children Count', 'Checked-In', 'Checked-In At', 'Dietary Requirements', 'Special Requests'];
        rows = allRsvps.map(r => [
          r.guest_name,
          r.email,
          r.mobile_number || '-',
          r.attending ? 'Yes' : 'No',
          r.total_guests,
          r.children_count,
          r.checked_in ? 'Yes' : 'No',
          r.checked_in_at || '-',
          r.dietary_requirements || '-',
          r.special_requests || '-'
        ]);
        break;
      case 'transport':
        headers = ['Guest Group', 'Mode', 'Cab Needed', 'Pickup Location', 'Arrival Time', 'Driver Name', 'Vehicle Number', 'Driver Contact', 'Pickup Time'];
        rows = allTransports.map(t => {
          const familyName = allFamilies.find(f => f.id === t.family_id)?.name || 'Guest Group';
          return [
            familyName,
            t.mode,
            t.need_cab ? 'Yes' : 'No',
            t.pickup_location || '-',
            t.arrival_time || '-',
            t.driver_name || '-',
            t.vehicle_number || '-',
            t.driver_contact || '-',
            t.pickup_time || '-'
          ];
        });
        break;
      case 'hotel':
        headers = ['Guest Group', 'Hotel Name', 'Room Number', 'Floor', 'Check-In', 'Check-Out', 'Status'];
        rows = allRooms.map(r => {
          const familyName = allFamilies.find(f => f.id === r.family_id)?.name || 'Guest Group';
          return [
            familyName,
            r.hotel_name || '-',
            r.room_number || '-',
            r.floor || '-',
            r.check_in || '-',
            r.check_out || '-',
            r.status
          ];
        });
        break;
      case 'budget':
        headers = ['Item Category / Source', 'Type', 'Amount', 'Date', 'Recipient / Details'];
        rows = [
          ['Initial Budget / Advance Received', 'Income', advanceReceived, event.created_at, 'Primary Fund'],
          ...budgetIncome.map(i => [i.source, 'Income', i.amount, i.date, 'Misc Fund']),
          ...budgetExpenses.map(e => [e.category, 'Expense', e.amount, e.date, e.recipient])
        ];
        break;
      case 'vendor':
        headers = ['Vendor Name', 'Category', 'Contact', 'Quotation', 'Advance Paid', 'Remaining Balance', 'Status'];
        rows = vendors.map(v => [
          v.name,
          v.category,
          v.contact,
          v.quotation,
          v.advance_paid,
          v.remaining_amount,
          v.status
        ]);
        break;
      case 'attendance':
        headers = ['Staff Name', 'Role', 'Mobile', 'Status', 'Attendance'];
        rows = staff.map(s => [
          s.name,
          s.role,
          s.mobile,
          s.status,
          s.attendance
        ]);
        break;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    showToast('success', `${reportType.toUpperCase()} report CSV download launched.`);
  };

  return (
    <div className="space-y-6">
      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gold hover:bg-gold hover:text-dark transition-all"
            title="Back to Event list"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 text-[9px] uppercase tracking-widest font-mono font-bold">
                {event.type || 'Wedding'} Workspace
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {event.status}
              </span>
            </div>
            <h2 className="font-serif text-3xl text-cream tracking-tight mt-1">{event.name}</h2>
            <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5 font-mono">
              <MapPin size={12} className="text-gold" /> {event.venue}, {event.city}, {event.state}
            </p>
          </div>
        </div>

        {/* Sync Indicator */}
        <button 
          onClick={fetchEventSpecificData}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs text-text-secondary rounded-xl border border-white/10 flex items-center gap-2 hover:text-gold transition-colors font-mono"
        >
          <RefreshCcw size={12} className={loading ? 'animate-spin text-gold' : ''} />
          Sync Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-4 overflow-x-auto select-none no-scrollbar">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: <Activity size={14} /> },
          { id: 'guests', label: 'RSVP & Guests', icon: <Users size={14} /> },
          { id: 'logistics', label: 'Logistics / Rooms', icon: <Car size={14} /> },
          { id: 'tasks', label: 'Task List', icon: <CheckSquare size={14} /> },
          { id: 'vendors', label: 'Vendors Manager', icon: <Briefcase size={14} /> },
          { id: 'budget', label: 'Budget Tracker', icon: <DollarSign size={14} /> },
          { id: 'timeline', label: 'Timeline / Schedule', icon: <Calendar size={14} /> },
          { id: 'staff', label: 'Event Staff', icon: <Users size={14} /> },
          { id: 'reports', label: 'Exports & Reports', icon: <PieChart size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-gold/15 border border-gold text-gold font-bold' 
                : 'border border-transparent text-text-secondary hover:text-cream hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content views */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-3"
          >
            <RefreshCcw size={32} className="animate-spin text-gold" />
            <p className="text-xs text-text-secondary uppercase tracking-widest font-mono">Synchronizing Event Modules...</p>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Statistics Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total RSVPs Submit', value: allRsvps.length, sub: 'guest groups', color: 'text-cream' },
                    { label: 'Confirmed Attendees', value: totalGuests, sub: `${confirmedCount} groups confirmed`, color: 'text-emerald-400' },
                    { label: 'Pending Invitations', value: pendingCount, sub: 'requires outreach', color: 'text-amber-500' },
                    { label: 'Declined Invitations', value: rejectedCount, sub: 'unable to attend', color: 'text-red-400' },
                    { label: 'Checked In', value: checkedInCount, sub: 'present at venue', color: 'text-gold' },
                    { label: 'Rooms Allocated', value: roomsAllocated, sub: 'hotel rooms occupied', color: 'text-blue-400' },
                    { label: 'Pickup Pending', value: pickupPending, sub: 'cab dispatches remaining', color: 'text-purple-400' },
                    { label: 'Documents Pending', value: documentsPending, sub: 'Aadhaar copy missing', color: 'text-orange-400' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-[110px]">
                      <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block leading-tight">
                        {stat.label}
                      </span>
                      <div>
                        <span className={`text-2xl sm:text-3xl font-serif font-bold ${stat.color}`}>{stat.value}</span>
                        <span className="block text-[10px] text-text-secondary/80 font-sans mt-0.5">{stat.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Event Metadata Card */}
                <div className="bg-gradient-to-r from-white/[0.01] to-white/[0.02] border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold mb-3">Client Information</h4>
                    <div className="space-y-2 text-xs">
                      <p className="text-cream"><strong className="text-text-secondary font-normal">Client:</strong> {event.clientName || 'N/A'}</p>
                      <p className="text-cream"><strong className="text-text-secondary font-normal">Mobile:</strong> {event.clientMobile || 'N/A'}</p>
                      <p className="text-cream"><strong className="text-text-secondary font-normal">Email:</strong> {event.clientEmail || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold mb-3">Scheduling Parameters</h4>
                    <div className="space-y-2 text-xs">
                      <p className="text-cream"><strong className="text-text-secondary font-normal">Start Date:</strong> {event.startDate || event.date}</p>
                      <p className="text-cream"><strong className="text-text-secondary font-normal">End Date:</strong> {event.endDate || event.date}</p>
                      <p className="text-cream"><strong className="text-text-secondary font-normal">Expected Guests:</strong> {event.expectedGuests || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold mb-3">Primary Venue</h4>
                    <div className="space-y-2 text-xs">
                      <p className="text-cream"><strong className="text-text-secondary font-normal">Primary Hotel:</strong> {event.hotelName || 'N/A'}</p>
                      <p className="text-cream"><strong className="text-text-secondary font-normal">Location:</strong> {event.venue}</p>
                      <p className="text-cream"><strong className="text-text-secondary font-normal">City & State:</strong> {event.city}, {event.state}</p>
                    </div>
                  </div>
                </div>

                {/* Sub Module Brief Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tasks Summary */}
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs uppercase tracking-widest text-gold font-bold font-mono">Tasks Progress</h4>
                      <span className="text-xs text-text-secondary font-mono">{tasks.filter(t => t.status === 'Completed').length}/{tasks.length} Completed</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gold h-full transition-all duration-500" 
                        style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="space-y-2">
                      {tasks.slice(0, 3).map(task => (
                        <div key={task.id} className="flex justify-between items-center text-xs">
                          <span className="text-cream truncate max-w-[150px]">{task.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>{task.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financials Summary */}
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs uppercase tracking-widest text-gold font-bold font-mono">Financial Ledger</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-text-secondary block">Income Total</span>
                        <span className="text-sm font-bold text-cream">₹ {totalIncome.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary block">Spent Total</span>
                        <span className="text-sm font-bold text-cream">₹ {(totalExpenses + totalVendorPayments).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="border-t border-white/5 pt-3 flex justify-between items-center text-xs">
                      <span className="text-text-secondary">Balance Available</span>
                      <span className={`font-mono font-bold ${remainingBudgetBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ₹ {remainingBudgetBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Schedule Timeline Mini */}
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs uppercase tracking-widest text-gold font-bold font-mono">Upcoming Slots</h4>
                    <div className="space-y-2.5">
                      {timeline.slice(0, 3).map(slot => (
                        <div key={slot.id} className="flex gap-3 text-xs">
                          <span className="text-gold font-mono whitespace-nowrap">{slot.time}</span>
                          <div>
                            <p className="text-cream font-medium leading-none">{slot.name}</p>
                            <p className="text-[10px] text-text-secondary mt-1">{slot.venue}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GUESTS & RSVPS TAB */}
            {activeTab === 'guests' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-xl text-cream">Guest Workspace</h3>
                    <p className="text-xs text-text-secondary">Guests and RSVP submissions linked strictly to this event.</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-white/5 rounded-2xl bg-white/[0.01]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gold font-mono uppercase tracking-widest text-[10px]">
                        <th className="py-4 px-5">Guest Name</th>
                        <th className="py-4 px-5">Email</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5">Attendees</th>
                        <th className="py-4 px-5">Dietary Notes</th>
                        <th className="py-4 px-5">Checked-In</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-cream">
                      {allRsvps.map(rsvp => (
                        <tr key={rsvp.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-5 font-medium">{rsvp.guest_name}</td>
                          <td className="py-4 px-5 text-text-secondary font-mono">{rsvp.email}</td>
                          <td className="py-4 px-5">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                              rsvp.attending ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {rsvp.attending ? 'Attending' : 'Declined'}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-mono">{rsvp.total_guests} adults {rsvp.children_count > 0 && `, ${rsvp.children_count} kids`}</td>
                          <td className="py-4 px-5 text-text-secondary max-w-[150px] truncate">{rsvp.dietary_requirements || 'None'}</td>
                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono ${
                              rsvp.checked_in ? 'bg-gold/10 text-gold font-bold' : 'bg-white/5 text-text-secondary'
                            }`}>
                              {rsvp.checked_in ? 'Checked In' : 'No'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {allRsvps.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-text-secondary uppercase tracking-wider opacity-40">
                            No RSVPs registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LOGISTICS & ROOMS TAB */}
            {activeTab === 'logistics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Rooms Card */}
                <div className="space-y-4">
                  <h3 className="font-serif text-lg text-cream flex items-center gap-2">
                    <Hotel size={18} className="text-gold" /> Room Bookings Allocation
                  </h3>
                  <div className="overflow-x-auto border border-white/5 rounded-2xl bg-white/[0.01]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-gold font-mono uppercase text-[9px] tracking-widest">
                          <th className="py-3 px-4">Group Name</th>
                          <th className="py-3 px-4">Room/Suite No</th>
                          <th className="py-3 px-4">Check-In</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-cream">
                        {allRooms.map(room => (
                          <tr key={room.id} className="hover:bg-white/[0.02]">
                            <td className="py-3.5 px-4 font-medium">{allFamilies.find(f => f.id === room.family_id)?.name || 'Guest'}</td>
                            <td className="py-3.5 px-4 font-mono text-gold">{room.room_number || 'TBD'} {room.floor && `(${room.floor})`}</td>
                            <td className="py-3.5 px-4 text-text-secondary font-mono">{room.check_in || '-'}</td>
                            <td className="py-3.5 px-4">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-cream">{room.status}</span>
                            </td>
                          </tr>
                        ))}
                        {allRooms.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-text-secondary uppercase tracking-widest opacity-40">
                              No rooms allocated.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transport Dispatch Card */}
                <div className="space-y-4">
                  <h3 className="font-serif text-lg text-cream flex items-center gap-2">
                    <Car size={18} className="text-gold" /> Transport & Cabs Dispatch
                  </h3>
                  <div className="overflow-x-auto border border-white/5 rounded-2xl bg-white/[0.01]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-gold font-mono uppercase text-[9px] tracking-widest">
                          <th className="py-3 px-4">Guest Group</th>
                          <th className="py-3 px-4">Pickup</th>
                          <th className="py-3 px-4">Driver</th>
                          <th className="py-3 px-4">Vehicle No</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-cream">
                        {allTransports.map(trans => (
                          <tr key={trans.id} className="hover:bg-white/[0.02]">
                            <td className="py-3.5 px-4 font-medium">{allFamilies.find(f => f.id === trans.family_id)?.name || 'Guest'}</td>
                            <td className="py-3.5 px-4 text-text-secondary max-w-[100px] truncate">{trans.pickup_location || '-'}</td>
                            <td className="py-3.5 px-4 font-medium">{trans.driver_name || <em className="text-text-secondary/40 font-serif">TBD</em>}</td>
                            <td className="py-3.5 px-4 font-mono text-gold">{trans.vehicle_number || <em className="text-text-secondary/40">TBD</em>}</td>
                          </tr>
                        ))}
                        {allTransports.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-text-secondary uppercase tracking-widest opacity-40">
                              No transport requests.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TASK MANAGER TAB */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-xl text-cream">Event Task Tracker</h3>
                    <p className="text-xs text-text-secondary">Keep coordination elements monitored with milestones.</p>
                  </div>
                  <button 
                    onClick={() => handleOpenTaskModal()}
                    className="px-4 py-2 bg-gold text-dark text-xs uppercase font-bold tracking-widest flex items-center gap-1.5 rounded-xl transition-all hover:brightness-110"
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map(task => (
                    <div key={task.id} className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4 relative group">
                      <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenTaskModal(task)} className="p-1 text-text-secondary hover:text-gold">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-text-secondary hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold ${
                            task.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {task.priority} Priority
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold ${
                            task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <h4 className="font-serif text-lg text-cream leading-snug">{task.name}</h4>
                      </div>

                      <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[11px] text-text-secondary font-mono">
                        <span className="flex items-center gap-1"><User size={11} /> {task.assigned_to || 'Unassigned'}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {task.deadline}</span>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="col-span-full py-12 text-center text-text-secondary uppercase tracking-widest opacity-40">
                      No Tasks registered.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VENDOR MANAGER TAB */}
            {activeTab === 'vendors' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-xl text-cream">Vendor Operations Manager</h3>
                    <p className="text-xs text-text-secondary">Track vendor agreements, paid advances, and balances due.</p>
                  </div>
                  <button 
                    onClick={() => handleOpenVendorModal()}
                    className="px-4 py-2 bg-gold text-dark text-xs uppercase font-bold tracking-widest flex items-center gap-1.5 rounded-xl transition-all hover:brightness-110"
                  >
                    <Plus size={14} /> Register Vendor
                  </button>
                </div>

                <div className="overflow-x-auto border border-white/5 rounded-2xl bg-white/[0.01]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gold font-mono uppercase tracking-widest text-[10px]">
                        <th className="py-4 px-5">Vendor Name</th>
                        <th className="py-4 px-5">Category</th>
                        <th className="py-4 px-5">Contact</th>
                        <th className="py-4 px-5">Quotation</th>
                        <th className="py-4 px-5">Advance Paid</th>
                        <th className="py-4 px-5">Remaining</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-cream">
                      {vendors.map(v => (
                        <tr key={v.id} className="hover:bg-white/[0.02]">
                          <td className="py-4 px-5 font-medium">{v.name}</td>
                          <td className="py-4 px-5 uppercase tracking-wider text-[10px] text-gold font-mono">{v.category}</td>
                          <td className="py-4 px-5 font-mono text-text-secondary">{v.contact}</td>
                          <td className="py-4 px-5 font-mono font-medium">₹ {Number(v.quotation || 0).toLocaleString()}</td>
                          <td className="py-4 px-5 font-mono text-emerald-400">₹ {Number(v.advance_paid || 0).toLocaleString()}</td>
                          <td className="py-4 px-5 font-mono text-red-400">₹ {Number(v.remaining_amount || 0).toLocaleString()}</td>
                          <td className="py-4 px-5">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-cream">{v.status}</span>
                          </td>
                          <td className="py-4 px-5 flex gap-2">
                            <button onClick={() => handleOpenVendorModal(v)} className="p-1 text-text-secondary hover:text-gold">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeleteVendor(v.id)} className="p-1 text-text-secondary hover:text-red-400">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {vendors.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-text-secondary uppercase tracking-widest opacity-40">
                            No Vendors assigned.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BUDGET TRACKER TAB */}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Budget summary panel */}
                  <div className="bg-gradient-to-br from-white/[0.01] to-white/[0.02] border border-white/5 rounded-2xl p-6 lg:col-span-1 space-y-6">
                    <h3 className="font-serif text-lg text-gold flex items-center gap-1.5"><DollarSign size={18} /> Budget Summary</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono">Total Income (Funds Available)</span>
                        <p className="text-3xl font-bold font-serif text-cream mt-0.5">₹ {totalIncome.toLocaleString()}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono">General Expenses</span>
                          <p className="text-lg font-bold text-cream">₹ {totalExpenses.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono">Vendor Paid Advances</span>
                          <p className="text-lg font-bold text-emerald-400">₹ {totalVendorPayments.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block">Vendor Balance Pending</span>
                        <p className="text-lg font-bold text-red-400 mt-0.5">₹ {totalVendorRemaining.toLocaleString()}</p>
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <span className="text-[10px] uppercase tracking-widest text-gold font-mono block">Current Balance</span>
                        <p className={`text-2xl font-serif font-bold mt-1 ${remainingBudgetBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ₹ {remainingBudgetBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1 font-mono font-bold">Primary Client Advance</label>
                        <input 
                          type="number"
                          value={advanceReceived || ''}
                          onChange={async e => {
                            const val = Number(e.target.value);
                            setAdvanceReceived(val);
                            await saveDetailsState(tasks, vendors, budgetIncome, budgetExpenses, val, pendingPayment, timeline, staff);
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-cream focus:border-gold focus:outline-none"
                          placeholder="e.g. 500000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Income/Expense Logs */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Income Log */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs uppercase tracking-widest text-gold font-bold font-mono">Income / Funding Receipts</h4>
                        <button 
                          onClick={() => {
                            setEditingIncome({ id: 'inc_' + Math.random().toString(36).substring(2, 9), source: '', amount: 0, date: new Date().toISOString().split('T')[0] });
                            setShowIncomeModal(true);
                          }}
                          className="text-[10px] uppercase text-gold font-bold tracking-widest flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Funding
                        </button>
                      </div>

                      <div className="border border-white/5 rounded-2xl bg-white/[0.01] max-h-[180px] overflow-y-auto divide-y divide-white/5">
                        {budgetIncome.map(inc => (
                          <div key={inc.id} className="p-3 flex justify-between items-center text-xs">
                            <div>
                              <p className="text-cream font-medium">{inc.source}</p>
                              <p className="text-[10px] text-text-secondary font-mono mt-0.5">{inc.date}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-emerald-400 font-bold">₹ {inc.amount.toLocaleString()}</span>
                              <button 
                                onClick={async () => {
                                  if (!confirm('Remove funding item?')) return;
                                  const updated = budgetIncome.filter(i => i.id !== inc.id);
                                  setBudgetIncome(updated);
                                  await saveDetailsState(tasks, vendors, updated, budgetExpenses, advanceReceived, pendingPayment, timeline, staff);
                                }}
                                className="text-text-secondary hover:text-red-400"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {budgetIncome.length === 0 && (
                          <p className="p-4 text-center text-text-secondary text-xs italic">No secondary funding entries added.</p>
                        )}
                      </div>
                    </div>

                    {/* Expenses Log */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs uppercase tracking-widest text-gold font-bold font-mono">General Expense Outlays</h4>
                        <button 
                          onClick={() => {
                            setEditingExpense({ id: 'exp_' + Math.random().toString(36).substring(2, 9), category: '', amount: 0, recipient: '', date: new Date().toISOString().split('T')[0] });
                            setShowExpenseModal(true);
                          }}
                          className="text-[10px] uppercase text-gold font-bold tracking-widest flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Expense
                        </button>
                      </div>

                      <div className="border border-white/5 rounded-2xl bg-white/[0.01] max-h-[180px] overflow-y-auto divide-y divide-white/5">
                        {budgetExpenses.map(exp => (
                          <div key={exp.id} className="p-3 flex justify-between items-center text-xs">
                            <div>
                              <p className="text-cream font-medium">{exp.category}</p>
                              <p className="text-[10px] text-text-secondary font-mono mt-0.5">{exp.date} • Payee: {exp.recipient}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-red-400 font-bold">₹ {exp.amount.toLocaleString()}</span>
                              <button 
                                onClick={async () => {
                                  if (!confirm('Remove expense item?')) return;
                                  const updated = budgetExpenses.filter(e => e.id !== exp.id);
                                  setBudgetExpenses(updated);
                                  await saveDetailsState(tasks, vendors, budgetIncome, updated, advanceReceived, pendingPayment, timeline, staff);
                                }}
                                className="text-text-secondary hover:text-red-400"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {budgetExpenses.length === 0 && (
                          <p className="p-4 text-center text-text-secondary text-xs italic">No general expenses recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TIMELINE MANAGER TAB */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-xl text-cream">Event Program Timeline</h3>
                    <p className="text-xs text-text-secondary">Set up functions schedule which guests will securely preview.</p>
                  </div>
                  <button 
                    onClick={() => handleOpenTimelineModal()}
                    className="px-4 py-2 bg-gold text-dark text-xs uppercase font-bold tracking-widest flex items-center gap-1.5 rounded-xl transition-all hover:brightness-110"
                  >
                    <Plus size={14} /> Add Slot
                  </button>
                </div>

                <div className="relative border-l border-gold/20 pl-6 ml-4 space-y-8">
                  {timeline.map((slot, idx) => (
                    <div key={slot.id} className="relative group bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-2">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-6 w-3 h-3 rounded-full bg-gold border border-dark group-hover:scale-125 transition-transform" />
                      
                      <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenTimelineModal(slot)} className="p-1 text-text-secondary hover:text-gold">
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (!confirm('Remove schedule slot?')) return;
                            const updated = timeline.filter(t => t.id !== slot.id);
                            setTimeline(updated);
                            await saveDetailsState(tasks, vendors, budgetIncome, budgetExpenses, advanceReceived, pendingPayment, updated, staff);
                            showToast('success', 'Timeline item deleted.');
                          }} 
                          className="p-1 text-text-secondary hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-gold font-mono text-xs">
                        <Clock size={12} /> {slot.time}
                        <span className="text-white/20">•</span>
                        <Calendar size={12} className="text-white/40" /> {slot.date}
                      </div>

                      <h4 className="font-serif text-lg text-cream leading-snug">{slot.name}</h4>
                      <p className="text-xs text-text-secondary font-mono">{slot.venue}</p>
                      {slot.notes && (
                        <p className="text-xs text-gold/80 italic mt-2 border-t border-white/5 pt-2">{slot.notes}</p>
                      )}
                    </div>
                  ))}
                  {timeline.length === 0 && (
                    <div className="py-12 text-center text-text-secondary uppercase tracking-widest opacity-40">
                      No Timeline entries drafted.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAFF MANAGER TAB */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-xl text-cream">Staff Roster Coordinator</h3>
                    <p className="text-xs text-text-secondary">Register hosts, valets, and coordinators assigned to this event.</p>
                  </div>
                  <button 
                    onClick={() => handleOpenStaffModal()}
                    className="px-4 py-2 bg-gold text-dark text-xs uppercase font-bold tracking-widest flex items-center gap-1.5 rounded-xl transition-all hover:brightness-110"
                  >
                    <Plus size={14} /> Assign Staff
                  </button>
                </div>

                <div className="overflow-x-auto border border-white/5 rounded-2xl bg-white/[0.01]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gold font-mono uppercase tracking-widest text-[10px]">
                        <th className="py-4 px-5">Staff Name</th>
                        <th className="py-4 px-5">Role</th>
                        <th className="py-4 px-5">Mobile</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5">Attendance</th>
                        <th className="py-4 px-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-cream">
                      {staff.map(member => (
                        <tr key={member.id} className="hover:bg-white/[0.02]">
                          <td className="py-4 px-5 font-medium">{member.name}</td>
                          <td className="py-4 px-5 font-mono uppercase text-gold tracking-wide text-[10px]">{member.role}</td>
                          <td className="py-4 px-5 font-mono text-text-secondary">{member.mobile}</td>
                          <td className="py-4 px-5">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              member.status === 'Active' ? 'text-emerald-400' : 'text-text-secondary'
                            }`}>{member.status}</span>
                          </td>
                          <td className="py-4 px-5">
                            <select 
                              value={member.attendance}
                              onChange={async e => {
                                const val = e.target.value as any;
                                const updated = staff.map(s => s.id === member.id ? { ...s, attendance: val } : s);
                                setStaff(updated);
                                await saveDetailsState(tasks, vendors, budgetIncome, budgetExpenses, advanceReceived, pendingPayment, timeline, updated);
                                showToast('success', `${member.name} attendance updated.`);
                              }}
                              className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-cream focus:border-gold focus:outline-none"
                            >
                              <option value="N/A">N/A</option>
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                            </select>
                          </td>
                          <td className="py-4 px-5 flex gap-2">
                            <button onClick={() => handleOpenStaffModal(member)} className="p-1 text-text-secondary hover:text-gold">
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (!confirm('De-assign staff member?')) return;
                                const updated = staff.filter(s => s.id !== member.id);
                                setStaff(updated);
                                await saveDetailsState(tasks, vendors, budgetIncome, budgetExpenses, advanceReceived, pendingPayment, timeline, updated);
                                showToast('success', 'Staff member de-assigned.');
                              }} 
                              className="p-1 text-text-secondary hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {staff.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-text-secondary uppercase tracking-widest opacity-40">
                            No Staff profiles registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORTS & EXPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-xl text-cream">Operational Audits & CSV Reports</h3>
                  <p className="text-xs text-text-secondary">Export structured databases to CSV spreadsheet format immediately.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'Guest Rsvp List', desc: 'Detailed list of RSVPs, adult/child counts, and dietary options.', action: () => handleExportCSV('guest') },
                    { title: 'Transport Dispatches', desc: 'Driver assignments, cab statuses, pickup locations, and arrival schedules.', action: () => handleExportCSV('transport') },
                    { title: 'Hotel Occupancies', desc: 'Room allocations, suite details, floors, and check-in timelines.', action: () => handleExportCSV('hotel') },
                    { title: 'Financial Ledger', desc: 'Live income funding items and general expenditure logs.', action: () => handleExportCSV('budget') },
                    { title: 'Vendor Contracts', desc: 'Quotations, advance outlays, remaining dues, and contract status.', action: () => handleExportCSV('vendor') },
                    { title: 'Attendance Audit', desc: 'Staff lists, role definitions, and daily attendance markings.', action: () => handleExportCSV('attendance') }
                  ].map((rep, i) => (
                    <div key={i} className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-[150px] hover:border-gold/30 transition-all duration-300">
                      <div>
                        <h4 className="font-serif text-lg text-cream mb-1">{rep.title}</h4>
                        <p className="text-xs text-text-secondary leading-normal">{rep.desc}</p>
                      </div>
                      <button 
                        onClick={rep.action}
                        className="px-4 py-2 bg-white/5 hover:bg-gold hover:text-dark text-[10px] uppercase font-bold tracking-widest border border-gold/20 hover:border-gold rounded-xl transition-all self-start flex items-center gap-1.5 mt-4"
                      >
                        <Download size={12} /> Export to Excel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TASK MODAL FORM --- */}
      {showTaskModal && editingTask && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-dark border border-white/10 rounded-2xl p-6 relative shadow-2xl">
            <h3 className="font-serif text-xl text-gold mb-4">{tasks.some(t => t.id === editingTask.id) ? 'Modify Task' : 'Add New Task'}</h3>
            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Task Description</label>
                <input 
                  type="text" required
                  value={editingTask.name || ''}
                  onChange={e => setEditingTask({ ...editingTask, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  placeholder="e.g. Call DJ Sound setup"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Assigned To</label>
                  <input 
                    type="text"
                    value={editingTask.assigned_to || ''}
                    onChange={e => setEditingTask({ ...editingTask, assigned_to: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Deadline</label>
                  <input 
                    type="text"
                    value={editingTask.deadline || ''}
                    onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    placeholder="e.g. 15 Oct"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Priority</label>
                  <select 
                    value={editingTask.priority || 'Medium'}
                    onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Status</label>
                  <select 
                    value={editingTask.status || 'Pending'}
                    onChange={e => setEditingTask({ ...editingTask, status: e.target.value as any })}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl uppercase tracking-widest text-[10px] text-text-secondary">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-dark font-bold rounded-xl uppercase tracking-widest text-[10px]">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VENDOR MODAL FORM --- */}
      {showVendorModal && editingVendor && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-dark border border-white/10 rounded-2xl p-6 relative shadow-2xl">
            <h3 className="font-serif text-xl text-gold mb-4">{vendors.some(v => v.id === editingVendor.id) ? 'Modify Vendor' : 'Add New Vendor'}</h3>
            <form onSubmit={handleSaveVendor} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Vendor Name</label>
                <input 
                  type="text" required
                  value={editingVendor.name || ''}
                  onChange={e => setEditingVendor({ ...editingVendor, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  placeholder="e.g. Golden Caterers"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Category</label>
                  <input 
                    type="text" required
                    value={editingVendor.category || ''}
                    onChange={e => setEditingVendor({ ...editingVendor, category: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    placeholder="e.g. Catering, Florist"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Contact</label>
                  <input 
                    type="text" required
                    value={editingVendor.contact || ''}
                    onChange={e => setEditingVendor({ ...editingVendor, contact: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Quotation Quote (₹)</label>
                  <input 
                    type="number" required
                    value={editingVendor.quotation || ''}
                    onChange={e => setEditingVendor({ ...editingVendor, quotation: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none font-mono"
                    placeholder="e.g. 150000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Advance Paid (₹)</label>
                  <input 
                    type="number" required
                    value={editingVendor.advance_paid || ''}
                    onChange={e => setEditingVendor({ ...editingVendor, advance_paid: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none font-mono"
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Status</label>
                  <select 
                    value={editingVendor.status || 'Pending'}
                    onChange={e => setEditingVendor({ ...editingVendor, status: e.target.value as any })}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Notes</label>
                  <input 
                    type="text"
                    value={editingVendor.notes || ''}
                    onChange={e => setEditingVendor({ ...editingVendor, notes: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    placeholder="Food trials complete"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowVendorModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl uppercase tracking-widest text-[10px] text-text-secondary">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-dark font-bold rounded-xl uppercase tracking-widest text-[10px]">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TIMELINE MODAL --- */}
      {showTimelineModal && editingTimelineItem && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-dark border border-white/10 rounded-2xl p-6 relative shadow-2xl">
            <h3 className="font-serif text-xl text-gold mb-4">{timeline.some(t => t.id === editingTimelineItem.id) ? 'Modify Slot' : 'Add New Slot'}</h3>
            <form onSubmit={handleSaveTimeline} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Event Slot Title</label>
                <input 
                  type="text" required
                  value={editingTimelineItem.name || ''}
                  onChange={e => setEditingTimelineItem({ ...editingTimelineItem, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  placeholder="e.g. Sangeet & Choreographies"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Time Setting</label>
                  <input 
                    type="text" required
                    value={editingTimelineItem.time || ''}
                    onChange={e => setEditingTimelineItem({ ...editingTimelineItem, time: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none font-mono"
                    placeholder="e.g. 07:30 PM"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Date</label>
                  <input 
                    type="text" required
                    value={editingTimelineItem.date || ''}
                    onChange={e => setEditingTimelineItem({ ...editingTimelineItem, date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none font-mono"
                    placeholder="e.g. 2026-10-15"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Specific Venue</label>
                <input 
                  type="text" required
                  value={editingTimelineItem.venue || ''}
                  onChange={e => setEditingTimelineItem({ ...editingTimelineItem, venue: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  placeholder="e.g. Grand Ballroom"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Schedule Notes</label>
                <input 
                  type="text"
                  value={editingTimelineItem.notes || ''}
                  onChange={e => setEditingTimelineItem({ ...editingTimelineItem, notes: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  placeholder="dress code: dark ethnics"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowTimelineModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl uppercase tracking-widest text-[10px] text-text-secondary">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-dark font-bold rounded-xl uppercase tracking-widest text-[10px]">Save Timeline Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STAFF MODAL --- */}
      {showStaffModal && editingStaff && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-dark border border-white/10 rounded-2xl p-6 relative shadow-2xl">
            <h3 className="font-serif text-xl text-gold mb-4">{staff.some(s => s.id === editingStaff.id) ? 'Modify Staff Assignment' : 'Add New Staff Assignment'}</h3>
            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Staff Name</label>
                <input 
                  type="text" required
                  value={editingStaff.name || ''}
                  onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  placeholder="e.g. Rajat Verma"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Role</label>
                  <input 
                    type="text" required
                    value={editingStaff.role || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    placeholder="e.g. Venue Coordinator"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Mobile Contact</label>
                  <input 
                    type="tel" required
                    value={editingStaff.mobile || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, mobile: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none font-mono"
                    placeholder="e.g. +91 91234 56789"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Roster Status</label>
                <select 
                  value={editingStaff.status || 'Active'}
                  onChange={e => setEditingStaff({ ...editingStaff, status: e.target.value as any })}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl uppercase tracking-widest text-[10px] text-text-secondary">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-dark font-bold rounded-xl uppercase tracking-widest text-[10px]">Assign Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BUDGET INCOME MODAL --- */}
      {showIncomeModal && editingIncome && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-dark border border-white/10 rounded-2xl p-6 relative shadow-2xl">
            <h3 className="font-serif text-xl text-gold mb-4">Add Secondary Funding / Income</h3>
            <form onSubmit={handleSaveIncome} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Funding Source / Item</label>
                <input 
                  type="text" required
                  value={editingIncome.source || ''}
                  onChange={e => setEditingIncome({ ...editingIncome, source: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  placeholder="e.g. Uncle Contribution"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Amount (₹)</label>
                  <input 
                    type="number" required
                    value={editingIncome.amount || ''}
                    onChange={e => setEditingIncome({ ...editingIncome, amount: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none font-mono"
                    placeholder="e.g. 100000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Date</label>
                  <input 
                    type="date" required
                    value={editingIncome.date || ''}
                    onChange={e => setEditingIncome({ ...editingIncome, date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowIncomeModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl uppercase tracking-widest text-[10px] text-text-secondary">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-dark font-bold rounded-xl uppercase tracking-widest text-[10px]">Add Funding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BUDGET EXPENSE MODAL --- */}
      {showExpenseModal && editingExpense && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-dark border border-white/10 rounded-2xl p-6 relative shadow-2xl">
            <h3 className="font-serif text-xl text-gold mb-4">Add General Expense Outlay</h3>
            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Expense Description / Category</label>
                <input 
                  type="text" required
                  value={editingExpense.category || ''}
                  onChange={e => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  placeholder="e.g. Sound Permits, Alcohol License"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Amount Paid (₹)</label>
                  <input 
                    type="number" required
                    value={editingExpense.amount || ''}
                    onChange={e => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none font-mono"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Date</label>
                  <input 
                    type="date" required
                    value={editingExpense.date || ''}
                    onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-text-secondary tracking-widest mb-1.5">Recipient / Payee</label>
                <input 
                  type="text" required
                  value={editingExpense.recipient || ''}
                  onChange={e => setEditingExpense({ ...editingExpense, recipient: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-cream focus:border-gold focus:outline-none"
                  placeholder="e.g. Local Commissioner Office"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl uppercase tracking-widest text-[10px] text-text-secondary">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gold text-dark font-bold rounded-xl uppercase tracking-widest text-[10px]">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
