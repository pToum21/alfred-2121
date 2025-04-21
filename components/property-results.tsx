'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Building, Home, MapPin, DollarSign, Calendar, Maximize, BedDouble, Bath, Award } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { PropertySearchResult, PropertyType } from '@/lib/types'
import { PropertyComps } from './property-comps'

export interface PropertyResultsProps {
  properties: PropertySearchResult[];
}

// Format price to locale string
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price);
};

// Format date relative to now
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  try {
    const parsedDate = parseISO(dateString);
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
};

// Get icon for property type
const getPropertyTypeIcon = (type: PropertyType) => {
  switch (type) {
    case 'residential':
      return <Home className="w-4 h-4" />;
    case 'commercial':
    case 'industrial':
      return <Building className="w-4 h-4" />;
    case 'land':
      return <MapPin className="w-4 h-4" />;
    default:
      return <Building className="w-4 h-4" />;
  }
};

export default function PropertyResults({ properties }: PropertyResultsProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertySearchResult | null>(
    properties.length > 0 ? properties[0] : null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (properties.length === 0) {
    return (
      <div className="text-xs text-muted-foreground/70 py-2">
        No properties found matching your criteria.
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Property List */}
      <ScrollArea className="w-full pb-4" scrollHideDelay={0}>
        <motion.div 
          className="flex gap-3 pb-2 items-stretch w-max"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {properties.map((property) => (
            <motion.div
              key={property.id}
              className={`block w-[200px] shrink-0 cursor-pointer ${selectedProperty?.id === property.id ? 'ring-2 ring-primary/50' : ''}`}
              variants={item}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              onClick={() => {
                setSelectedProperty(property);
                setActiveImageIndex(0);
              }}
            >
              <div className="relative h-full rounded-lg bg-background/50 hover:bg-background/80 transition-all duration-200 overflow-hidden border border-border/5 hover:border-border/20 hover:shadow-lg">
                {/* Property Image */}
                <div className="relative h-24 w-full overflow-hidden">
                  {property.imageUrls.length > 0 ? (
                    <Image
                      src={property.imageUrls[0]}
                      alt={property.address}
                      fill
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjExOSIgdmlld0JveD0iMCAwIDEyMCAxMTkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTE5IiBmaWxsPSIjRThFQUVDIi8+Cjwvc3ZnPgo="
                      onError={(e) => {
                        // If image fails to load, replace with a static fallback
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite error loop
                        target.src = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                      {getPropertyTypeIcon(property.propertyType)}
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-white/90" />
                      <span className="text-white font-medium text-xs">{formatPrice(property.price)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary">
                      {getPropertyTypeIcon(property.propertyType)}
                      <span className="text-[10px] font-medium capitalize">{property.propertyType}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xs font-medium text-primary/90 truncate mb-1">
                    {property.address}
                  </h3>
                  
                  <p className="text-[10px] text-muted-foreground mb-2 truncate">
                    {property.city}, {property.state} {property.zipCode}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 text-[9px] text-muted-foreground/70">
                    {property.bedrooms && (
                      <div className="flex items-center gap-0.5">
                        <BedDouble className="w-2.5 h-2.5" />
                        <span>{property.bedrooms} bd</span>
                      </div>
                    )}
                    
                    {property.bathrooms && (
                      <div className="flex items-center gap-0.5">
                        <Bath className="w-2.5 h-2.5" />
                        <span>{property.bathrooms} ba</span>
                      </div>
                    )}
                    
                    {property.squareFeet && (
                      <div className="flex items-center gap-0.5">
                        <Maximize className="w-2.5 h-2.5" />
                        <span>{property.squareFeet.toLocaleString()} sqft</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      {/* Selected Property Detail */}
      {selectedProperty && (
        <motion.div 
          className="p-4 border rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          key={selectedProperty.id}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Gallery */}
            <div className="space-y-2">
              <div className="relative aspect-video overflow-hidden rounded-md border">
                {selectedProperty.imageUrls.length > 0 ? (
                  <Image
                    src={selectedProperty.imageUrls[activeImageIndex]}
                    alt={selectedProperty.address}
                    fill
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjExOSIgdmlld0JveD0iMCAwIDEyMCAxMTkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTE5IiBmaWxsPSIjRThFQUVDIi8+Cjwvc3ZnPgo="
                    onError={(e) => {
                      // If image fails to load, replace with a static fallback
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite error loop
                      target.src = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                    {getPropertyTypeIcon(selectedProperty.propertyType)}
                  </div>
                )}
              </div>
              
              {selectedProperty.imageUrls.length > 1 && (
                <ScrollArea className="w-full">
                  <div className="flex gap-2">
                    {selectedProperty.imageUrls.map((url, index) => (
                      <div 
                        key={index}
                        className={`relative w-16 h-12 shrink-0 cursor-pointer rounded overflow-hidden border-2 ${activeImageIndex === index ? 'border-primary' : 'border-transparent'}`}
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <Image
                          src={url}
                          alt={`${selectedProperty.address} image ${index + 1}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            // If image fails to load, replace with a static fallback
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite error loop
                            target.src = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop`;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </div>
            
            {/* Property Details */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary">
                    {getPropertyTypeIcon(selectedProperty.propertyType)}
                    <span className="text-xs font-medium capitalize">{selectedProperty.propertyType}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Listed {formatDate(selectedProperty.listingDate)}</span>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold mb-1">{formatPrice(selectedProperty.price)}</h2>
                
                <div className="flex items-center gap-1 text-sm mb-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}</span>
                </div>
                
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  {selectedProperty.bedrooms && (
                    <div className="flex items-center gap-1">
                      <BedDouble className="w-4 h-4 text-muted-foreground" />
                      <span><strong>{selectedProperty.bedrooms}</strong> Bedrooms</span>
                    </div>
                  )}
                  
                  {selectedProperty.bathrooms && (
                    <div className="flex items-center gap-1">
                      <Bath className="w-4 h-4 text-muted-foreground" />
                      <span><strong>{selectedProperty.bathrooms}</strong> Bathrooms</span>
                    </div>
                  )}
                  
                  {selectedProperty.squareFeet && (
                    <div className="flex items-center gap-1">
                      <Maximize className="w-4 h-4 text-muted-foreground" />
                      <span><strong>{selectedProperty.squareFeet.toLocaleString()}</strong> sq ft</span>
                    </div>
                  )}
                  
                  {selectedProperty.yearBuilt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Built <strong>{selectedProperty.yearBuilt}</strong></span>
                    </div>
                  )}
                </div>
              </div>
              
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="text-sm mt-2">
                  <p>{selectedProperty.description}</p>
                </TabsContent>
                <TabsContent value="features" className="mt-2">
                  <ul className="grid grid-cols-2 gap-2">
                    {selectedProperty.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs">
                        <Award className="w-3 h-3 text-primary/70" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
              
              {/* Add comps section if available */}
              {selectedProperty.comps && selectedProperty.comps.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <PropertyComps comps={selectedProperty.comps} />
                </div>
              )}
              
              <Button 
                className="w-full"
                onClick={() => window.open("https://foundationspecialtyfinance.com/contact-us", "_blank")}
              >
                Contact Agent
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 