#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".htm"]);
const IGNORES = new Set(["node_modules", ".git"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (IGNORES.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (e.isFile()) {
      if (EXTS.has(path.extname(e.name))) files.push(full);
    }
  }
  return files;
}

function stripCommentsJSLike(text) {
  let out = "";
  const len = text.length;
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inRegex = false; 
  let inLineComment = false;
  let inBlockComment = false;
  let prev = "";
  let templateDepth = 0;

  while (i < len) {
    const ch = text[i];
    const next = i + 1 < len ? text[i + 1] : "";

    
    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        out += ch; 
      }
      i++;
      continue;
    }

    
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        
        
        inBlockComment = false;
        
        
        
        i += 2;
        continue;
      }
      
      i++;
      continue;
    }

    
    if (!inSingle && !inDouble && !inTemplate) {
      
      if (ch === "/" && next === "/") {
        inLineComment = true;
        i += 2;
        continue;
      }
      
      if (ch === "/" && next === "*") {
        
        let j = i + 2;
        let newlines = 0;
        while (j < len) {
          if (text[j] === '\n') newlines++;
          if (text[j] === '*' && j + 1 < len && text[j + 1] === '/') break;
          j++;
        }
        
        out += '\n'.repeat(newlines);
        i = j + 2; 
        continue;
      }
      
      if (ch === "'") {
        inSingle = true;
        out += ch;
        i++;
        continue;
      }
      if (ch === '"') {
        inDouble = true;
        out += ch;
        i++;
        continue;
      }
      if (ch === '`') {
        inTemplate = true;
        templateDepth = 0;
        out += ch;
        i++;
        continue;
      }
      
      out += ch;
      i++;
      continue;
    }

    
    if (inSingle) {
      out += ch;
      if (ch === "\\" && i + 1 < len) {
        out += text[i + 1];
        i += 2;
        continue;
      }
      if (ch === "'") inSingle = false;
      i++;
      continue;
    }

    
    if (inDouble) {
      out += ch;
      if (ch === "\\" && i + 1 < len) {
        out += text[i + 1];
        i += 2;
        continue;
      }
      if (ch === '"') inDouble = false;
      i++;
      continue;
    }

    
    if (inTemplate) {
      out += ch;
      if (ch === "\\" && i + 1 < len) {
        out += text[i + 1];
        i += 2;
        continue;
      }
      if (ch === "`" && templateDepth === 0) {
        inTemplate = false;
        i++;
        continue;
      }
      
      if (ch === "$" && next === "{" ) {
        templateDepth++;
        out += next; 
        i += 2;
        continue;
      }
      if (ch === "}" && templateDepth > 0) {
        templateDepth--;
        i++;
        continue;
      }
      i++;
      continue;
    }
  }

  return out;
}

function stripCommentsCSS(text) {
  
  let out = "";
  let i = 0;
  const len = text.length;
  while (i < len) {
    const ch = text[i];
    const next = i + 1 < len ? text[i + 1] : "";
    if (ch === "/" && next === "*") {
      let j = i + 2;
      let newlines = 0;
      while (j < len) {
        if (text[j] === '\n') newlines++;
        if (text[j] === '*' && j + 1 < len && text[j + 1] === '/') break;
        j++;
      }
      out += '\n'.repeat(newlines);
      i = j + 2;
      continue;
    }
    
    if (ch === "/" && next === "/") {
      let j = i + 2;
      while (j < len && text[j] !== '\n') j++;
      if (j < len && text[j] === '\n') out += '\n';
      i = j + 1;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function stripCommentsHTML(text) {
  let out = "";
  let i = 0;
  const len = text.length;
  while (i < len) {
    const ch = text[i];
    if (ch === "<" && text.slice(i, i + 4) === "<!--") {
      let j = i + 4;
      let newlines = 0;
      while (j < len && text.slice(j, j + 3) !== "-->") {
        if (text[j] === '\n') newlines++;
        j++;
      }
      out += '\n'.repeat(newlines);
      i = j + 3;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

(async () => {
  const files = await walk(ROOT);
  console.log(`Found ${files.length} files to process`);
  for (const file of files) {
    try {
      const rel = path.relative(ROOT, file);
      const ext = path.extname(file).toLowerCase();
      let text = await fs.readFile(file, "utf8");
      let newText = text;
      if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext)) {
        newText = stripCommentsJSLike(text);
      } else if ([".css", ".scss"].includes(ext)) {
        newText = stripCommentsCSS(text);
      } else if (ext === ".htm") {
        newText = stripCommentsHTML(text);
      }
      if (newText !== text) {
        await fs.writeFile(file, newText, "utf8");
        console.log(`Stripped comments: ${rel}`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
  console.log("Done.");
})();
