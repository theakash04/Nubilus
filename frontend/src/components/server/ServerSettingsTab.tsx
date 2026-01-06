import { Card } from "@/components/ui/Card";
import {
  Settings,
  Bell,
  Cpu,
  Activity,
  HardDrive,
  Clock,
  Loader2,
  Save,
} from "lucide-react";

interface SettingsFormState {
  alerts_enabled: boolean;
  cpu_threshold: string;
  memory_threshold: string;
  disk_threshold: string;
  load_threshold: string;
  alert_cooldown_minutes: string;
}

interface ServerSettingsTabProps {
  settingsForm: SettingsFormState;
  settingsLoading: boolean;
  hasActualChanges: boolean;
  isSaving: boolean;
  onSettingsChange: (field: string, value: string | boolean) => void;
  onSaveSettings: () => void;
}

export function ServerSettingsTab({
  settingsForm,
  settingsLoading,
  hasActualChanges,
  isSaving,
  onSettingsChange,
  onSaveSettings,
}: ServerSettingsTabProps) {
  return (
    <section>
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2 text-primary" />
        Alert Settings
      </h2>

      {settingsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="p-6">
          <div className="space-y-6">
            {/* Alerts Enabled Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground flex items-center">
                  <Bell className="h-4 w-4 mr-2 text-primary" />
                  Alerts Enabled
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable or disable all alerts for this server
                </p>
              </div>
              <button
                onClick={() =>
                  onSettingsChange(
                    "alerts_enabled",
                    !settingsForm.alerts_enabled
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settingsForm.alerts_enabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settingsForm.alerts_enabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <hr className="border-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Cpu className="h-4 w-4 inline mr-2 text-primary" />
                  CPU Threshold (%)
                </label>
                <input
                  type="tel"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settingsForm.cpu_threshold}
                  onChange={(e) =>
                    onSettingsChange("cpu_threshold", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when CPU usage exceeds this value
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Activity className="h-4 w-4 inline mr-2 text-blue-500" />
                  Memory Threshold (%)
                </label>
                <input
                  type="tel"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settingsForm.memory_threshold}
                  onChange={(e) =>
                    onSettingsChange("memory_threshold", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when memory usage exceeds this value
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <HardDrive className="h-4 w-4 inline mr-2 text-emerald-500" />
                  Disk Threshold (%)
                </label>
                <input
                  type="tel"
                  min="0"
                  max="100"
                  value={settingsForm.disk_threshold}
                  onChange={(e) =>
                    onSettingsChange("disk_threshold", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when disk usage exceeds this value
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Activity className="h-4 w-4 inline mr-2 text-orange-500" />
                  Load Threshold
                </label>
                <input
                  type="tel"
                  min="0"
                  step="0.1"
                  value={settingsForm.load_threshold}
                  onChange={(e) =>
                    onSettingsChange("load_threshold", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when system load exceeds this value
                </p>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Clock className="h-4 w-4 inline mr-2 text-muted-foreground" />
                Alert Cooldown (minutes)
              </label>
              <input
                type="tel"
                min="1"
                max="1440"
                value={settingsForm.alert_cooldown_minutes}
                onChange={(e) =>
                  onSettingsChange("alert_cooldown_minutes", e.target.value)
                }
                className="w-full max-w-xs px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum time between repeated alerts for the same issue
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={onSaveSettings}
                disabled={!hasActualChanges || isSaving}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </button>
              {hasActualChanges && (
                <span className="ml-3 text-xs text-muted-foreground">
                  You have unsaved changes
                </span>
              )}
            </div>
          </div>
        </Card>
      )}
    </section>
  );
}
