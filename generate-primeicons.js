const fs = require("fs");
const path = require("path");

const fontsDir = path.join(__dirname, "node_modules", "primeicons", "fonts");
const cssPath = path.join(
  __dirname,
  "node_modules",
  "primeicons",
  "primeicons.css",
);
const outDir = path.join(__dirname, "src", "common", "styles");
const outPath = path.join(outDir, "_primeicons.scss");

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read WOFF2 font and encode to Base64
const woff2Path = path.join(fontsDir, "primeicons.woff2");
const woff2Buffer = fs.readFileSync(woff2Path);
const woff2Base64 = woff2Buffer.toString("base64");

// Read original CSS
let cssContent = fs.readFileSync(cssPath, "utf8");

// Replace the @font-face block with our embedded one
const fontFaceRegex = /@font-face\s*{[^}]*}/;
const newFontFace = `@font-face {
    font-family: 'primeicons';
    font-display: block;
    src: url(data:font/woff2;charset=utf-8;base64,${woff2Base64}) format('woff2');
    font-weight: normal;
    font-style: normal;
}`;

cssContent = cssContent.replace(fontFaceRegex, newFontFace);

// Write the new SCSS file
fs.writeFileSync(outPath, cssContent, "utf8");

console.log(
  "Successfully generated _primeicons.scss with Base64 embedded fonts.",
);
