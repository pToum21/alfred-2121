import { PropertySearchResult, PropertyType } from './types';

// Generate placeholder property images
const getPlaceholderImages = (count: number = 5, type: string = 'house') => {
  // Use static images instead of random ones to prevent 404 errors
  const staticImages = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop', // Modern building
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop', // Apartment exterior
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', // Office building
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', // Interior
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop', // House
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', // Luxury home
    'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800&h=600&fit=crop', // Apartment building
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'  // Property
  ];
  
  return Array.from({ length: count }, (_, index) => staticImages[index % staticImages.length]);
};

// Parse the percent occupied string to a number
const parsePercentOccupied = (percentOccupied: string): number => {
  if (!percentOccupied) return 0;
  return parseInt(percentOccupied.replace('%', ''));
};

// Parse the average rent string to a number
const parseAverageRent = (averageRent: string): number => {
  if (!averageRent) return 0;
  const rentMatch = averageRent.match(/\$([0-9,]+)/);
  return rentMatch ? parseInt(rentMatch[1].replace(',', '')) : 0;
};

// Sample property descriptions
const propertyDescriptions = [
  "This attractive property offers an excellent investment opportunity in a high-demand area. With strong occupancy rates and consistent rental income, it provides both immediate cash flow and long-term appreciation potential.",
  "If you are looking for an affordable brand new spacious apartment in the middle of it all, LOOK NO FURTHER! Palm Village is located just minutes away from Florida State University, Restaurants, bars and much more! Brand New Apartments recently renovated with GRANITE COUNTER TOPS, WOOD FLOORS and all NEW APPLIANCES!! We are making improvements DAILY with many more to come! Come check us out!",
  "Directly across the street from TCNJ and bus line. Great open layout, with private bathrooms and a kitchen. Excellent second floor location with 2 forms of egress, secure building with 24-hour access and security system. This mixed-use property features an open floor plan that is fully carpeted and includes signage opportunities.",
  "Portfolio Sale of 2 Commercial Adjacent Properties. 3327 and 3331 NE Sandy. NOI of $337,268, includes 12 studio apartments and 14 commercial office and retail units at a 7 Cap. Fully Leased with complete remodel to studs in 2015. Preapproved Offers Required and Accepted prior to any touring. Exterior walk tours and common area walk throughs available."
];

// Create sample features for properties
const createSampleFeatures = (propertyType: string): string[] => {
  const commonFeatures = ['On-site management', 'Secure entry', 'Professional landscaping'];
  
  const typeSpecificFeatures: Record<string, string[]> = {
    'multifamily': ['Laundry facilities', 'Community area', 'Parking included', 'Storage units'],
    'commercial': ['ADA compliant', 'Loading dock', 'High visibility', 'Abundant parking'],
    'mixed-use': ['Separate entrances', 'Flexible floor plans', 'High foot traffic', 'Street frontage'],
    'industrial': ['High ceilings', 'Dock-high doors', 'Heavy power', 'Climate control']
  };

  return [
    ...commonFeatures,
    ...(typeSpecificFeatures[propertyType.toLowerCase()] || []),
    'Recently renovated',
    'Close to amenities'
  ];
};

// Special features for specific properties
const getSpecialFeaturesForProperty = (propertyId: string): string[] | null => {
  const specialFeatures: Record<string, string[]> = {
    'levy-ave': [
      'Granite Countertops',
      'Hardwood Floors',
      'Laundry Facilities',
      'Pet Friendly - Dogs Allowed',
      'Pet Friendly - Cats Allowed',
      'Close to Florida A&M University (1.3 mi)',
      'Close to Florida State University (1.7 mi)',
      'Recently Renovated',
      'New Appliances'
    ],
    'hoyt-st': [
      '24 Hour Access',
      'Security System',
      'Signage',
      'Kitchen',
      'Fully Carpeted',
      'Open-Plan',
      'Private Bathrooms',
      'Excellent Public Transportation',
      'Easy Access',
      '2 Forms of Egress',
      'Directly Across from TCNJ'
    ],
    'sandy-blvd': [
      'Wall Unit Air Conditioning',
      'Gas Water Heater',
      'Total Structure Area: 18,000 sqft',
      'Lot Size: 6,534 sqft',
      'Zoning: CM3',
      'Completely Restored (2015)',
      'Public Sewer',
      'Public Water',
      'Front Yard Landscaping',
      'Secure Entry',
      'Flat Roof',
      'Multi-Family Type',
      'Annual Tax: $30,017'
    ]
  };
  
  return specialFeatures[propertyId] || null;
};

