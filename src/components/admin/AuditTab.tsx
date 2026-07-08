import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/dataService';
import { AuditLog } from '../../types';
import { Shield, Search, RefreshCw, Calendar, Eye, User } from 'lucide-react';

export default function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const categories = ['All', 'Invites', 'Inquiries', 'CMS Services', 'CMS Gallery'];

  const filteredLogs = logs.filter(log => {
    const isCategoryMatch = filterCategory === 'All' || log.category === filterCategory;
    const isSearchMatch = 
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.performer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
    return isCategoryMatch && isSearchMatch;
  });

  return (
    <div id="audit-logs-panel" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
        <div>
          <h4 className="font-serif text-2xl text-cream flex items-center gap-2 italic">
            <Shield className="text-gold" size={22} /> Audit Trail Authority
          </h4>
          <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Immutable security logs tracking dynamic event actions</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="px-4 py-2 border border-gold/20 text-gold text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-gold/10 transition-all font-semibold"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Reload Logs
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Category filtering pills */}
        <div className="flex flex-wrap gap-2 flex-grow">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-2 text-[10px] tracking-wider uppercase rounded-lg transition-all border ${
                filterCategory === cat 
                  ? 'bg-gold/10 text-gold border-gold/30 font-medium' 
                  : 'bg-black/30 text-text-secondary border-white/5 hover:text-cream'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Local log filtering filter bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 pl-9 pr-4 py-2 text-xs outline-none focus:border-gold transition-colors text-cream rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="animate-spin text-gold" size={32} />
          <p className="text-[10px] text-text-secondary uppercase tracking-widest font-light">Retrieving secure logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-black/10">
          <p className="text-sm text-text-secondary">No recorded audit logs match these parameters.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 bg-black/20 border border-white/5 hover:border-gold/10 rounded-xl transition-all flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1 flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-gold/10 text-gold text-[9px] font-semibold tracking-wider uppercase rounded">
                    {log.category}
                  </span>
                  <span className="text-xs text-cream font-medium">
                    {log.action}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary/80 leading-relaxed font-sans">{log.details}</p>
              </div>

              <div className="flex flex-row md:flex-col justify-between items-end shrink-0 gap-2 border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
                <div className="flex items-center gap-1.5 text-[10px] text-cream/70 font-mono">
                  <User size={12} className="text-gold" />
                  <span>{log.performer}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-secondary/50 font-mono">
                  <Calendar size={12} />
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
