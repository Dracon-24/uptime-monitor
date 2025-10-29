import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">UM</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Uptime Monitor</h1>
          </div>
          <div className="flex items-center gap-4">
            <Authenticated>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Monitoring</span>
              </div>
            </Authenticated>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Authenticated>
        <Dashboard />
      </Authenticated>
      
      <Unauthenticated>
        <div className="max-w-md mx-auto text-center space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Monitor Your Services
            </h2>
            <p className="text-lg text-gray-600">
              Track uptime, response times, and get real-time alerts for your websites and APIs.
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}

function Dashboard() {
  const monitors = useQuery(api.monitors.getUserMonitors) || [];
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">
            {monitors.length} monitor{monitors.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Add Monitor
          </button>
        </div>
      </div>

      {/* Add Monitor Form */}
      {showAddForm && (
        <AddMonitorForm onClose={() => setShowAddForm(false)} />
      )}

      {/* Overview Stats */}
      <OverviewStats monitors={monitors} />

      {/* Monitors Grid */}
      {monitors.length === 0 ? (
        <EmptyState onAddMonitor={() => setShowAddForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor._id} monitor={monitor} />
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewStats({ monitors }: { monitors: any[] }) {
  const totalMonitors = monitors.length;
  const upMonitors = monitors.filter(m => m.stats.lastStatus === 'UP').length;
  const avgUptime = totalMonitors > 0 
    ? monitors.reduce((sum, m) => sum + m.stats.uptimePercentage, 0) / totalMonitors 
    : 0;
  const avgResponseTime = totalMonitors > 0
    ? monitors.reduce((sum, m) => sum + (m.stats.avgResponseTime || 0), 0) / totalMonitors
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Monitors</p>
            <p className="text-2xl font-bold text-gray-900">{totalMonitors}</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-lg">📊</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Online</p>
            <p className="text-2xl font-bold text-green-600">{upMonitors}</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 text-lg">✅</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Uptime</p>
            <p className="text-2xl font-bold text-gray-900">{avgUptime.toFixed(1)}%</p>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 text-lg">📈</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Response</p>
            <p className="text-2xl font-bold text-gray-900">{Math.round(avgResponseTime)}ms</p>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <span className="text-orange-600 text-lg">⚡</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonitorCard({ monitor }: { monitor: any }) {
  const deleteMonitor = useMutation(api.monitors.deleteMonitor);
  const toggleMonitor = useMutation(api.monitors.toggleMonitor);
  const triggerInstantCheck = useMutation(api.monitors.triggerInstantCheck);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${monitor.name}"?`)) {
      try {
        await deleteMonitor({ monitorId: monitor._id });
        toast.success('Monitor deleted successfully');
      } catch (error) {
        toast.error('Failed to delete monitor');
      }
    }
  };

  const handleToggle = async () => {
    try {
      await toggleMonitor({ monitorId: monitor._id });
      toast.success(`Monitor ${monitor.isActive ? 'paused' : 'resumed'}`);
    } catch (error) {
      toast.error('Failed to toggle monitor');
    }
  };

  const handleRefresh = async () => {
    try {
      await triggerInstantCheck({ monitorId: monitor._id });
      toast.success('Check triggered successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to trigger check');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP': return 'text-green-600 bg-green-100';
      case 'DOWN':
      case 'ERROR': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UP': return '🟢';
      case 'DOWN':
      case 'ERROR': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{monitor.name}</h3>
          <p className="text-sm text-gray-500 truncate">{monitor.url}</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {monitor.isActive && (
            <button
              onClick={handleRefresh}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              title="Trigger instant check"
            >
              ↻
            </button>
          )}
          <button
            onClick={handleToggle}
            className={`px-2 py-1 text-xs rounded ${
              monitor.isActive 
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {monitor.isActive ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleDelete}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        <span className="text-lg">{getStatusIcon(monitor.stats.lastStatus)}</span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(monitor.stats.lastStatus)}`}>
          {monitor.stats.lastStatus === 'ERROR' ? 'DOWN' : monitor.stats.lastStatus}
        </span>
        {!monitor.isActive && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            PAUSED
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Uptime</p>
          <p className="font-semibold">{monitor.stats.uptimePercentage.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-500">Response Time</p>
          <p className="font-semibold">
            {monitor.stats.lastResponseTime ? `${monitor.stats.lastResponseTime}ms` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Total Checks</p>
          <p className="font-semibold">{monitor.stats.totalChecks}</p>
        </div>
        <div>
          <p className="text-gray-500">Last Check</p>
          <p className="font-semibold">
            {monitor.stats.lastCheckTime 
              ? new Date(monitor.stats.lastCheckTime).toLocaleTimeString()
              : 'Never'
            }
          </p>
        </div>
      </div>

      {/* Recent Checks */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Recent Checks</p>
        <div className="flex gap-1">
          {monitor.recentChecks.slice(0, 10).map((check: any, index: number) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-sm ${
                check.status === 'UP' ? 'bg-green-400' : 'bg-red-400'
              }`}
              title={`${check.status} - ${new Date(check.timestamp).toLocaleString()}`}
            />
          ))}
          {monitor.recentChecks.length === 0 && (
            <span className="text-xs text-gray-400">No checks yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AddMonitorForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addMonitor = useMutation(api.monitors.addMonitor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      await addMonitor({ name: name.trim(), url: url.trim() });
      toast.success('Monitor added successfully');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add monitor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add New Monitor</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monitor Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Website"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL to Monitor
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !url.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Monitor'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function EmptyState({ onAddMonitor }: { onAddMonitor: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📊</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No monitors yet</h3>
      <p className="text-gray-600 mb-6">
        Start monitoring your websites and APIs by adding your first monitor.
      </p>
      <button
        onClick={onAddMonitor}
        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        Add Your First Monitor
      </button>
    </div>
  );
}