// Function to extract city, state, zip from address
const parseAddress = (fullAddress: string): { address: string; city: string; state: string; zipCode: string } => {
  const parts = fullAddress.split(',');
  
  if (parts.length >= 2) {
    const address = parts[0].trim();
    
    // Special handling for specific addresses we know from our CSV data
    if (fullAddress.includes('4224 E. Canyon Trail, Cottonwood, AZ')) {
      return { 
        address: '4224 E. Canyon Trail', 
        city: 'Cottonwood', 
        state: 'AZ', 
        zipCode: '86326' 
      };
    }
    
    // Special handling for 1517 Levy Ave
    if (fullAddress.includes('1517 Levy Avenue, Tallahassee, FL')) {
      return {
        address: '1517 Levy Ave',
        city: 'Tallahassee',
        state: 'FL',
        zipCode: '32310'
      };
    }
    
    // For addresses with city explicitly in the middle part
    if (parts.length >= 3) {
      const city = parts[1].trim();
      const stateZipPart = parts[2].trim();
      
      // Try to extract state and zip
      const stateZipMatch = stateZipPart.match(/([A-Z]{2})(\s+(\d{5}(-\d{4})?))?\s*$/);
      
      if (stateZipMatch) {
        const state = stateZipMatch[1];
        const zipCode = stateZipMatch[3] || '';
        return { address, city, state, zipCode };
      }
    }
    
    // For addresses with only two parts (address, city+state+zip)
    const cityStatePart = parts[parts.length - 1].trim();
    
    // Try to extract state and zip
    const stateZipMatch = cityStatePart.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);
    
    if (stateZipMatch) {
      const state = stateZipMatch[1];
      const zipCode = stateZipMatch[2];
      const city = cityStatePart.replace(stateZipMatch[0], '').trim();
      return { address, city, state, zipCode };
    }
    
    // If we can't match the pattern, make our best guess
    const cityParts = cityStatePart.split(' ');
    const zipCode = cityParts[cityParts.length - 1].match(/\d{5}/) ? cityParts.pop() || '' : '';
    const state = cityParts[cityParts.length - 1].match(/[A-Z]{2}/) ? cityParts.pop() || '' : '';
    const city = cityParts.join(' ');
    
    return { address, city, state, zipCode };
  }
  
  // Fallback for unparseable addresses
  return { address: fullAddress, city: '', state: '', zipCode: '' };
};

// Helper to parse year built range to a number
const parseYearBuilt = (yearBuiltString: string): number => {
  if (!yearBuiltString) return 0;
  
  // Handle formats like "Early 2000s"
  if (yearBuiltString.toLowerCase().includes('early')) {
    const decade = yearBuiltString.match(/\d{4}/);
    return decade ? parseInt(decade[0]) + 2 : 0;
  }
  
  // Handle formats like "1990/2015" (built/renovated)
  if (yearBuiltString.includes('/')) {
    return parseInt(yearBuiltString.split('/')[0]);
  }
  
  // Handle formats like "1980s"
  if (yearBuiltString.includes('s')) {
    const decade = yearBuiltString.match(/\d{4}/);
    return decade ? parseInt(decade[0]) + 5 : 0;
  }
  
  // Try to parse as a plain number
  const year = parseInt(yearBuiltString);
  return isNaN(year) ? 0 : year;
};

// Helper to parse renovation year
const parseYearRenovated = (yearBuiltString: string): number | undefined => {
  if (!yearBuiltString || !yearBuiltString.includes('/')) return undefined;
  
  const renovated = yearBuiltString.split('/')[1];
  const year = parseInt(renovated);
  return isNaN(year) ? undefined : year;
};

