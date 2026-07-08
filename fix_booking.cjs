const fs = require('fs');
let code = fs.readFileSync('src/components/home/BookingForm.tsx', 'utf8');

// I'll just write a script to completely rebuild the component correctly.
let before = code.split('export default function BookingForm() {')[0];

let rest = `export default function BookingForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [notes, setNotes] = useState('');

  const processSubmit = async () => {
    setLoading(true);
    try {
      const selectedServiceDetails = \`\${eventType} Event (\${guestCount} guests, on \${preferredDate})\`;
      await dataService.addInquiry({
        name: fullName,
        email: email,
        phone: phone,
        service_selected: selectedServiceDetails,
        message: notes.trim() || 'No additional notes provided.',
        status: 'Pending'
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      alert('Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    await processSubmit();
  };
`;

let after = code.split('  return (')[1];
let newCode = before + rest + '\n  return (' + after;
fs.writeFileSync('src/components/home/BookingForm.tsx', newCode);
