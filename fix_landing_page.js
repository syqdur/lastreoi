const fs = require('fs');

let content = fs.readFileSync('client/src/components/LandingPage.tsx', 'utf8');

// Fix broken conditional expressions by replacing with light mode styles
content = content.replace(
  /false\s*\?\s*['"][^'"]*['"]\s*:\s*['"]([^'"]*)['"]/g,
  "'$1'"
);

content = content.replace(
  /\$\{[^}]*false[^}]*\}/g,
  "'bg-white text-gray-900'"
);

// Fix the PricingSection prop
content = content.replace('isDarkMode={false}', '');

fs.writeFileSync('client/src/components/LandingPage.tsx', content);
console.log('Fixed LandingPage component');
