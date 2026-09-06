import { Check, Crown, Radar, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FEATURES = [
  {
    icon: Radar,
    title: "Extended radar history",
    detail: "Review longer precipitation timelines.",
  },
  {
    icon: Zap,
    title: "Priority weather alerts",
    detail: "More configurable severe-condition notices.",
  },
  {
    icon: Sparkles,
    title: "Advanced activity planning",
    detail: "Plan outdoor windows across multiple days.",
  },
  {
    icon: Crown,
    title: "Unlimited saved places",
    detail: "Keep every location important to you close by.",
  },
] as const;

export function ProSubscriptionModal() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual" | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("aura:pro-plan");
    if (stored === "monthly" || stored === "annual") setSelectedPlan(stored);
  }, []);

  function choosePlan() {
    window.localStorage.setItem("aura:pro-plan", billing);
    setSelectedPlan(billing);
    toast.success(`Aura Pro ${billing} plan selected`, {
      description: "Your preference is saved on this device. No payment has been collected.",
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-full bg-gold text-ink shadow-lg shadow-gold/10 hover:bg-gold/90"
        >
          <Crown className="h-4 w-4" />
          <span className="hidden sm:inline">Pro</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto border-border sm:max-w-2xl sm:rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="rounded-full bg-gold text-ink hover:bg-gold">Aura Pro</Badge>
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Premium weather intelligence
            </span>
          </div>
          <DialogTitle className="pt-3 font-display text-3xl font-medium">
            More foresight, fewer surprises
          </DialogTitle>
          <DialogDescription className="text-base leading-7 text-foreground/75">
            Advanced planning tools for people who rely on the weather every day.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={billing}
          onValueChange={(value) => setBilling(value as "monthly" | "annual")}
          className="mt-2"
        >
          <TabsList className="glass h-auto rounded-full p-1">
            <TabsTrigger className="rounded-full" value="monthly">
              Monthly
            </TabsTrigger>
            <TabsTrigger className="rounded-full" value="annual">
              Annual · save 33%
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-2 flex items-end gap-2">
          <p className="font-display text-5xl">{billing === "annual" ? "$3.33" : "$4.99"}</p>
          <p className="pb-1 text-sm text-muted-foreground">per month</p>
        </div>
        {billing === "annual" && (
          <p className="text-xs text-muted-foreground">Displayed as an equivalent monthly price.</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-cream/[0.04] p-4"
              >
                <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                <p className="mt-3 flex items-center gap-2 font-semibold">
                  <Check className="h-4 w-4 text-aqi-good" /> {feature.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{feature.detail}</p>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-2 sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedPlan === billing
              ? "This plan is selected on this device. No payment has been collected."
              : billing === "annual"
                ? "$39.99 annual plan · selection does not activate billing."
                : "$4.99 monthly plan · selection does not activate billing."}
          </p>
          <Button className="rounded-full" onClick={choosePlan}>
            {selectedPlan === billing ? "Plan selected" : "Choose this plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
