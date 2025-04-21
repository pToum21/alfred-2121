'use client';

import React, { useState } from 'react';
import { ComparableProperty } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Card } from './ui/card';
import { Bath, BedDouble, Home, Maximize, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { cn } from '@/lib/utils';

interface PropertyCompsProps {
  comps: ComparableProperty[];
}

export function PropertyComps({ comps }: PropertyCompsProps) {
  const [selectedComp, setSelectedComp] = useState<ComparableProperty | null>(null);
  const [isMapView, setIsMapView] = useState(false);

  if (!comps || comps.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'For Rent':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'For Sale':
        return 'bg-green-500 hover:bg-green-600';
      case 'Off Market':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'Pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Sold':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="w-full mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Comparable Units ({comps.length})</h3>
        <div className="flex gap-2">
          <Button 
            variant={isMapView ? "outline" : "default"} 
            size="sm" 
            className="text-xs"
            onClick={() => setIsMapView(false)}
          >
            Grid
          </Button>
          <Button 
            variant={isMapView ? "default" : "outline"} 
            size="sm" 
            className="text-xs"
            onClick={() => setIsMapView(true)}
          >
            Map
          </Button>
        </div>
      </div>

      {isMapView ? (
        <Card className="p-4 relative h-[300px] w-full">
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-pulse text-2xl">🗺️</div>
              <p className="text-sm text-muted-foreground">Interactive Map View</p>
              <p className="text-xs text-muted-foreground/70">Units would be plotted on a map with color-coded markers</p>
            </div>
          </div>
        </Card>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4">
            <AnimatePresence>
              {comps.map((comp, index) => (
                <motion.div
                  key={`${comp.unitNumber || ''}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-[180px] shrink-0"
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <Card
                        className="overflow-hidden h-full cursor-pointer hover:shadow-md transition-all"
                        onClick={() => setSelectedComp(comp)}
                      >
                        <div className="relative h-28">
                          <div className="absolute top-0 right-0 z-10 p-1">
                            <Badge
                              className={cn(
                                "text-[10px] text-white",
                                getStatusColor(comp.status)
                              )}
                            >
                              {comp.status}
                            </Badge>
                          </div>
                          {comp.imageUrl ? (
                            <Image
                              src={comp.imageUrl}
                              alt={`Unit ${comp.unitNumber || ''}`}
                              fill
                              className="object-cover"
                              sizes="180px"
                              onError={(e) => {
                                // If image fails to load, replace with a static fallback
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite error loop
                                target.src = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                              <Home className="w-6 h-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-2 space-y-1">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium truncate">{comp.address.split(' ').slice(0, 3).join(' ')}</span>
                            {comp.unitNumber && (
                              <span className="text-[10px] text-muted-foreground">Unit {comp.unitNumber}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                            {comp.sqft && (
                              <div className="flex items-center gap-0.5">
                                <Maximize className="w-3 h-3" />
                                <span>{comp.sqft} sqft</span>
                              </div>
                            )}
                            
                            {comp.baths && (
                              <div className="flex items-center gap-0.5 ml-1">
                                <Bath className="w-3 h-3" />
                                <span>{comp.baths} ba</span>
                              </div>
                            )}
                          </div>
                          
                          {comp.price && comp.price !== "$--" && (
                            <div className="flex items-center text-xs font-medium mt-1">
                              <DollarSign className="w-3 h-3 text-green-600" />
                              <span>{comp.price}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    </DialogTrigger>
                    
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{comp.address}</DialogTitle>
                        {comp.unitNumber && (
                          <p className="text-sm text-muted-foreground">Unit {comp.unitNumber}</p>
                        )}
                      </DialogHeader>
                      
                      <div className="space-y-4 pt-2">
                        <div className="relative aspect-video overflow-hidden rounded-md border">
                          {comp.imageUrl ? (
                            <Image
                              src={comp.imageUrl}
                              alt={`Unit ${comp.unitNumber || ''}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                // If image fails to load, replace with a static fallback
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite error loop
                                target.src = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                              <Home className="w-12 h-12 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge
                              className={cn(
                                "text-xs text-white",
                                getStatusColor(comp.status)
                              )}
                            >
                              {comp.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Size</p>
                              <p className="text-sm font-medium">{comp.sqft || 'N/A'} sqft</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Price</p>
                              <p className="text-sm font-medium">{comp.price || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Beds</p>
                              <p className="text-sm font-medium">{comp.beds || 'Studio'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Baths</p>
                              <p className="text-sm font-medium">{comp.baths || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Price per sqft</p>
                              <p className="text-sm font-medium">
                                {comp.price && comp.sqft ? 
                                  `$${(parseInt(comp.price.toString().replace(/\$|,/g, '')) / parseInt(comp.sqft.toString())).toFixed(2)}/sqft` : 
                                  'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <p className="text-sm font-medium">{comp.status}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
} 