const fs = require('fs');
let code = fs.readFileSync('src/components/home/Contact.tsx', 'utf8');

if (!code.includes('AuthModal')) {
    code = code.replace(
      "import { dataService } from '../../lib/dataService';",
      "import { dataService } from '../../lib/dataService';\nimport AuthModal from '../layout/AuthModal';\nimport { authService } from '../../lib/authService';"
    );
    
    code = code.replace(
      "  const [message, setMessage] = useState('');",
      "  const [message, setMessage] = useState('');\n  const [showAuthModal, setShowAuthModal] = useState(false);\n"
    );
    
    let processSubmitStr = `  const processSubmit = async () => {
    setLoading(true);
    try {
      await dataService.addInquiry({
        name,
        email,
        phone: 'Not provided', // General contact form doesn't ask for phone by default in this component
        service_selected: \`General Inquiry: \${subject}\`,
        message,
        status: 'Pending'
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting contact message:', err);
      alert('Failed to send message. Please try again.');
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
  };`;

    // Replace the original handleSubmit
    const originalHandleSubmitStart = "  const handleSubmit = async (e: React.FormEvent) => {";
    const nextFunctionOrReturn = "  return (";
    
    let beforeHandleSubmit = code.split(originalHandleSubmitStart)[0];
    let afterHandleSubmit = code.split(nextFunctionOrReturn)[1];
    
    code = beforeHandleSubmit + processSubmitStr + '\n  return (' + afterHandleSubmit;
    
    code = code.replace(
      "    </section>\n  );",
      "      <AuthModal \n        isOpen={showAuthModal}\n        onClose={() => setShowAuthModal(false)}\n        onSuccess={() => {\n          setShowAuthModal(false);\n          processSubmit();\n        }}\n      />\n    </section>\n  );"
    );
    fs.writeFileSync('src/components/home/Contact.tsx', code);
}
