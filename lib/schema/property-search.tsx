import { DeepPartial } from 'ai'
import { z } from 'zod'

export const propertySearchSchema = z.object({
  location: z.string().optional().describe('The location to search for properties (city, zip code, neighborhood, etc.). Optional if searching by property type only.'),
  propertyType: z.enum(['residential', 'commercial', 'industrial', 'mixed-use', 'multifamily', 'land']).optional().describe('Type of property to search for (optional)'),
  priceRange: z.string().optional()
    .describe('Optional price range in format min-max (e.g., "200000-500000")'),
  bedrooms: z.number().optional().describe('Minimum number of bedrooms for residential properties'),
  bathrooms: z.number().optional().describe('Minimum number of bathrooms for residential properties'),
  squareFeet: z.number().optional().describe('Minimum square footage'),
  amenities: z.array(z.string()).optional().describe('List of desired amenities (e.g., ["pool", "garage", "view"])'),
  yearBuilt: z.number().optional().describe('Earliest year built'),
  // New fields from CSV
  zoning: z.string().optional().describe('Zoning classification (e.g., "Residential multifamily", "Mixed-use")'),
  buildingClass: z.enum(['Class A', 'Class B', 'Class C']).optional().describe('Building classification'),
  stories: z.number().optional().describe('Number of stories in the building'),
  yearRenovated: z.number().optional().describe('Year of last renovation'),
  numberOfUnits: z.number().optional().describe('Number of units in the property'),
  unitBreakout: z.string().optional().describe('Detailed breakdown of unit types'),
  percentOccupied: z.number().optional().describe('Current occupancy rate as a percentage'),
  averageRentPerUnit: z.number().optional().describe('Average rent per unit'),
  propertyTaxes: z.number().optional().describe('Annual property taxes'),
  constructionBudget: z.number().optional().describe('Renovation/construction budget'),
  max_results: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? 10 : num;
      }
      return 10;
    },
    z.number().default(10)
  ).describe('The maximum number of results to return')
})

export type PartialPropertySearch = DeepPartial<typeof propertySearchSchema> 