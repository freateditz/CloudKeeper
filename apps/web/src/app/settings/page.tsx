"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    telegramWebhook: "",
    discordWebhook: "",
    emailNotification: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get("/settings");
        setSettings(res.data.settings);
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.patch("/settings", settings);
      toast({ title: "Settings saved successfully" });
    } catch (error) {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif">Email Notifications</Label>
              <Switch 
                id="email-notif" 
                checked={settings.emailNotification}
                onCheckedChange={(checked) => setSettings({...settings, emailNotification: checked})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram Webhook URL</Label>
              <Input 
                id="telegram" 
                value={settings.telegramWebhook || ""}
                onChange={(e) => setSettings({...settings, telegramWebhook: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discord">Discord Webhook URL</Label>
              <Input 
                id="discord" 
                value={settings.discordWebhook || ""}
                onChange={(e) => setSettings({...settings, discordWebhook: e.target.value})}
              />
            </div>
            <Button onClick={saveSettings} loading={saving}>Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
