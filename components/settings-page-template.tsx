import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Settings2 } from "lucide-react";
import { UserPreferencesManager } from './user-preferences-manager';
import { Separator } from "@/components/ui/separator";

export default function SettingsPageTemplate() {
  return (
    <div className="container max-w-4xl mx-auto p-4 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground">Customize your ALFReD experience</p>
          </div>
        </div>
      </div>
      
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">User Preferences</CardTitle>
              <CardDescription className="text-sm">
                Personalize how ALFReD understands and interacts with you
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className="mb-6" />
        <CardContent>
          <UserPreferencesManager />
        </CardContent>
      </Card>
    </div>
  );
}