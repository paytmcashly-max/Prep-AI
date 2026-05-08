import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const openAiSecretName = `OPENAI_${"API_KEY"}`;

const excludedDirs = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".expo",
  ".gradle",
  ".kotlin",
  ".cxx"
]);

const excludedFiles = new Set(["package-lock.json"]);
const mobilePaths = [
  "App.js",
  "app.config.js",
  "app.json",
  "babel.config.js",
  "index.js",
  "metro.config.js",
  "src"
];

const checks = [
  {
    title: "GROQ_API_KEY referenced in mobile app files",
    pattern: /GROQ_API_KEY/,
    paths: mobilePaths
  },
  {
    title: "OpenAI API key referenced in repository files",
    pattern: new RegExp(openAiSecretName),
    paths: ["."]
  },
  {
    title: "FIREBASE_PRIVATE_KEY referenced in mobile app files",
    pattern: /FIREBASE_PRIVATE_KEY/,
    paths: mobilePaths
  },
  {
    title: "Hardcoded OpenAI-style sk- key found",
    pattern: /sk-[A-Za-z0-9_-]{20,}/,
    paths: ["."]
  },
  {
    title: "Authorization header appears to be logged",
    pattern:
      /console\.(log|info|warn|error).*([Aa]uthorization)|([Aa]uthorization).*console\.(log|info|warn|error)/,
    paths: ["."]
  },
  {
    title: "Resume text appears to be logged",
    pattern: /console\.(log|info|warn|error).*(resumeText|resume text|resume_text)/,
    paths: ["."]
  },
  {
    title: "User answer text appears to be logged",
    pattern: /console\.(log|info|warn|error).*(userAnswer|interviewAnswer|answerText|answer text)/,
    paths: ["."]
  },
  {
    title: "Firebase rules contain public read/write access",
    pattern: /allow\s+read,\s*write:\s*if\s+true/,
    paths: ["firestore.rules", "storage.rules"]
  }
];

function shouldSkip(entryPath) {
  const name = path.basename(entryPath);
  return excludedDirs.has(name) || excludedFiles.has(name);
}

function collectFiles(startPath) {
  const fullPath = path.resolve(rootDir, startPath);
  if (!fs.existsSync(fullPath) || shouldSkip(fullPath)) {
    return [];
  }

  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    return [fullPath];
  }

  const files = [];
  for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
    const entryPath = path.join(fullPath, entry.name);
    if (shouldSkip(entryPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...collectFiles(path.relative(rootDir, entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

function readText(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.includes(0)) {
      return null;
    }
    return buffer.toString("utf8");
  } catch {
    return null;
  }
}

let failures = 0;

for (const check of checks) {
  const matches = [];
  for (const scanPath of check.paths) {
    for (const filePath of collectFiles(scanPath)) {
      const text = readText(filePath);
      if (text && check.pattern.test(text)) {
        matches.push(path.relative(rootDir, filePath));
      }
    }
  }

  if (matches.length > 0) {
    failures += 1;
    console.error(`\n[FAIL] ${check.title}`);
    for (const match of [...new Set(matches)]) {
      console.error(`  - ${match}`);
    }
  }
}

if (failures > 0) {
  console.error(`\nSecurity audit failed with ${failures} issue group(s).`);
  process.exit(1);
}

console.log("Security audit passed.");
