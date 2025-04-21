import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { getCookie } from 'cookies-next';
import { Plus, Trash2, Brain, Settings2, Info, MessageSquareText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Preference {
  preference_key: string;
  preference_value: string;
}

export function UserPreferencesManager() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [newPreference, setNewPreference] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${getCookie('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || []);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to fetch preferences');
    }
  };

  const addPreference = async () => {
    if (!newPreference.trim()) return;
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('token')}`
        },
        body: JSON.stringify({ 
          preference_key: 'general',
          preference_value: newPreference 
        }),
      });
      if (response.ok) {
        setPreferences([...preferences, { 
          preference_key: 'general', 
          preference_value: newPreference 
        }]);
        setNewPreference('');
        toast.success('Preference added successfully');
      }
    } catch (error) {
      console.error('Error adding preference:', error);
      toast.error('Failed to add preference');
    }
  };

  const deletePreference = async (preferenceValue: string) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('token')}`
        },
        body: JSON.stringify({ preference: preferenceValue }),
      });
      if (response.ok) {
        setPreferences(preferences.filter(pref => pref.preference_value !== preferenceValue));
        toast.success('Preference deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting preference:', error);
      toast.error('Failed to delete preference');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-medium">How Preferences Work</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ALFReD learns from your preferences to provide more personalized responses. 
          Add preferences about your expertise, communication style, or specific requirements. 
          These will be remembered across all conversations.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={newPreference}
              onChange={(e) => setNewPreference(e.target.value)}
              placeholder="E.g., 'I prefer technical explanations' or 'I'm a data scientist'"
              className="pr-8 bg-background"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 absolute right-2 top-2.5 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Add preferences about your background, expertise, or how you'd like ALFReD to communicate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button 
            onClick={addPreference} 
            className="gap-1.5"
            disabled={!newPreference.trim()}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {preferences.map((pref, index) => (
            <Card key={index} className="bg-muted/30 border-border/50">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-primary/70" />
                  <span className="text-sm">{pref.preference_value}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePreference(pref.preference_value)}
                  className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          
          {preferences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Settings2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No preferences set yet. Add some to help ALFReD understand you better.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}