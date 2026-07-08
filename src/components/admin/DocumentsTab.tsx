import React, { useState } from 'react';
import { Family, UploadedDocument } from '../../types';
import { dataService } from '../../lib/dataService';
import { 
  FileText, Download, Eye, Trash2, Search, ExternalLink, 
  Users, CheckCircle, ShieldAlert, X
} from 'lucide-react';

interface DocumentsTabProps {
  families: Family[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export default function DocumentsTab({
  families,
  onRefresh,
  showToast
}: DocumentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<{ familyId: string, docId: string } | null>(null);

  // Flatten families to list of documents with parent family context
  const allDocuments = families.flatMap(f => 
    (f.documents || []).map(doc => ({
      ...doc,
      familyId: f.id,
      familyName: f.name
    }))
  );

  // Filter documents based on search term (guest group or document name)
  const filteredDocuments = allDocuments.filter(doc => 
    doc.familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalDocsCount = allDocuments.length;
  const uniqueFamiliesCount = new Set(allDocuments.map(d => d.familyId)).size;

  const handleDelete = async () => {
    if (!deletingDocId) return;

    const { familyId, docId } = deletingDocId;
    const targetFamily = families.find(f => f.id === familyId);
    if (!targetFamily || !targetFamily.documents) return;

    try {
      const updatedDocs = targetFamily.documents.filter(d => d.id !== docId);
      await dataService.updateFamily(familyId, { documents: updatedDocs });
      
      showToast('success', 'Document deleted successfully.');
      
      setDeletingDocId(null);
      onRefresh();
    } catch (err: any) {
      showToast('error', `Failed to delete document: ${err?.message || err}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div id="admin-documents-section" className="space-y-6">
      
      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-gold/10 border border-gold/20 text-gold rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Total Verified Documents</p>
            <p className="text-xl font-serif text-cream font-bold mt-1">{totalDocsCount}</p>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-gold/10 border border-gold/20 text-gold rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Verified Guest Groups</p>
            <p className="text-xl font-serif text-cream font-bold mt-1">{uniqueFamiliesCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input
            id="admin-docs-search-input"
            type="text"
            placeholder="Search by guest group or document name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cream placeholder-white/30 focus:outline-none focus:border-gold/50 transition-all font-sans"
          />
        </div>
        <p className="text-[10px] text-[#D4AF37]/60 font-mono">
          Showing {filteredDocuments.length} of {totalDocsCount} documents
        </p>
      </div>

      {/* Documents Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
        <table id="admin-documents-table" className="w-full border-collapse min-w-[800px]">
          <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10 bg-black/20">
            <tr>
              <th className="text-left py-4 px-5">Guest Group / Family</th>
              <th className="text-left py-4 px-5">Document Name</th>
              <th className="text-left py-4 px-5">File Details</th>
              <th className="text-left py-4 px-5">Uploaded Date</th>
              <th className="text-right py-4 px-5">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs text-text-secondary">
            {filteredDocuments.map((doc) => (
              <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-5">
                  <p className="text-cream font-semibold">{doc.familyName}</p>
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2 max-w-[250px]">
                    <FileText size={16} className="text-gold flex-shrink-0" />
                    <span className="truncate text-white/80" title={doc.name}>{doc.name}</span>
                  </div>
                </td>
                <td className="py-4 px-5 font-mono text-[10px] text-text-secondary/80">
                  <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded mr-1.5 uppercase tracking-wider text-[8px]">
                    {doc.type.split('/')[1] || doc.type}
                  </span>
                  <span>{formatSize(doc.size)}</span>
                </td>
                <td className="py-4 px-5 font-sans text-xs">
                  {doc.uploaded_at 
                    ? new Date(doc.uploaded_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                    : 'N/A'
                  }
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/20 rounded-lg text-gold transition-colors"
                      title="Preview Document"
                    >
                      <Eye size={14} />
                    </button>
                    <a
                      href={doc.url}
                      download={doc.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/20 rounded-lg text-gold transition-colors flex items-center justify-center"
                      title="Download File"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      onClick={() => setDeletingDocId({ familyId: doc.familyId, docId: doc.id })}
                      className="p-2 bg-white/5 hover:bg-red-950/30 border border-white/5 hover:border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredDocuments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-24 text-center text-text-secondary uppercase tracking-widest opacity-40">
                  {searchTerm ? 'No matching documents found' : 'No documents have been uploaded yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inline Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[4000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#121212] border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gold" />
                <div>
                  <h3 className="text-sm font-serif font-semibold text-cream">{previewDoc.name}</h3>
                  <p className="text-[10px] text-text-secondary">Uploaded for {allDocuments.find(d => d.id === previewDoc.id)?.familyName}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-black/40 min-h-[300px]">
              {previewDoc.type.startsWith('image/') ? (
                <img 
                  src={previewDoc.url} 
                  alt={previewDoc.name} 
                  className="max-w-full max-h-[60vh] object-contain rounded-lg border border-white/10 shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : previewDoc.type === 'application/pdf' ? (
                <div className="text-center p-12 max-w-sm space-y-4">
                  <div className="w-16 h-16 bg-red-950/20 text-red-400 border border-red-500/10 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cream">PDF Document</h4>
                    <p className="text-xs text-text-secondary mt-1">Direct preview is not supported for PDFs in this container. Please download or open in a new window.</p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <a
                      href={previewDoc.url}
                      download={previewDoc.name}
                      className="px-4 py-2 bg-gold/10 border border-gold/30 hover:bg-gold/20 text-gold rounded-lg text-xs font-semibold transition-all"
                    >
                      Download File
                    </a>
                    <a
                      href={previewDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      Open in New Tab <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 max-w-sm space-y-4">
                  <div className="w-16 h-16 bg-gold/10 text-gold border border-gold/20 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cream">Non-Image Document</h4>
                    <p className="text-xs text-text-secondary mt-1">Previewing type "{previewDoc.type}" is not supported. Please download or view using external software.</p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={previewDoc.url}
                      download={previewDoc.name}
                      className="px-5 py-2.5 bg-gold hover:bg-gold/90 text-black rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors border border-white/5"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingDocId && (
        <div className="fixed inset-0 z-[4100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-white/10 p-6 rounded-2xl space-y-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-950/30 text-red-400 border border-red-500/20 rounded-xl flex-shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-cream font-serif">Remove Verification Document?</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Are you absolutely sure you want to delete this guest verification document? This action is irreversible and the guest will need to upload their document again.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingDocId(null)}
                className="px-4 py-2 border border-white/5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
