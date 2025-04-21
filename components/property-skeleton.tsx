import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PropertySkeleton() {
  // Create an array for multiple loading placeholders
  const skeletonCount = 4; // Number of property cards to show
  
  return (
    <div className="space-y-4">
      {/* Skeleton for property cards */}
      <ScrollArea className="w-full pb-4" scrollHideDelay={0}>
        <div className="flex gap-3 pb-2 w-max">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={index} className="block w-[200px] shrink-0">
              <div className="relative h-full rounded-lg bg-background/50 overflow-hidden border border-border/5">
                {/* Property Image Skeleton */}
                <Skeleton className="h-24 w-full" />
                
                <div className="p-3">
                  {/* Property Type Badge Skeleton */}
                  <div className="mb-2">
                    <Skeleton className="h-5 w-20" />
                  </div>
                  
                  {/* Property Address Skeleton */}
                  <Skeleton className="h-4 w-full mb-2" />
                  
                  {/* Property Location Skeleton */}
                  <Skeleton className="h-3 w-3/4 mb-3" />
                  
                  {/* Property Features Skeleton */}
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Skeleton for selected property detail */}
      <div className="p-4 border rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Gallery Skeleton */}
          <div className="space-y-2">
            <Skeleton className="aspect-video w-full rounded-md" />
            
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="w-16 h-12 shrink-0 rounded" />
              ))}
            </div>
          </div>
          
          {/* Property Details Skeleton */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
              
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-6 w-full mb-4" />
              
              <div className="flex flex-wrap gap-4 mb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <Skeleton className="h-8 w-32 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 