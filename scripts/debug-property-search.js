// This is a simple script to debug the property search functionality
// Run it with: node scripts/debug-property-search.js

const fs = require('fs');
const path = require('path');

// Check if logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create empty log file if it doesn't exist
const logPath = path.join(logDir, 'propertysearch.logs');
fs.writeFileSync(logPath, '--- Property Search Debug Log ---\n\n');

// Function to append to log file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logPath, logMessage);
}

// Import the mock data (We'll have to parse it manually since this is a standalone script)
log('Loading mock property data module...');

// Read the mock property data file content
const mockDataPath = path.join(process.cwd(), 'lib', 'mock-property-data.tsx');
if (!fs.existsSync(mockDataPath)) {
  log('ERROR: Mock property data file not found at ' + mockDataPath);
  process.exit(1);
}

const fileContent = fs.readFileSync(mockDataPath, 'utf8');
log('Mock data file loaded, analyzing...');

// Count properties in the mock data
const propertyCreateMatches = fileContent.match(/createPropertiesFromCSV\(\)/);
const additionalPropertiesMatches = fileContent.match(/createAdditionalProperties\(\)/);

if (propertyCreateMatches && additionalPropertiesMatches) {
  log('Found both property creation functions in the mock data');
} else {
  log('WARNING: Could not verify property creation functions in the mock data');
}

// Check for multifamily properties
const multifamilyMatches = fileContent.match(/propertyType(.*?)multifamily/g);
if (multifamilyMatches) {
  log(`Found ${multifamilyMatches.length} mentions of multifamily properties in the mock data`);
} else {
  log('WARNING: No mentions of multifamily properties found in the mock data');
}

// Check for Arizona locations
const arizonaMatches = fileContent.match(/(AZ|Arizona)/g);
if (arizonaMatches) {
  log(`Found ${arizonaMatches.length} mentions of Arizona in the mock data`);
} else {
  log('WARNING: No mentions of Arizona found in the mock data');
}

// Check for Phoenix locations
const phoenixMatches = fileContent.match(/Phoenix/g);
if (phoenixMatches) {
  log(`Found ${phoenixMatches.length} mentions of Phoenix in the mock data`);
} else {
  log('WARNING: No mentions of Phoenix found in the mock data');
}

// Extract property types used in the mock data
const propertyTypes = new Set();
const propertyTypeRegex = /propertyType:\s*['"](\w+)['"]/g;
let match;
while ((match = propertyTypeRegex.exec(fileContent)) !== null) {
  propertyTypes.add(match[1]);
}

log(`Property types found in the mock data: ${Array.from(propertyTypes).join(', ')}`);

// List all properties defined in the mock data
let propertyIdsCount = 0;
const idRegex = /id:\s*[`'"](prop-[\w-]+)[`'"]/g;
while ((match = idRegex.exec(fileContent)) !== null) {
  propertyIdsCount++;
}

log(`Found ${propertyIdsCount} property IDs defined in the mock data`);

// Check for any property matching Arizona
log('\nSearching for issues with Arizona property search...');
const csvSection = fileContent.match(/const csvProperties = \[\s*({[\s\S]*?})\s*\]/);
if (csvSection) {
  const addressesInAZ = csvSection[0].match(/address:.*AZ/g);
  if (addressesInAZ) {
    log(`Found ${addressesInAZ.length} properties with AZ in their address in the CSV data:`);
    addressesInAZ.forEach(addr => {
      log(`  - ${addr.trim()}`);
    });
  } else {
    log('WARNING: No properties with AZ in their address found in the CSV data');
  }
}

// Check for lowercase/uppercase issues with property types
log('\nChecking for case sensitivity issues in property types...');
const propertyTypeAssignments = fileContent.match(/propertyType.*?['"](.*?)['"],?$/gm);
if (propertyTypeAssignments) {
  log('Property type assignments found:');
  const typeSet = new Set();
  propertyTypeAssignments.forEach(type => {
    const value = type.match(/['"](.*?)['"]/)[1];
    typeSet.add(value);
    log(`  - ${value}`);
  });
  
  log(`Total unique property type values: ${typeSet.size}`);
  
  // Check for multifamily vs Multifamily
  if (typeSet.has('multifamily') && typeSet.has('Multifamily')) {
    log('WARNING: Case inconsistency detected - both "multifamily" and "Multifamily" are used');
  }
}

log('\nCheck if any values are cast to lowercase...');
const lowerCaseConversions = fileContent.match(/\.toLowerCase\(\)/g);
if (lowerCaseConversions) {
  log(`Found ${lowerCaseConversions.length} toLowerCase() operations`);
} else {
  log('WARNING: No toLowerCase() operations found, which might cause case-sensitivity issues');
}

log('\nDebug script complete. Check the logs for issues.'); 