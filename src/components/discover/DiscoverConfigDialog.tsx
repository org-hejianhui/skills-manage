import { useState } from "react";
import { Radar, Loader2, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action";
import { useDiscoverStore } from "@/stores/discoverStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePlatformStore } from "@/stores/platformStore";
import { ScanRoot } from "@/types";
import { describeSkillsPattern } from "@/lib/path";
import { isEnabledInstallTargetAgent } from "@/lib/agents";

const OBSIDIAN_VAULT_PATTERNS = [
  ".skills/<skill>/SKILL.md",
  ".agents/skills/<skill>/SKILL.md",
  ".claude/skills/<skill>/SKILL.md",
];

// ─── DiscoverConfigDialog ────────────────────────────────────────────────────

interface DiscoverConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscoverConfigDialog({ open, onOpenChange }: DiscoverConfigDialogProps) {
  const { t } = useTranslation();

  const scanRoots = useDiscoverStore((s) => s.scanRoots);
  const isLoadingRoots = useDiscoverStore((s) => s.isLoadingRoots);
  const loadScanRoots = useDiscoverStore((s) => s.loadScanRoots);
  const setScanRootEnabled = useDiscoverStore((s) => s.setScanRootEnabled);
  const startScan = useDiscoverStore((s) => s.startScan);
  const removeProjectsByPath = useDiscoverStore((s) => s.removeProjectsByPath);

  const addScanDirectory = useSettingsStore((s) => s.addScanDirectory);
  const removeScanDirectory = useSettingsStore((s) => s.removeScanDirectory);

  const agents = usePlatformStore((s) => s.agents);

  const [isAdding, setIsAdding] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [removingPath, setRemovingPath] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      loadScanRoots();
      setIsAdding(false);
      setNewPath("");
      setAddError(null);
      setRemovingPath(null);
    }
    onOpenChange(open);
  };

  const platformPatterns = agents
    .filter(isEnabledInstallTargetAgent)
    .map((a) => ({
      name: a.display_name,
      pattern: describeSkillsPattern(a.global_skills_dir),
    }));

  const enabledCount = scanRoots.filter((r) => r.enabled && r.exists).length;

  const customRoots = scanRoots.filter((r) => r.is_custom);
  const defaultRoots = scanRoots.filter((r) => !r.is_custom);

  function handleStartScan() {
    onOpenChange(false);
    startScan();
  }

  async function handleAddDirectory() {
    const trimmed = newPath.trim();
    if (!trimmed) {
      setAddError(t("discover.addDirPathRequired"));
      return;
    }
    setAddError(null);
    try {
      await addScanDirectory(trimmed);
      await loadScanRoots();
      setNewPath("");
      setIsAdding(false);
      toast.success(t("discover.addDirSuccess"));
    } catch (err) {
      setAddError(String(err));
      toast.error(String(err));
    }
  }

  async function handleRemoveDirectory(path: string) {
    setRemovingPath(path);
    try {
      await removeScanDirectory(path);
      removeProjectsByPath(path);
      await loadScanRoots();
      toast.success(t("common.delete") + " ✓");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setRemovingPath(null);
    }
  }

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !isAdding) {
      handleAddDirectory();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radar className="size-5" />
            {t("discover.title")}
          </DialogTitle>
          <DialogDescription>{t("discover.desc")}</DialogDescription>
        </DialogHeader>

        <div
          data-slot="dialog-body"
          className="min-w-0 max-h-none space-y-4 overflow-visible px-0 py-2"
        >
          {/* Scan Roots */}
          <div className="min-w-0 overflow-x-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">{t("discover.scanRoots")}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                disabled={isAdding}
              >
                <Plus className="size-3.5" />
                <span>{t("discover.addDirectory")}</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {t("discover.scanRootsDesc")}
            </p>

            {isLoadingRoots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="size-4 animate-spin" />
                <span>{t("common.loading")}</span>
              </div>
            ) : scanRoots.length === 0 && !isAdding ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                {t("discover.noCandidateDirs")}
              </p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto overflow-x-hidden">
                {/* Custom directories first */}
                {customRoots.length > 0 && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    {customRoots.map((root) => (
                      <ScanRootRow
                        key={root.path}
                        root={root}
                        onToggle={(enabled) =>
                          setScanRootEnabled(root.path, enabled)
                        }
                        onRemove={() => handleRemoveDirectory(root.path)}
                        isRemoving={removingPath === root.path}
                      />
                    ))}
                  </div>
                )}

                {/* Add directory input */}
                {isAdding && (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2">
                    <Input
                      placeholder={t("discover.addDirPlaceholder")}
                      value={newPath}
                      onChange={(e) => {
                        setNewPath(e.target.value);
                        if (addError) setAddError(null);
                      }}
                      onKeyDown={handleAddKeyDown}
                      className="h-7 text-xs font-mono"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleAddDirectory} className="shrink-0 h-7">
                      {t("common.add")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAdding(false);
                        setNewPath("");
                        setAddError(null);
                      }}
                      className="shrink-0 h-7"
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                )}
                {addError && (
                  <p className="text-xs text-destructive px-1">{addError}</p>
                )}

                {/* Default directories */}
                {defaultRoots.length > 0 && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    {defaultRoots.map((root) => (
                      <ScanRootRow
                        key={root.path}
                        root={root}
                        onToggle={(enabled) =>
                          setScanRootEnabled(root.path, enabled)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Platform Patterns */}
          <div className="min-w-0 overflow-x-hidden">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">
              {t("discover.lookingFor")}
            </h3>
            <div className="flex min-w-0 max-w-full flex-wrap gap-1.5 overflow-x-hidden">
              {platformPatterns.slice(0, 6).map((p) => (
                <span
                  key={p.name}
                  title={p.pattern}
                  className="min-w-0 max-w-full break-all whitespace-normal text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                >
                  {p.pattern}
                </span>
              ))}
              {platformPatterns.length > 6 && (
                <span className="min-w-0 max-w-full break-all whitespace-normal text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  +{platformPatterns.length - 6}
                </span>
              )}
            </div>
            <div className="mt-2 min-w-0 overflow-x-hidden rounded-md bg-muted/40 px-2.5 py-2">
              <p className="text-xs font-medium text-foreground">
                {t("discover.obsidianPatternsTitle")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("discover.obsidianPatternsDesc")}
              </p>
              <div className="flex min-w-0 max-w-full flex-wrap gap-1.5 overflow-x-hidden mt-1.5">
                {OBSIDIAN_VAULT_PATTERNS.map((pattern) => (
                  <span
                    key={pattern}
                    title={pattern}
                    className="min-w-0 max-w-full break-all whitespace-normal text-xs px-2 py-0.5 rounded bg-background/70 text-muted-foreground font-mono ring-1 ring-border/60"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Warning if no roots enabled */}
          {enabledCount === 0 && !isLoadingRoots && (
            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-md p-2.5">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{t("discover.noRootsEnabled")}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleStartScan}
            disabled={enabledCount === 0}
          >
            <Radar className="size-4 mr-1" />
            {t("discover.startScan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ScanRootRow ──────────────────────────────────────────────────────────────

function ScanRootRow({
  root,
  onToggle,
  onRemove,
  isRemoving,
}: {
  root: ScanRoot;
  onToggle: (enabled: boolean) => void;
  onRemove?: () => void;
  isRemoving?: boolean;
}) {
  return (
    <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden px-3 py-2 border-b border-border/50 last:border-0 hover:bg-hover-bg/20">
      <Checkbox
        checked={root.enabled}
        onCheckedChange={(checked) => onToggle(!!checked)}
        disabled={!root.exists}
        aria-label={root.path}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <span
          title={root.path}
          className={`block truncate text-sm font-mono ${!root.exists ? "text-muted-foreground line-through" : ""}`}
        >
          {root.path}
        </span>
      </div>
      <span
        title={root.label}
        className="shrink-0 max-w-[30%] truncate text-right text-xs text-muted-foreground"
      >
        {root.label}
      </span>
      {root.is_custom && onRemove && (
        <InlineConfirmAction
          onConfirm={onRemove}
          isLoading={isRemoving ?? false}
          idleAriaLabel={`Remove ${root.path}`}
          idleTitle={`Remove ${root.path}`}
          confirmLabel={""}
          icon={<Trash2 className="size-3.5" />}
        />
      )}
    </div>
  );
}
