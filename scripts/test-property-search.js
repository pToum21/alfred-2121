// Test script for property search functionality
// Run it with: node scripts/test-property-search.js

const fs = require('fs');
const path = require('path');

// Create a log directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logPath = path.join(logDir, 'property-search-test.logs');
fs.writeFileSync(logPath, '--- Property Search Test Log ---\n\n');

// Function to append to log file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logPath, logMessage);
}

// Load the mock property data
const mockDataPath = path.join(process.cwd(), 'lib', 'mock-property-data.tsx');
if (!fs.existsSync(mockDataPath)) {
  log('ERROR: Mock property data file not found');
  process.exit(1);
}

const fileContent = fs.readFileSync(mockDataPath, 'utf8');

// Extract properties from the file content
log('Extracting properties from mock data...');

// Parse properties from the file content (simplified version)
const properties = [];

// Helper to extract property objects
const extractProperties = (content) => {
  const regex = /{\s*id:\s*['"](prop[^'"]*)['"]/g;
  let match;
  const propertyIds = [];
  
  while ((match = regex.exec(content)) !== null) {
    propertyIds.push(match[1]);
  }
  
  return propertyIds;
};

const propertyIds = extractProperties(fileContent);
log(`Found ${propertyIds.length} properties in the mock data`);

// Mock implementation of matchesLocation function (similar to what we have in the TypeScript file)
function matchesLocation(property, location) {
  if (!location) return true;
  const locationLower = location.toLowerCase();
  
  // Map of state abbreviations to full names for matching
  const stateAbbreviations = {
    'az': 'arizona',
    'fl': 'florida',
    'ca': 'california',
    'ny': 'new york',
    'nj': 'new jersey',
    'or': 'oregon',
    'tx': 'texas',
  };
  
  const stateAbbr = property.state.toLowerCase();
  const fullStateName = stateAbbreviations[stateAbbr] || '';
  
  // Safe property access with null checks
  const cityMatch = property.city ? property.city.toLowerCase().includes(locationLower) : false;
  const stateAbbrMatch = stateAbbr === locationLower;
  const stateNameMatch = fullStateName === locationLower;
  const zipMatch = property.zipCode ? property.zipCode.toLowerCase().includes(locationLower) : false;
  const addressMatch = property.address ? property.address.toLowerCase().includes(locationLower) : false;
  
  return cityMatch || stateAbbrMatch || stateNameMatch || zipMatch || addressMatch;
}

// Test matching for all AZ properties
log('\nTesting Arizona location matching:');

// Extract properties with state "AZ" or city "Phoenix"
const azRegex = /state:\s*["']AZ["']/g;
const phoenixRegex = /city:\s*["']Phoenix["']/g;

// Count matches
let azMatches = 0;
let match;
while ((match = azRegex.exec(fileContent)) !== null) {
  azMatches++;
}

let phoenixMatches = 0;
while ((match = phoenixRegex.exec(fileContent)) !== null) {
  phoenixMatches++;
}

log(`Found ${azMatches} properties with state "AZ" in the mock data`);
log(`Found ${phoenixMatches} properties with city "Phoenix" in the mock data`);

// Test our matching function with a few test cases
log('\nTesting location matching function:');

// Create a few test properties
const testProperties = [
  {
    id: 'test1',
    address: '4224 E. Canyon Trail',
    city: 'Cottonwood',
    state: 'AZ',
    zipCode: '86326',
    propertyType: 'multifamily'
  },
  {
    id: 'test2',
    address: '734 E Main St',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85004',
    propertyType: 'mixed-use'
  },
  {
    id: 'test3',
    address: '1517 Levy Avenue',
    city: 'Tallahassee',
    state: 'FL',
    zipCode: '32310',
    propertyType: 'multifamily'
  }
];

// Test all combinations
const testLocations = ['Arizona', 'Phoenix', 'AZ', 'Florida', 'New York'];
testLocations.forEach(location => {
  log(`\nTesting location: "${location}"`);
  testProperties.forEach(property => {
    const matches = matchesLocation(property, location);
    log(`  Property ${property.id} (${property.city}, ${property.state}): ${matches ? 'MATCH' : 'NO MATCH'}`);
  });
});

// Test property type matching
log('\nTesting property type matching:');
const propertyTypes = ['multifamily', 'Multifamily', 'mixed-use', 'commercial'];

propertyTypes.forEach(type => {
  log(`\nTesting property type: "${type}"`);
  testProperties.forEach(property => {
    const matches = property.propertyType.toLowerCase() === type.toLowerCase();
    log(`  Property ${property.id} (${property.propertyType}): ${matches ? 'MATCH' : 'NO MATCH'}`);
  });
});

log('\nTest complete. Check the logs for results.'); 