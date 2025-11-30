import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { X, Mail, Clock, Info, BarChart3 } from 'lucide-react';
import { getUserProfile, createOrUpdateUserProfile } from '../utils/userPreferences';
import { track } from '../../lib/mixpanelClient';

interface EmailNotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function EmailNotificationPreferencesModal({
  isOpen,
  onClose,
  user,
}: EmailNotificationPreferencesModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Email notification preferences (default to false until loaded)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [practiceReminderEnabled, setPracticeReminderEnabled] = useState(false);
  const [weeklyStatsEnabled, setWeeklyStatsEnabled] = useState(false);

  // Load current preferences
  useEffect(() => {
    if (isOpen && user) {
      loadPreferences();
    }
  }, [isOpen, user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile(user.uid);

      if (profile) {
        // Show actual state - undefined means not enabled yet
        setEmailNotificationsEnabled(profile.emailNotificationsEnabled === true);
        setPracticeReminderEnabled(profile.practiceReminderEnabled === true);
        setWeeklyStatsEnabled(profile.weeklyStatsEnabled === true);
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await createOrUpdateUserProfile(user.uid, {
        emailNotificationsEnabled,
        practiceReminderEnabled,
        weeklyStatsEnabled,
      });

      track('Email Preferences Updated', {
        emailNotificationsEnabled,
        practiceReminderEnabled,
        weeklyStatsEnabled,
      });

      onClose();
    } catch (error) {
      console.error('Error saving email preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Email Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Stay consistent with your practice</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Get helpful reminders ~23 hours after your last practice. If you have an active streak, we&apos;ll remind you to keep it going!
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Email Reminders</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive practice notifications via email
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotificationsEnabled}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setEmailNotificationsEnabled(enabled);
                        // When enabling master toggle, auto-enable sub-toggles
                        if (enabled) {
                          setPracticeReminderEnabled(true);
                          setWeeklyStatsEnabled(true);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-3" style={{ opacity: emailNotificationsEnabled ? 1 : 0.5 }}>
                {/* Daily Practice Reminder */}
                <div className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold">Daily Practice Reminder</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Get a smart reminder ~23 hours after your last practice session
                      </p>
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <span className="text-blue-600">•</span>
                          <span><strong>No streak?</strong> Gentle reminder to practice</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-orange-600">•</span>
                          <span><strong>Have a streak?</strong> We&apos;ll remind you to keep it alive</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-red-600">•</span>
                          <span><strong>Late at night?</strong> Urgent reminder to save your streak</span>
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={practiceReminderEnabled}
                        onChange={(e) => setPracticeReminderEnabled(e.target.checked)}
                        disabled={!emailNotificationsEnabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                    </label>
                  </div>
                </div>

                {/* Weekly Stats Summary */}
                <div className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        <h3 className="font-semibold">Weekly Stats Summary</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Every Sunday, get a summary of your progress for the week
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weeklyStatsEnabled}
                        onChange={(e) => setWeeklyStatsEnabled(e.target.checked)}
                        disabled={!emailNotificationsEnabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
                <p className="font-medium mb-1">Your privacy matters</p>
                <p>We respect your inbox. You&apos;ll typically receive one email per day. On Sundays, you may receive both your weekly stats and a practice reminder if needed.</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