// Parse CSV data to create property objects
export const createPropertiesFromCSV = (): PropertySearchResult[] => {
  // Using the data from property_data.csv
  const csvProperties = [
    {
      address: "4224 E. Canyon Trail, Cottonwood, AZ",
      propertyType: "Multifamily",
      squareFeet: 9600,
      zoning: "Residential multifamily",
      lotSize: "",
      buildingClass: "Class B",
      stories: 2,
      yearBuilt: "Early 2000s",
      numberOfUnits: 12,
      unitBreakout: "12 units of 2 bedrooms, 1 bathroom each",
      percentOccupied: "100%",
      averageRentPerUnit: "$900/month",
      propertyTaxes: 0,
      purchasePrice: "$3,175,000",
      constructionBudget: "Included in purchase price"
    },
    {
      address: "1517 Levy Avenue, Tallahassee, FL",
      propertyType: "Multifamily",
      squareFeet: 6000,
      zoning: "Residential multifamily",
      lotSize: "",
      buildingClass: "Class C",
      stories: 2,
      yearBuilt: "1980s/2023",
      numberOfUnits: 10,
      unitBreakout: "10 units of 1 bedroom, 1 bathroom each",
      percentOccupied: "100%",
      averageRentPerUnit: "$575/month",
      propertyTaxes: 0,
      purchasePrice: "$1,000,000",
      constructionBudget: "0"
    },
    {
      address: "20 Hoyt St., Newark, NJ 07103",
      propertyType: "Mixed-use retail",
      squareFeet: 6070,
      zoning: "Mixed-use",
      lotSize: "",
      buildingClass: "Class C",
      stories: 2,
      yearBuilt: "1954",
      numberOfUnits: 10,
      unitBreakout: "5 commercial, 5 residential units",
      percentOccupied: "80%",
      averageRentPerUnit: "Commercial: $20/sq ft; Residential: $1,500/month",
      propertyTaxes: 0,
      purchasePrice: "$465,000",
      constructionBudget: "0"
    },
    {
      address: "3327 NE Sandy Boulevard, Portland, OR",
      propertyType: "Mixed-use",
      squareFeet: 18000,
      zoning: "CM3",
      lotSize: "6,534",
      buildingClass: "Class B",
      stories: 2,
      yearBuilt: "1948/2015",
      numberOfUnits: 26,
      unitBreakout: "12 studio apartments, 14 commercial office and retail units",
      percentOccupied: "100%",
      averageRentPerUnit: "$18,000/month",
      propertyTaxes: 30017,
      purchasePrice: "$4,665,000",
      constructionBudget: "0"
    }
  ];

  // Convert to PropertySearchResult objects
  return csvProperties.map((property, index) => {
    const { address, city, state, zipCode } = parseAddress(property.address);
    const propertyType = property.propertyType.toLowerCase().includes('mixed') 
      ? 'mixed-use' 
      : property.propertyType.toLowerCase() as PropertyType;
    
    // Extract bedrooms and bathrooms from unitBreakout if possible
    let bedrooms: number | undefined;
    let bathrooms: number | undefined;
    
    const bedroomsMatch = property.unitBreakout.match(/(\d+)\s*bedrooms?/i);
    const bathroomsMatch = property.unitBreakout.match(/(\d+)\s*bathrooms?/i);
    
    if (bedroomsMatch) bedrooms = parseInt(bedroomsMatch[1]);
    if (bathroomsMatch) bathrooms = parseInt(bathroomsMatch[1]);
    
    // Special case for the Sandy Blvd property
    if (property.address.includes("3327 NE Sandy Boulevard")) {
      bathrooms = 18;
    }
    
    // Parse price from purchasePrice
    const priceMatch = property.purchasePrice.match(/\$([0-9,]+)/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
    
    // Set specific listing date for Levy Ave property, or generate a random one
    let listingDate: Date;
    if (address === "1517 Levy Ave") {
      // Set to approximately 2 weeks ago
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      listingDate = twoWeeksAgo;
    } else if (address === "3327 NE Sandy Boulevard" && state === "OR") {
      // Set to July 3, 2024
      listingDate = new Date('2024-07-03');
    } else {
      // Generate a random listing date within the last 3 months
      const today = new Date();
      const randomDaysAgo = Math.floor(Math.random() * 90);
      listingDate = new Date(today);
      listingDate.setDate(today.getDate() - randomDaysAgo);
    }
    
    // Use property-specific features if available
    let features = property.address.includes("1517 Levy Avenue") 
      ? getSpecialFeaturesForProperty('levy-ave') 
      : property.address.includes("20 Hoyt St")
        ? getSpecialFeaturesForProperty('hoyt-st')
        : property.address.includes("3327 NE Sandy Boulevard")
          ? getSpecialFeaturesForProperty('sandy-blvd')
          : createSampleFeatures(propertyType);
      
    // If somehow special features are null, fall back to standard features
    if (!features) {
      features = createSampleFeatures(propertyType);
    }
    
    // Special case for the Cottonwood, AZ property - use real Zillow images
    let imageUrls = getPlaceholderImages(5, propertyType);
    
    // If this is the Cottonwood property, use the specific Zillow images
    if (address === "4224 E. Canyon Trail" && state === "AZ") {
      imageUrls = [
        "https://photos.zillowstatic.com/fp/c8ee1e50535a4dfe5f6f90f3cb6fc8b9-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/2f008f05645822f48db3208aacd40fc8-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/89a8299e4ab50de66da01f1e9ffe8156-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/687f3064e985f4dd07b1eacc2c60ae1f-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/51e4452cd2f0d3c1cc36afad0264e08f-cc_ft_1536.jpg"
      ];
    } else if (address === "3327 NE Sandy Boulevard" && state === "OR") {
      // Use the actual Zillow images for Sandy Boulevard property
      imageUrls = [
        "https://photos.zillowstatic.com/fp/4a48745f01e91a530801f29699450562-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/a937958c01fa29ce3beb497d8e519958-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/b8009b038164bce0cd3ad051066e9b87-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/45763a20cc2cd788ad88dc8ae543a946-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/31065793152967093d554b115242d6b8-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/2e9c16ddea612b2255d1651fa61ca984-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/64c94509378ab1ca5274e24b7db43c3a-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/f7dc2871ab22f0f51d1dfec8149fc1ab-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/d96d85a826caa0f13fe3c088c8f451ed-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/e479c6b7d3ee27b7b41dfd6e546edad1-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/b123b592eee009034e058f7009594895-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/6ff28694dc480c382caa175796b3b56d-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/41a05c0ba102c3998af91b3a0a096f63-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/a568aa8e33f032aae9d8a32010fef334-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/0d0dea9e576800f8b1d9e7b9dcc372a7-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/18cd8d8153a2114e3958632572b5cdb7-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/9957c69791f35d5c33b0e798c977a035-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/2207653fd72bb4b6624c40673f6a5a70-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/e01a032310d3740133d0e63461044ff9-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/3e089d49b9cf3f5250f7b3904a34395c-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/b40aa5b7b41b8b7c802168fd7c24d87f-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/7365237fde8728dad4a67e1a737d414f-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/ca7f84562d927e12abecd028dffda158-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/ebf96f77c847335d64ecfcd36b7e9e9b-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/5fac0c6ab4a2d8d557fea79e73eca2bf-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/75928f96e0ff48191be1e4c942f525a3-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/ea03241922d1d528e58e3fb7bd41daaf-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/b903c91f64d20986ecdccc53998363ca-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/e4d0eb0ba664dffa01884bf5b4464207-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/5ce86a0494546be6bda1dac7c1e894b8-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/c3feda9660b6bf8f7ebc644dfa5dafee-cc_ft_1536.jpg",
        "https://photos.zillowstatic.com/fp/dd63d10b53c4f272cbc3486959ba07a6-cc_ft_1536.jpg"
      ];
    }
    
    // Parse comps for Cottonwood, AZ property
    let comps;
    if (address === "4224 E. Canyon Trail" && state === "AZ") {
      comps = [
        {
          address: "4318 E Vista Dr Cottonwood AZ 86326",
          baths: "",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/8530f3c7a3821862580a7906ceb6c38d-p_c.jpg",
          mlsId: "",
          price: "$44,305",
          sqft: "",
          status: "Off Market" as const,
        },
        {
          address: "4318 E Vista Dr 458 Cottonwood AZ 86326",
          baths: "",
          beds: "",
          imageUrl: "https://maps.googleapis.com/maps/api/streetview?location=4318+E+Vista+Dr%2C+Cottonwood%2C+AZ+86326&size=316x234&key=AIzaSyARFMLB1na-BBWf7_R3-5YOQQaHqEJf6RQ&source=outdoor&&signature=Z26fO3gfyGjlasjUKZDXTNXM25g=",
          mlsId: "",
          price: "$--",
          sqft: "",
          status: "Off Market" as const,
        },
        {
          address: "4252 4278B E Canyon Trl Cottonwood AZ 86326",
          baths: "",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/1dde03c685fa9638f612bc5a8e31c070-p_c.jpg",
          mlsId: "",
          price: "$2,650,000",
          sqft: "10000",
          status: "Pending" as const,
        },
        {
          address: "4252 E Canyon Trl APT 4 Cottonwood AZ 86326",
          baths: "1",
          beds: "2",
          imageUrl: "https://photos.zillowstatic.com/fp/225bf709a8be2b31cd262b7ba7bd47fc-p_c.jpg",
          mlsId: "",
          price: "$--",
          sqft: "750",
          status: "Off Market" as const,
        },
        {
          address: "4336 E Vista Dr Cottonwood AZ 86326",
          baths: "",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/b3c7b7332b6aa3833a51a44a53e2f71e-p_c.jpg",
          mlsId: "",
          price: "$45,472",
          sqft: "",
          status: "Off Market" as const,
        },
        {
          address: "4336 E Vista Dr 447 Cottonwood AZ 86326",
          baths: "",
          beds: "",
          imageUrl: "https://maps.googleapis.com/maps/api/streetview?location=4336+E+Vista+Dr%2C+Cottonwood%2C+AZ+86326&size=316x234&key=AIzaSyARFMLB1na-BBWf7_R3-5YOQQaHqEJf6RQ&source=outdoor&&signature=q5FFkbtMxRHAE2ZOs_aeTKnBemY=",
          mlsId: "",
          price: "$--",
          sqft: "",
          status: "Off Market" as const,
        },
        {
          address: "4294 E Vista Dr Cottonwood AZ 86326",
          baths: "",
          beds: "",
          imageUrl: "https://maps.googleapis.com/maps/api/streetview?location=4294+E+Vista+Dr%2C+Cottonwood%2C+AZ+86326&size=316x234&key=AIzaSyARFMLB1na-BBWf7_R3-5YOQQaHqEJf6RQ&source=outdoor&&signature=KrcG1SL3HDUzV2dV8espZwyWV_0=",
          mlsId: "",
          price: "$45,472",
          sqft: "",
          status: "Off Market" as const,
        },
        {
          address: "4278 E Canyon Trl 4 Cottonwood AZ 86326",
          baths: "1",
          beds: "2", // Note: Fixed from original data which showed "8002" as beds
          imageUrl: "https://photos.zillowstatic.com/fp/383e420543b0beb4b9776e5d73270f86-p_c.jpg",
          mlsId: "",
          price: "$125,800",
          sqft: "780",
          status: "Off Market" as const,
        }
      ];
    } else if (address === "3327 NE Sandy Boulevard" && state === "OR") {
      comps = [
        {
          address: "3327 NE Sandy Blvd #102, Portland, OR 97232",
          baths: "1",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/e1662cfde9b24725e82fb65cd0215cbf-p_c.jpg",
          mlsId: "",
          price: "$1,025",
          sqft: "300",
          status: "For Rent" as const,
          unitNumber: "102"
        },
        {
          address: "3327 NE Sandy Blvd #108, Portland, OR 97232",
          baths: "1",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/afaead01edd356db98b9cf727f2c0758-p_c.jpg",
          mlsId: "",
          price: "",
          sqft: "455",
          status: "Off Market" as const,
          unitNumber: "108"
        },
        {
          address: "3327 NE Sandy Blvd #203, Portland, OR 97232",
          baths: "1",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/cbb9b7beae9c274ea0a856b6d1708623-p_c.jpg",
          mlsId: "",
          price: "",
          sqft: "310",
          status: "Off Market" as const,
          unitNumber: "203"
        },
        {
          address: "3327 NE Sandy Blvd #100, Portland, OR 97232",
          baths: "1",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/b1367e6dc711cb015c6255b9ccac672b-p_c.jpg",
          mlsId: "",
          price: "",
          sqft: "316",
          status: "Off Market" as const,
          unitNumber: "100"
        },
        {
          address: "3327 NE Sandy Blvd #201, Portland, OR 97232",
          baths: "1",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/de8d9059ad9ed3fb73ae3695da646a50-p_c.jpg",
          mlsId: "",
          price: "",
          sqft: "310",
          status: "Off Market" as const,
          unitNumber: "201"
        },
        {
          address: "3327 NE Sandy Blvd #107, Portland, OR 97232",
          baths: "1",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/58e51950764e80ee076c18177758f0ce-p_c.jpg",
          mlsId: "",
          price: "",
          sqft: "387",
          status: "Off Market" as const,
          unitNumber: "107"
        },
        {
          address: "3327 NE Sandy Blvd #105, Portland, OR 97232",
          baths: "1",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/75d3ca1b16241d4773b5fe2c8c34df11-p_c.jpg",
          mlsId: "",
          price: "",
          sqft: "249",
          status: "Off Market" as const,
          unitNumber: "105"
        },
        {
          address: "3327 NE Sandy Blvd #207, Portland, OR 97232",
          baths: "1",
          beds: "",
          imageUrl: "https://photos.zillowstatic.com/fp/f4c46b5172373871e49989660b81ff5a-p_c.jpg",
          mlsId: "",
          price: "",
          sqft: "411",
          status: "Off Market" as const,
          unitNumber: "207"
        }
      ];
    }
    
    // Prepare final property object
    const resultProperty: PropertySearchResult = {
      id: property.address.includes("1517 Levy Avenue") 
        ? `prop-palm-village` 
        : property.address.includes("20 Hoyt St")
          ? `prop-hoyt-office`
          : property.address.includes("3327 NE Sandy Boulevard")
            ? `prop-sandy-portfolio`
            : `prop-${index + 1}`,
      address,
      city,
      state,
      zipCode,
      price,
      propertyType,
      bedrooms,
      bathrooms,
      squareFeet: property.squareFeet,
      yearBuilt: parseYearBuilt(property.yearBuilt),
      yearRenovated: parseYearRenovated(property.yearBuilt),
      description: propertyDescriptions[index % propertyDescriptions.length],
      features: features,
      imageUrls: imageUrls,
      virtualTourUrl: Math.random() > 0.5 ? `https://my.matterport.com/show/?m=sample${index}` : undefined,
      listingDate: listingDate.toISOString(),
      source: 'property',
      zoning: property.zoning,
      buildingClass: property.buildingClass as 'Class A' | 'Class B' | 'Class C',
      stories: property.stories,
      numberOfUnits: property.numberOfUnits,
      unitBreakout: property.unitBreakout,
      percentOccupied: parsePercentOccupied(property.percentOccupied),
      averageRentPerUnit: parseAverageRent(property.averageRentPerUnit),
      lotSize: property.lotSize,
      comps: comps
    };
    
    // Add additional metadata for display purposes (not part of the PropertySearchResult type)
    if (property.address.includes("1517 Levy Avenue")) {
      // Add this data as a separate object since it's not part of the type
      const palmVillageMetadata = {
        neighborhood: 'Providence',
        schools: [
          { name: 'Florida A&M University', distance: 1.3, driveTime: 3 },
          { name: 'Florida State University', distance: 1.7, driveTime: 5 },
          { name: 'Tallahassee Community College', distance: 3.7, driveTime: 9 }
        ],
        transportation: [
          { name: 'Tallahassee International Airport (TLH)', distance: 4.9, driveTime: 10 }
        ],
        walkScore: 10,
        transitScore: 32,
        bikeScore: 42,
        soundScore: 80,
        leaseOptions: ['12 Months', '6 Months', 'Month to Month'],
        applicationFee: 25,
        securityDeposit: 500,
        annualLeaseRate: 575,
        sixMonthLeaseRate: 600,
        monthToMonthRate: 650
      };
      
      // Store this metadata for later use (but don't include it in the property result)
      console.log('Palm Village additional metadata:', palmVillageMetadata);
    }
    
    // Add Hoyt St metadata
    if (property.address.includes("20 Hoyt St")) {
      const hoytStMetadata = {
        buildingType: 'Office',
        yearBuilt: 1954,
        buildingHeight: '2 Stories',
        buildingSize: '6,070 SF',
        buildingClass: 'C',
        typicalFloorSize: '3,035 SF',
        unfinishedCeilingHeight: "10'",
        listingId: '24684705',
        dateOnMarket: '12/17/2021',
        transportation: {
          transit: [
            { name: 'Warren Street Newark Light Rail', walkTime: 4, distance: 0.2 },
            { name: 'Norfolk Street Newark Light Rail', walkTime: 4, distance: 0.2 },
            { name: 'Washington Park Newark Light Rail', walkTime: 11, distance: 0.6 },
            { name: 'Newark-Broad Street Newark Light Rail', walkTime: 12, distance: 0.8 },
            { name: 'Washington Street Newark Light Rail', walkTime: 12, distance: 0.7 }
          ],
          commuterRail: [
            { name: 'Newark Broad Street NJ Transit', walkTime: 13, distance: 0.8 },
            { name: 'Newark Penn Station Newark Light Rail', driveTime: 2, distance: 1.3 },
            { name: 'Harrison Port Authority Trans-Hudson', driveTime: 4, distance: 2.2 },
            { name: 'East Orange NJ Transit Commuter Rail', driveTime: 3, distance: 2.2 },
            { name: 'Brick Church NJ Transit Commuter Rail', driveTime: 5, distance: 2.7 }
          ],
          airport: [
            { name: 'Newark Liberty International (EWR)', driveTime: 10, distance: 6.0 },
            { name: 'Laguardia (LGA)', driveTime: 41, distance: 27.3 }
          ]
        },
        similarProperties: [
          {
            address: '211 Warren St, Newark, NJ 07103',
            yearBuilt: 2002,
            space: '609 - 5,305 SF Office Spaces',
            price: '$27.00 - $40.00 SF/YR'
          },
          {
            address: '569-571 Martin Luther King Jr Blvd, Newark, NJ 07102',
            yearBuilt: 1910,
            space: '100 - 400 SF Office Spaces',
            price: '$49.41 - $72.00 SF/YR'
          },
          {
            address: '601 Dr Martin Luther King Jr Blvd, Newark, NJ 07102',
            yearBuilt: 1889,
            space: '175 - 5,946 SF Office Spaces'
          },
          {
            address: '200 Washington St, Newark, NJ 07102',
            yearBuilt: 1989,
            space: '3,000 - 30,873 SF Spaces',
            uses: 'Multiple Space Uses'
          },
          {
            address: '68-70 Clinton Ave, Newark, NJ 07114',
            yearBuilt: 1865,
            space: '765 SF Office Space',
            price: '$28.24 SF/YR'
          },
          {
            address: '45 Academy St, Newark, NJ 07102',
            yearBuilt: 1887,
            space: '1,250 - 4,750 SF Office Spaces',
            availability: '3 Spaces Available Now'
          },
          {
            address: '100 Washington St, Newark, NJ 07102',
            yearBuilt: 1985,
            space: '37,810 SF Office Space'
          },
          {
            address: '570 Broad St, Newark, NJ 07102',
            yearBuilt: 1962,
            rating: '4 Star',
            space: '7,240 SF Office Space',
            price: '$18.00 SF/YR'
          }
        ]
      };
      
      console.log('Hoyt St additional metadata:', hoytStMetadata);
    }
    
    // Add Sandy Blvd metadata
    if (property.address.includes("3327 NE Sandy Boulevard")) {
      const sandyBlvdMetadata = {
        parcelNumber: 'R203040',
        cooling: ['Wall Unit(s)', 'Air Conditioning'],
        appliances: ['Gas Water Heater'],
        totalStructureArea: 18000,
        totalInteriorLivableArea: 18000,
        lotFeatures: ['SqFt 5000 to 6999'],
        homeType: 'MultiFamily',
        roof: 'Flat',
        condition: 'Restored',
        utilities: {
          sewer: 'Public Sewer',
          water: 'Public'
        },
        communityFeatures: ['Front Yard Landscaping'],
        security: ['Entry'],
        region: 'Portland',
        pricePerSqFt: 259,
        annualTax: 30017,
        dateOnMarket: '7/3/2024',
        listingTerms: ['Cash', 'Conventional'],
        totalActualRent: 18000,
        roadSurfaceType: 'Concrete',
        mortgageInfo: {
          principalAndInterest: 23173,
          propertyTaxes: 3693,
          homeInsurance: 1555
        },
        adjacentProperty: '3331 NE Sandy',
        netOperatingIncome: 337268,
        capRate: 7,
        offerRequirements: 'Preapproved Offers Required',
        tourAvailability: 'Exterior walk tours and common area walk throughs available'
      };
      
      console.log('Sandy Blvd additional metadata:', sandyBlvdMetadata);
    }
    
    return resultProperty;
  });
};

// Create additional sample properties to have a larger dataset
const createAdditionalProperties = (): PropertySearchResult[] => {
  const additionalProperties: Partial<PropertySearchResult>[] = [
    {
      address: "350 W Broadway",
      city: "New York",
      state: "NY",
      zipCode: "10013",
      price: 7500000,
      propertyType: "commercial",
      squareFeet: 12000,
      yearBuilt: 1985,
      description: "Prime SoHo retail space with excellent foot traffic and visibility.",
      zoning: "Commercial",
      buildingClass: "Class A",
      stories: 4,
      percentOccupied: 95
    },
    {
      address: "421 Pacific Ave",
      city: "San Francisco",
      state: "CA", 
      zipCode: "94133",
      price: 4200000,
      propertyType: "multifamily",
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 8500,
      yearBuilt: 1920,
      yearRenovated: 2018,
      description: "Beautifully renovated 8-unit apartment building in prime North Beach location.",
      zoning: "Residential multifamily",
      buildingClass: "Class B",
      stories: 3,
      numberOfUnits: 8,
      unitBreakout: "8 units of 2 bedrooms, 2 bathrooms each",
      percentOccupied: 100,
      averageRentPerUnit: 3200
    },
    {
      address: "1580 Industrial Way",
      city: "Dallas",
      state: "TX",
      zipCode: "75247",
      price: 2800000,
      propertyType: "industrial",
      squareFeet: 25000,
      yearBuilt: 2005,
      description: "Modern industrial warehouse with excellent distribution location near major highways.",
      zoning: "Industrial",
      buildingClass: "Class A",
      stories: 1,
      percentOccupied: 100
    },
    {
      address: "734 E Main St",
      city: "Phoenix",
      state: "AZ",
      zipCode: "85004",
      price: 950000,
      propertyType: "mixed-use",
      squareFeet: 4200,
      yearBuilt: 1965,
      yearRenovated: 2010,
      description: "Downtown mixed-use property with retail on ground floor and two residential units above.",
      zoning: "Mixed-use",
      buildingClass: "Class B",
      stories: 2,
      numberOfUnits: 3,
      unitBreakout: "1 commercial, 2 residential units",
      percentOccupied: 100,
      averageRentPerUnit: 2100
    }
  ];

  // Convert to PropertySearchResult objects with required fields
  return additionalProperties.map((property, index) => {
    const today = new Date();
    const randomDaysAgo = Math.floor(Math.random() * 60);
    const listingDate = new Date(today);
    listingDate.setDate(today.getDate() - randomDaysAgo);

    return {
      id: `prop-add-${index + 1}`,
      address: property.address!,
      city: property.city!,
      state: property.state!,
      zipCode: property.zipCode!,
      price: property.price!,
      propertyType: property.propertyType! as any,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFeet: property.squareFeet,
      yearBuilt: property.yearBuilt,
      yearRenovated: property.yearRenovated,
      description: property.description!,
      features: createSampleFeatures(property.propertyType!),
      imageUrls: getPlaceholderImages(4, property.propertyType),
      virtualTourUrl: Math.random() > 0.7 ? `https://my.matterport.com/show/?m=additional${index}` : undefined,
      listingDate: listingDate.toISOString(),
      source: 'property',
      zoning: property.zoning,
      buildingClass: property.buildingClass as any,
      stories: property.stories,
      numberOfUnits: property.numberOfUnits,
      unitBreakout: property.unitBreakout,
      percentOccupied: property.percentOccupied,
      averageRentPerUnit: property.averageRentPerUnit,
      lotSize: property.lotSize
    };
  });
};

// Combined property database
export const mockProperties: PropertySearchResult[] = [
  ...createPropertiesFromCSV(),
  ...createAdditionalProperties()
]; 