import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import IngestScreen from '../components/signal/IngestScreen';
import ReviewScreen from '../components/signal/ReviewScreen';
import HistoryScreen from '../components/signal/HistoryScreen';
import TasksScreen from '../components/signal/TasksScreen';
import SourceTranscriptModal from '../components/signal/SourceTranscriptModal';
import { MessageSquare, ShieldAlert, Sparkles, Inbox, CheckSquare, History } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function SignalHub() {
  const { hasApp } = useAuth();
  const [activeTab, setActiveTab] = useState('ingest');
  const [projects, setProjects] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [demoTranscripts, setDemoTranscripts] = useState([]);
  const [engineStatus, setEngineStatus] = useState(null);

  // Active conversation being reviewed
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeItems, setActiveItems] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Transcript Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHighlight, setModalHighlight] = useState(null);

  const fetchConversations = useCallback(async (q = '') => {
    setIsSearching(true);
    try {
      const url = q ? `/conversations?q=${encodeURIComponent(q)}` : '/conversations';
      const { data } = await client.get(url);
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const fetchTasks = async (projectId) => {
    try {
      const { data } = await client.get(`/projects/${projectId}/tasks`);
      setTasks(data || []);
    } catch (e) {
      console.error('Error reloading tasks:', e);
    }
  };

  const fetchInitialData = useCallback(async () => {
    try {
      // 1. Projects
      const { data: pData } = await client.get('/projects');
      setProjects(pData || []);

      const targetProjectId = pData?.[0]?.id;

      if (targetProjectId) {
        // 2. Stakeholders
        const { data: sData } = await client.get(`/projects/${targetProjectId}/stakeholders`);
        setStakeholders(sData || []);

        // 3. Tasks
        const { data: tData } = await client.get(`/projects/${targetProjectId}/tasks`);
        setTasks(tData || []);
      }

      // 4. Demo transcripts
      try {
        const { data: dData } = await client.get('/demo/transcripts');
        setDemoTranscripts(dData || []);
      } catch (e) {
        console.warn('Could not load demo transcripts', e);
      }

      // 5. Engine status
      try {
        const { data: stData } = await client.get('/demo/status');
        setEngineStatus(stData);
      } catch (e) {
        console.warn('Could not load engine status', e);
      }

      // 6. Conversations list
      fetchConversations();
    } catch (err) {
      console.error('Error fetching initial Signal data:', err);
    }
  }, [fetchConversations]);

  useEffect(() => {
    if (hasApp('nexus_signal')) {
      fetchInitialData();
    }
  }, [hasApp, fetchInitialData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchConversations]);

  // If user/org is not entitled to Signal
  if (!hasApp('nexus_signal')) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Card className="p-8 bg-zinc-900/60 border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Nexus Signal Not Enabled</h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto mb-6">
            Your organization is not currently subscribed to the Nexus Signal conversation intelligence module.
            Administrators can enable apps from the Organization Settings screen.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-App SaaS Entitlement Layer Enforced</span>
          </div>
        </Card>
      </div>
    );
  }

  // Load conversation for review
  const selectConversationForReview = async (conversationId) => {
    try {
      const { data } = await client.get(`/conversations/${conversationId}`);
      setActiveConversation(data.conversation);
      setActiveItems(data.items || []);
      setActiveTab('review');
    } catch (err) {
      console.error('Error loading conversation for review:', err);
    }
  };

  const handleExtractionComplete = (result) => {
    setActiveConversation(result.conversation);
    setActiveItems(result.items || []);
    setActiveTab('review');
    fetchConversations();
    if (projects[0]?.id) {
      fetchTasks(projects[0].id);
    }
  };

  const handleItemConfirmed = async (itemId) => {
    try {
      const { data: confirmedData } = await client.post(`/items/${itemId}/confirm`);
      setActiveItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, review_status: 'confirmed', resolved_task_id: confirmedData.item?.resolved_task_id }
          : item
      ));

      if (projects[0]?.id) fetchTasks(projects[0].id);
      fetchConversations();
    } catch (err) {
      console.error('Error confirming item:', err);
    }
  };

  const handleBatchConfirm = async (itemIds) => {
    try {
      const { data } = await client.post('/items/batch-confirm', { item_ids: itemIds });
      const confirmedMap = new Map((data.items || []).map(i => [i.id, i]));
      setActiveItems(prev => prev.map(item => {
        if (confirmedMap.has(item.id)) {
          const updated = confirmedMap.get(item.id);
          return {
            ...item,
            review_status: 'confirmed',
            resolved_task_id: updated.resolved_task_id
          };
        }
        return item;
      }));

      if (projects[0]?.id) fetchTasks(projects[0].id);
      fetchConversations();
    } catch (err) {
      console.error('Error batch confirming:', err);
    }
  };

  const handleItemRejected = async (itemId) => {
    try {
      await client.post(`/items/${itemId}/reject`);
      setActiveItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, review_status: 'rejected' } : item
      ));
      fetchConversations();
    } catch (err) {
      console.error('Error rejecting item:', err);
    }
  };

  const handleItemUpdated = async (itemId, patch) => {
    try {
      const { data: updated } = await client.patch(`/items/${itemId}`, patch);
      setActiveItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updated } : item
      ));
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleAssignNewStakeholder = async (itemId, stakeholderData) => {
    try {
      const { data } = await client.post(`/items/${itemId}/assign-new-stakeholder`, stakeholderData);

      setStakeholders(prev => {
        const exists = prev.some(s => s.id === data.stakeholder.id);
        return exists ? prev : [...prev, data.stakeholder];
      });

      setActiveItems(prev => prev.map(item =>
        item.id === itemId ? {
          ...item,
          ...data.item,
          assigned_to_stakeholder_id: data.stakeholder.id,
          assigned_to_resolved_name: data.stakeholder.name,
          stakeholder_role: data.stakeholder.role,
          validation_flags: data.item.validation_flags || []
        } : item
      ));

      return data;
    } catch (err) {
      console.error('Error assigning new stakeholder:', err);
      alert(err.response?.data?.error || err.message);
      throw err;
    }
  };

  const handleDeleteConversation = async (convId) => {
    if (!window.confirm('Delete this conversation and its extraction records?')) return;
    try {
      await client.delete(`/conversations/${convId}`);
      fetchConversations();
      if (activeConversation?.id === convId) {
        setActiveConversation(null);
        setActiveItems([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const pendingCount = activeItems.filter(i => i.review_status === 'pending_review').length;

  const tabs = [
    { id: 'ingest', label: 'Capture & Ingest', icon: Inbox },
    { id: 'review', label: 'Review Extracted', icon: Sparkles, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'memory', label: 'Conversation Memory', icon: History },
    { id: 'tasks', label: 'Extracted Tasks', icon: CheckSquare }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Nexus Signal
            </span>
            <span className="text-xs text-zinc-500 font-mono">App Module</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Communication Intelligence & Task Extraction
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Turn WhatsApp, email, and meeting threads into verified coordination tasks with 2-pass AI verification
          </p>
        </div>

        {engineStatus && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400 font-mono">{engineStatus.active_engine}</span>
          </div>
        )}
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800/80 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Screen Views */}
      <div className="pt-2">
        {activeTab === 'ingest' && (
          <IngestScreen 
            onExtractionComplete={handleExtractionComplete}
            demoTranscripts={demoTranscripts}
            projects={projects}
          />
        )}

        {activeTab === 'review' && (
          <ReviewScreen 
            conversation={activeConversation}
            items={activeItems}
            stakeholders={stakeholders}
            onItemConfirmed={handleItemConfirmed}
            onBatchConfirm={handleBatchConfirm}
            onItemRejected={handleItemRejected}
            onItemUpdated={handleItemUpdated}
            onAssignNewStakeholder={handleAssignNewStakeholder}
            onOpenSourceModal={(snippet) => {
              setModalHighlight(snippet);
              setModalOpen(true);
            }}
          />
        )}

        {activeTab === 'memory' && (
          <HistoryScreen 
            conversations={conversations}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectConversation={selectConversationForReview}
            onDeleteConversation={handleDeleteConversation}
            isLoading={isSearching}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksScreen 
            tasks={tasks}
            onSelectConversation={selectConversationForReview}
          />
        )}
      </div>

      {/* Source Transcript Drawer/Modal */}
      <SourceTranscriptModal 
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalHighlight(null);
        }}
        conversation={activeConversation}
        highlightSnippet={modalHighlight}
      />
    </div>
  );
}
