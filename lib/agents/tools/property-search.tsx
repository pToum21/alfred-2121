import { createStreamableValue } from 'ai/rsc';
import { z } from 'zod';
import { PropertySection } from '@/components/property-section';
import { propertySearchSchema } from '@/lib/schema/property-search';
import { mockProperties } from '@/lib/mock-property-data';
import { PropertySearchResult, PropertySearchResults, PropertyType } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Create a logging function for the property search
const logPropertySearch = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;
  
  console.log(formattedMessage);
  
  try {
    // Ensure the logs directory exists
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Append to the property search log file
    const logPath = path.join(logDir, 'propertysearch.logs');
    fs.appendFileSync(logPath, formattedMessage + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

// Helper function to filter properties based on search criteria
const filterProperties = (
  properties: PropertySearchResult[],
  query: {
    location?: string;
    propertyType?: PropertyType;
    priceRange?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    amenities?: string[];
    yearBuilt?: number;
    zoning?: string;
    buildingClass?: 'Class A' | 'Class B' | 'Class C';
    stories?: number;
    numberOfUnits?: number;
    percentOccupied?: number;
  },
  maxResults: number
): PropertySearchResult[] => {
  logPropertySearch('Starting property filtering with query', query);
  logPropertySearch('Available mock properties count', properties.length);
  
  // Log a sample of properties for debugging
  logPropertySearch('Sample properties', properties.slice(0, 2));

  // Helper to check if a location matches
  const matchesLocation = (property: PropertySearchResult, location?: string): boolean => {
    if (!location) return true;
    const locationLower = location.toLowerCase().trim();
    
    // Map of state abbreviations to full names for matching
    const stateAbbreviations: Record<string, string> = {
      'az': 'arizona',
      'fl': 'florida',
      'ca': 'california',
      'ny': 'new york',
      'nj': 'new jersey',
      'or': 'oregon',
      'tx': 'texas',
      // Add more as needed
    };
    
    // Generate a reverse mapping for full state names to abbreviations
    const stateFullNames: Record<string, string> = {};
    Object.entries(stateAbbreviations).forEach(([abbr, fullName]) => {
      stateFullNames[fullName] = abbr;
    });
    
    // Check if the location is a state name that matches the state abbreviation
    const stateAbbr = property.state.toLowerCase();
    const fullStateName = stateAbbreviations[stateAbbr] || '';
    
    // Check if search is for a state name or abbreviation
    const isStateSearch = stateFullNames[locationLower] !== undefined || stateAbbreviations[locationLower] !== undefined;
    const stateMatch = stateAbbr === locationLower || fullStateName === locationLower;
    
    // For state searches, match any property in that state
    if (isStateSearch) {
      return stateMatch || property.state.toLowerCase() === stateFullNames[locationLower];
    }
    
    // Split search location into parts for more flexible matching
    const locationParts = locationLower.split(/[\s,]+/).filter(part => part.length > 0);
    
    // Get property location parts
    const propertyCity = property.city ? property.city.toLowerCase() : '';
    const propertyZip = property.zipCode ? property.zipCode.toLowerCase() : '';
    const propertyAddr = property.address ? property.address.toLowerCase() : '';
    const propertyFullAddr = `${propertyAddr} ${propertyCity} ${stateAbbr} ${propertyZip}`.toLowerCase();
    
    // Special handling for numeric components in search (like street numbers)
    // This is crucial for address searches
    const numericParts = locationParts.filter(part => /^\d+$/.test(part));
    const numericMatch = numericParts.some(numPart => propertyFullAddr.includes(numPart));
    
    // If we're searching for a street number and it's not found, it's likely not the right property
    const isAddressSearch = numericParts.length > 0;
    
    // Check for exact address match
    const exactAddress = locationLower.replace(/\s+/g, ' ').trim();
    const normalizedPropertyAddr = propertyAddr.replace(/\s+/g, ' ').trim();
    
    // Direct address comparison (more strict)
    const exactAddressMatch = normalizedPropertyAddr === exactAddress;
    
    // Is the search a subset of the property address or vice versa
    const addressContainsSearch = normalizedPropertyAddr.includes(exactAddress);
    const searchContainsAddress = exactAddress.includes(normalizedPropertyAddr);
    
    // Check for city, state, zip matches
    const cityMatch = propertyCity.includes(locationLower) || locationLower.includes(propertyCity);
    const zipMatch = propertyZip.includes(locationLower);
    
    // Check if any word in the search matches parts of the address
    // This helps with partial street name matches
    const wordMatches = locationParts.some(part => {
      // For non-numeric parts, they should be at least 3 chars to count as meaningful
      if (part.length < 3 && !(/^\d+$/.test(part))) return false;
      return propertyFullAddr.includes(part);
    });
    
    // For address searches, prioritize numeric matches
    if (isAddressSearch) {
      // If searching for a specific address with numbers, we need the numbers to match
      if (!numericMatch) {
        return false; // If we can't match the street number, it's definitely not the right property
      }
    }
    
    // Also match if it's a state-only search and states match
    const stateOnlyMatch = isStateSearch && stateMatch;
    
    const match = exactAddressMatch || addressContainsSearch || searchContainsAddress || 
                 (numericMatch && wordMatches) || 
                 (cityMatch && stateMatch) || 
                 zipMatch ||
                 stateOnlyMatch;
    
    // For debugging, log all property location details
    logPropertySearch(`Location check for property ${property.id}`, {
      propertyId: property.id,
      searchLocation: location,
      locationLower: locationLower,
      locationParts: locationParts,
      numericParts: numericParts,
      numericMatch: numericMatch,
      propertyCity: property.city || '',
      propertyState: property.state || '',
      propertyZipCode: property.zipCode || '',
      propertyAddress: property.address || '',
      normalizedPropertyAddr: normalizedPropertyAddr,
      propertyFullAddr: propertyFullAddr,
      exactAddressMatch: exactAddressMatch,
      addressContainsSearch: addressContainsSearch,
      searchContainsAddress: searchContainsAddress,
      wordMatches: wordMatches,
      cityMatch: cityMatch,
      stateMatch: stateMatch,
      isStateSearch: isStateSearch,
      stateOnlyMatch: stateOnlyMatch,
      zipMatch: zipMatch,
      matchResult: match
    });
    
    return match;
  };

  // Helper to check if a property type matches
  const matchesPropertyType = (propertyType: PropertyType, searchType?: PropertyType): boolean => {
    // If no search type is specified, all property types match
    if (!searchType) return true;
    
    const propertyTypeLower = propertyType.toLowerCase();
    const searchTypeLower = searchType.toLowerCase();
    
    // Make property type matching more flexible
    // For mixed-use properties, they should match when searching for commercial, residential, or mixed-use
    if (propertyTypeLower === 'mixed-use') {
      return searchTypeLower === 'mixed-use' || 
             searchTypeLower === 'commercial' || 
             searchTypeLower === 'residential';
    }
    
    // Commercial properties should also match retail, office
    if (propertyTypeLower === 'commercial') {
      return searchTypeLower === 'commercial' || 
             searchTypeLower === 'retail' || 
             searchTypeLower === 'office';
    }
    
    // Multifamily should match residential searches
    if (propertyTypeLower === 'multifamily') {
      return searchTypeLower === 'multifamily' || 
             searchTypeLower === 'residential';
    }
    
    // Industrial should match commercial searches too
    if (propertyTypeLower === 'industrial') {
      return searchTypeLower === 'industrial' || 
             searchTypeLower === 'commercial';
    }
    
    // Direct match
    return propertyTypeLower === searchTypeLower;
  };

  // Helper to check if a property is in a price range
  const isInPriceRange = (price: number, priceRange?: string): boolean => {
    if (!priceRange) return true;
    const [minStr, maxStr] = priceRange.split('-');
    const min = parseInt(minStr);
    const max = parseInt(maxStr);
    if (isNaN(min) && isNaN(max)) return true;
    if (isNaN(min)) return price <= max;
    if (isNaN(max)) return price >= min;
    return price >= min && price <= max;
  };

  // Track filter results for each property
  const filterResults = properties.map(property => {
    // Location filter - if no location provided, all properties pass this filter
    const passesLocationFilter = !query.location || matchesLocation(property, query.location);
    
    // Property type filter - if no property type provided, all properties pass this filter
    const passesTypeFilter = !query.propertyType || 
      matchesPropertyType(property.propertyType, query.propertyType);
    
    // Price range filter
    const passesPriceFilter = isInPriceRange(property.price, query.priceRange);
    
    // Bedrooms filter
    const passesBedroomsFilter = !query.bedrooms || (property.bedrooms && property.bedrooms >= query.bedrooms);
    
    // Bathrooms filter
    const passesBathroomsFilter = !query.bathrooms || (property.bathrooms && property.bathrooms >= query.bathrooms);
    
    // Square feet filter
    const passesSquareFeetFilter = !query.squareFeet || (property.squareFeet && property.squareFeet >= query.squareFeet);
    
    // Year built filter
    const passesYearBuiltFilter = !query.yearBuilt || (property.yearBuilt && property.yearBuilt >= query.yearBuilt);
    
    // Zoning filter
    const passesZoningFilter = !query.zoning || (property.zoning && property.zoning.toLowerCase().includes(query.zoning.toLowerCase()));
    
    // Building class filter
    const passesBuildingClassFilter = !query.buildingClass || property.buildingClass === query.buildingClass;
    
    // Stories filter
    const passesStoriesFilter = !query.stories || (property.stories && property.stories >= query.stories);
    
    // Number of units filter
    const passesUnitsFilter = !query.numberOfUnits || (property.numberOfUnits && property.numberOfUnits >= query.numberOfUnits);
    
    // Percent occupied filter
    const passesOccupancyFilter = !query.percentOccupied || (property.percentOccupied && property.percentOccupied >= query.percentOccupied);
    
    // Combine all filters with a more lenient approach - if location matches, relax property type constraints
    // This will ensure if someone searches for a specific address, we show that property regardless of type
    const passesAllFilters = passesLocationFilter && 
      passesTypeFilter && 
      passesPriceFilter && 
      passesBedroomsFilter && 
      passesBathroomsFilter && 
      passesSquareFeetFilter && 
      passesYearBuiltFilter && 
      passesZoningFilter && 
      passesBuildingClassFilter && 
      passesStoriesFilter && 
      passesUnitsFilter && 
      passesOccupancyFilter;
      
    // Alternative passing condition: if it's a very specific location match, be more lenient about property type
    const isExactAddressMatch = property.address && query.location && 
      (property.address.toLowerCase().includes(query.location.toLowerCase()) || 
       query.location.toLowerCase().includes(property.address.toLowerCase()));
       
    const passes = passesAllFilters || (isExactAddressMatch && 
      passesPriceFilter && 
      passesBedroomsFilter && 
      passesBathroomsFilter && 
      passesSquareFeetFilter && 
      passesYearBuiltFilter && 
      passesZoningFilter && 
      passesBuildingClassFilter && 
      passesStoriesFilter && 
      passesUnitsFilter && 
      passesOccupancyFilter);
    
    // If this property fails filtering, log why
    if (!passes) {
      logPropertySearch(`Property ${property.id} filtered out - Failing filters`, {
        propertyId: property.id,
        location: passesLocationFilter ? 'PASS' : 'FAIL',
        propertyType: passesTypeFilter ? 'PASS' : 'FAIL',
        exactAddressMatch: isExactAddressMatch ? 'PASS' : 'FAIL',
        priceRange: passesPriceFilter ? 'PASS' : 'FAIL',
        bedrooms: passesBedroomsFilter ? 'PASS' : 'FAIL',
        bathrooms: passesBathroomsFilter ? 'PASS' : 'FAIL',
        squareFeet: passesSquareFeetFilter ? 'PASS' : 'FAIL',
        yearBuilt: passesYearBuiltFilter ? 'PASS' : 'FAIL',
        zoning: passesZoningFilter ? 'PASS' : 'FAIL',
        buildingClass: passesBuildingClassFilter ? 'PASS' : 'FAIL',
        stories: passesStoriesFilter ? 'PASS' : 'FAIL',
        numberOfUnits: passesUnitsFilter ? 'PASS' : 'FAIL',
        percentOccupied: passesOccupancyFilter ? 'PASS' : 'FAIL'
      });
    }
    
    return { property, passes };
  });
  
  // Extract passing properties and limit to maxResults
  const filteredProperties = filterResults
    .filter(result => result.passes)
    .map(result => result.property)
    .slice(0, maxResults);
  
  logPropertySearch(`Filtering complete - Found ${filteredProperties.length} matching properties`);
  
  return filteredProperties;
};

export const propertySearchTool = ({ uiStream, fullResponse }: { uiStream: any, fullResponse: string }) => ({
  description: 'Search for real estate properties by location, type, price range, and other criteria.',
  parameters: propertySearchSchema,
  execute: async ({ 
    location, 
    propertyType, 
    priceRange, 
    bedrooms, 
    bathrooms, 
    squareFeet, 
    amenities, 
    yearBuilt,
    zoning,
    buildingClass,
    stories,
    numberOfUnits,
    percentOccupied,
    max_results 
  }: { 
    location?: string;
    propertyType?: PropertyType;
    priceRange?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    amenities?: string[];
    yearBuilt?: number;
    zoning?: string;
    buildingClass?: 'Class A' | 'Class B' | 'Class C';
    stories?: number;
    numberOfUnits?: number;
    percentOccupied?: number;
    max_results?: number;
  }) => {
    const streamResults = createStreamableValue<string>();
    
    try {
      // Show property search skeleton immediately
      uiStream.append(<PropertySection result={streamResults.value} />);
      
      // Improve address parsing - people may enter the full address with city, state, zip
      // We want to make sure we can find properties regardless of format
      const normalizedLocation = location ? location.trim() : '';
      
      // Start search
      logPropertySearch('🏠 Property search request received', { 
        location: normalizedLocation || null, 
        propertyType: propertyType || null, 
        priceRange, 
        bedrooms, 
        bathrooms, 
        squareFeet,
        amenities,
        yearBuilt,
        zoning,
        buildingClass,
        stories,
        numberOfUnits,
        percentOccupied,
        max_results
      });
      
      // Update stream with initial state
      streamResults.update(JSON.stringify({ 
        properties: [], 
        query: {
          location: normalizedLocation,
          propertyType: propertyType || null
        },
        status: 'searching' 
      }));

      // Simulate a short delay for realistic searching effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Load and log the mock properties
      logPropertySearch(`Loaded ${mockProperties.length} mock properties`);

      // Filter properties based on search criteria
      const filteredProperties = filterProperties(mockProperties, {
        location: normalizedLocation,
        propertyType,
        priceRange,
        bedrooms,
        bathrooms,
        squareFeet,
        amenities,
        yearBuilt,
        zoning,
        buildingClass,
        stories,
        numberOfUnits,
        percentOccupied
      }, max_results || 10);

      // If no exact results, try a broader search
      let finalResults = filteredProperties;
      
      if (filteredProperties.length === 0 && normalizedLocation) {
        // Extract just the street number and name for a broader search
        const addressMatch = normalizedLocation.match(/(\d+\s+[A-Za-z]+\s+[A-Za-z]+)/);
        const streetAddress = addressMatch ? addressMatch[1] : '';
        
        if (streetAddress && streetAddress !== normalizedLocation) {
          logPropertySearch(`No results with full address, trying just street address: "${streetAddress}"`);
          
          const streetAddressResults = filterProperties(mockProperties, {
            location: streetAddress,
            // Don't filter by property type in this fallback search
            priceRange,
            bedrooms,
            bathrooms,
            squareFeet,
            amenities,
            yearBuilt,
            zoning,
            buildingClass,
            stories,
            numberOfUnits,
            percentOccupied
          }, max_results || 10);
          
          if (streetAddressResults.length > 0) {
            finalResults = streetAddressResults;
            logPropertySearch(`Found ${streetAddressResults.length} results with street address search`);
          }
        }
        
        // If still no results, try searching without location constraints but with other criteria
        if (finalResults.length === 0 && propertyType) {
          logPropertySearch(`No results found with location "${normalizedLocation}", trying search with just property type "${propertyType}"`);
          
          const propertyTypeOnlyResults = filterProperties(mockProperties, {
            propertyType,
            priceRange,
            bedrooms,
            bathrooms,
            squareFeet,
            amenities,
            yearBuilt,
            zoning,
            buildingClass,
            stories,
            numberOfUnits,
            percentOccupied
          }, max_results || 10);
          
          if (propertyTypeOnlyResults.length > 0) {
            finalResults = propertyTypeOnlyResults;
            logPropertySearch(`Found ${propertyTypeOnlyResults.length} results with property type search only`);
          }
        }
        
        // Last resort: try to find any properties that might match criteria other than location or property type
        if (finalResults.length === 0 && (priceRange || bedrooms || bathrooms || squareFeet || yearBuilt || 
            zoning || buildingClass || stories || numberOfUnits || percentOccupied)) {
          logPropertySearch(`No results with location or property type filters, trying with other criteria only`);
          
          const otherCriteriaResults = filterProperties(mockProperties, {
            priceRange,
            bedrooms,
            bathrooms,
            squareFeet,
            amenities,
            yearBuilt,
            zoning,
            buildingClass,
            stories,
            numberOfUnits,
            percentOccupied
          }, max_results || 10);
          
          if (otherCriteriaResults.length > 0) {
            finalResults = otherCriteriaResults;
            logPropertySearch(`Found ${otherCriteriaResults.length} results with other criteria search`);
          }
        }
      }

      // For property type only searches, create a descriptive response
      let searchSummary = '';
      if (!normalizedLocation && propertyType) {
        searchSummary = `Showing all ${propertyType} properties`;
      } else if (normalizedLocation && propertyType) {
        searchSummary = `${propertyType} properties in ${normalizedLocation}`;
      } else if (normalizedLocation) {
        searchSummary = `Properties in ${normalizedLocation}`;
      } else {
        searchSummary = 'All available properties';
      }

      const searchResults: PropertySearchResults = {
        properties: finalResults,
        query: {
          location: normalizedLocation,
          propertyType,
          priceRange,
          bedrooms,
          bathrooms,
          squareFeet,
          amenities,
          yearBuilt,
          zoning,
          buildingClass,
          stories,
          numberOfUnits,
          percentOccupied
        },
        status: 'complete',
        summary: searchSummary
      };

      // Complete the stream with the full results
      streamResults.done(JSON.stringify(searchResults));
      
      logPropertySearch(`Property search completed with ${finalResults.length} results`);
      if (finalResults.length === 0) {
        logPropertySearch('No properties found - Query may be too restrictive', {
          location: normalizedLocation || null,
          propertyType: propertyType || null,
          mock_property_types_available: [...new Set(mockProperties.map(p => p.propertyType))],
          mock_locations_available: [...new Set(mockProperties.map(p => `${p.city}, ${p.state}`))]
        });
      }
      
      // Return results as a tool response
      return {
        role: 'tool',
        content: searchResults
      };

    } catch (error) {
      logPropertySearch('❌ Error in property search execution', error);
      
      const emptyResults: PropertySearchResults = { 
        properties: [], 
        query: {
          location: location || '',
          propertyType
        },
        error: error instanceof Error ? error.message : 'Property search failed',
        status: 'error'
      };
      
      // Always complete the stream, even on error
      if (!streamResults.done) {
        streamResults.done(JSON.stringify(emptyResults));
      }
      
      // Return empty results as tool response
      return {
        role: 'tool',
        content: emptyResults
      };
    }
  }
}); 