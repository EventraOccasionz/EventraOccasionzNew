const fs = require('fs');
let code = fs.readFileSync('src/components/home/BookingForm.tsx', 'utf8');

if (!code.includes('AuthModal')) {
    code = code.replace(
      "import { dataService } from '../../lib/dataService';",
      "import { dataService } from '../../lib/dataService';\nimport AuthModal from '../layout/AuthModal';\nimport { authService } from '../../lib/authService';"
    );
    
    code = code.replace(
      "  const [notes, setNotes] = useState('');",
      "  const [notes, setNotes] = useState('');\n  const [showAuthModal, setShowAuthModal] = useState(false);\n"
    );
    
    code = code.replace(
      "  const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setLoading(true);",
      "  const processSubmit = async () => {\n    setLoading(true);\n    try {\n      const selectedServiceDetails = `${eventType} Event (${guestCount} guests, on ${preferredDate})`;\n      await dataService.addInquiry({\n        name: fullName,\n        email: email,\n        phone: phone,\n        service_selected: selectedServiceDetails,\n        message: notes.trim() || 'No additional notes provided.',\n        status: 'Pending'\n      });\n      setIsSubmitted(true);\n    } catch (err) {\n      console.error('Error submitting inquiry:', err);\n      alert('Failed to submit enquiry. Please try again.');\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    \n    // Check if user is authenticated\n    const currentUser = authService.getCurrentUser();\n    if (!currentUser) {\n      setShowAuthModal(true);\n      return;\n    }\n    \n    await processSubmit();"
    );
    
    // We need to carefully remove the original code inside handleSubmit so it doesn't duplicate
    code = code.replace(
      "    try {\n      const selectedServiceDetails = `${eventType} Event (${guestCount} guests, on ${preferredDate})`;\n      await dataService.addInquiry({\n        name: fullName,\n        email: email,\n        phone: phone,\n        service_selected: selectedServiceDetails,\n        message: notes.trim() || 'No additional notes provided.',\n        status: 'Pending'\n      });\n      setIsSubmitted(true);\n    } catch (err) {\n      console.error('Error submitting inquiry:', err);\n      alert('Failed to submit enquiry. Please try again.');\n    } finally {\n      setLoading(false);\n    }\n  };\n",
      "  };\n"
    );

    code = code.replace(
      "      </div>\n    </section>",
      "      </div>\n      <AuthModal \n        isOpen={showAuthModal}\n        onClose={() => setShowAuthModal(false)}\n        onSuccess={() => {\n          setShowAuthModal(false);\n          processSubmit();\n        }}\n      />\n    </section>"
    );

    fs.writeFileSync('src/components/home/BookingForm.tsx', code);
}
