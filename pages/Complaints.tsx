import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MockDB } from '../services/mockDb';
import { Complaint } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MessageSquare, Clock, CheckCircle } from 'lucide-react';

const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [traderName, setTraderName] = useState('');
  const [issue, setIssue] = useState('');

  const refreshComplaints = () => {
    if (user) {
      const data = MockDB.getComplaintsByUserId(user.id);
      setComplaints(data.reverse()); // Show newest first
    }
  };

  useEffect(() => {
    refreshComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newComplaint: Complaint = {
      id: Date.now().toString(),
      userId: user.id,
      traderName,
      issue,
      date: new Date().toLocaleDateString(),
      status: 'Pending'
    };

    MockDB.createComplaint(newComplaint);
    setTraderName('');
    setIssue('');
    alert("Complaint Registered Successfully");
    refreshComplaints();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-900 mb-8 flex items-center">
        <MessageSquare className="mr-3" /> {t('comp_title')}
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Complaint Form */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-red-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('comp_submit')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label={t('comp_trader')}
              value={traderName}
              onChange={e => setTraderName(e.target.value)}
              required
              placeholder="Enter name or company"
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('comp_issue')}
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none"
                value={issue}
                onChange={e => setIssue(e.target.value)}
                required
                placeholder="Details of unfair pricing, delayed payment, etc."
              />
            </div>

            <Button type="submit" variant="danger" fullWidth>
              Register Official Complaint
            </Button>
          </form>
        </div>

        {/* History List */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit max-h-[600px] overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('comp_history')}</h2>
          
          {complaints.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No complaints registered yet.</p>
          ) : (
            <div className="space-y-4">
              {complaints.map(comp => (
                <div key={comp.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800">{comp.traderName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${comp.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {comp.status === 'Pending' ? <Clock className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                      {comp.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{comp.issue}</p>
                  <p className="text-xs text-gray-400 text-right">{comp.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintsPage;
