import puppeteer from "puppeteer";
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Index } from '@upstash/vector';
import { v4 as uuidv4 } from 'uuid';

// const X_RAPIDAPI_KEY = import.meta.env.VITE_X_RAPIDAPI_KEY
// const X_RAPIDAPI_HOST = import.meta.env.VITE_X_RAPIDAPI_HOST
// const HUGGING_FACE_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY

// Scrapes my portfolio website to get information about me
export async function scrapePortfolio(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2" });

  const data = await page.evaluate(() => {
    const getText = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.innerText.trim() : null;
    };

    const getAttr = (selector, attr) => {
      const el = document.querySelector(selector);
      return el ? el.getAttribute(attr) : null;
    };

    const getAll = (selector, mapFn) => {
      return Array.from(document.querySelectorAll(selector)).map(mapFn);
    };

    const name = getText("h1.title");
    const title = getText(".section__text__p2");

    const aboutParagraphs = getAll("#about .text-container p", el => el.innerText.trim());

    const skills = getAll(".skill-container", el => ({
      skill: el.querySelector(".skill-text")?.innerText.trim(),
      level: el.querySelector(".skill-subtext")?.innerText.trim(),
    }));

    const projects = getAll(".color-container", el => ({
      title: el.querySelector(".project-title")?.innerText.trim(),
      description: el.querySelector(".project-text")?.innerText.trim(),
      github: Array.from(el.querySelectorAll("button"))
        .find(btn => btn.innerText.toLowerCase().includes("github"))?.onclick?.toString().match(/'(.*?)'/)?.[1] || null,
      live: Array.from(el.querySelectorAll("button"))
        .find(btn => btn.innerText.toLowerCase().includes("demo"))?.onclick?.toString().match(/'(.*?)'/)?.[1] || null,
    }));

    const email = getAttr("a[href^='mailto:']", "href")?.replace("mailto:", "");
    const linkedin = getAttr("a[href*='linkedin.com']", "href");

    return {
      name,
      title,
      about: aboutParagraphs,
      skills,
      projects,
      contact: {
        email,
        linkedin
      }
    };
  });

  await browser.close();
  return data;
}

export function formatToChunk(data) {
  const chunks = [];

  // Bio Section
  chunks.push(`Name: ${data.name}`);
  chunks.push(`Title: ${data.title}`);
  chunks.push(`About:\n${data.about.join("\n\n")}`);

  // Skills Section
  const skillList = data.skills.map(s => `- ${s.skill}: ${s.level}`).join("\n");
  chunks.push(`Skills:\n${skillList}`);

  // Projects Section
  data.projects.forEach((project, i) => {
    const projectDetails = [
      `Project ${i + 1}: ${project.title}`,
      `Description: ${project.description}`,
      project.github ? `GitHub: ${project.github}` : null,
      project.live ? `Live Link: ${project.live}` : null
    ].filter(Boolean).join("\n");
    chunks.push(projectDetails);
  });

  // Contact
  chunks.push(`Contact:\nEmail: ${data.contact.email}\nLinkedIn: ${data.contact.linkedin}`);

  // Return as array of chunkable strings
  return chunks;
}

export function extractLinkedInInfo(data) {
  const lines = [];

  // Basic Info
  lines.push(`Name: ${data.firstName.trim()} ${data.lastName.trim()}`);
  lines.push(`Headline: ${data.headline}`);
  lines.push(`Location: ${data.geo?.full}`);
  lines.push(`Summary: ${data.summary}`);

  // Education
  if (data.educations?.length) {
    lines.push('\nEducation:');
    data.educations.forEach((edu) => {
      lines.push(`- ${edu.schoolName} (${edu.start?.year}–${edu.end?.year})`);
      if (edu.degree) lines.push(`  Degree: ${edu.degree}`);
      if (edu.fieldOfStudy) lines.push(`  Field: ${edu.fieldOfStudy}`);
    });
  }

  // Experience / Positions
  if (data.fullPositions?.length) {
    lines.push('\nExperience:');
    data.fullPositions.forEach((pos) => {
      const start = `${pos.start?.month || ''}/${pos.start?.year || ''}`;
      const end = pos.end?.year ? `${pos.end?.month || ''}/${pos.end?.year}` : 'Present';
      lines.push(`- ${pos.title} at ${pos.companyName} (${start} - ${end})`);
      if (pos.description) lines.push(`  ${pos.description}`);
    });
  }

  // Skills
  if (data.skills?.length) {
    lines.push('\nSkills:');
    data.skills.forEach(skill => lines.push(`- ${skill.name}`));
  }

  // Certifications
  if (data.certifications?.length) {
    lines.push('\nCertifications:');
    data.certifications.forEach(cert => {
      lines.push(`- ${cert.name}`);
      if (cert.authority) lines.push(`  Issued by: ${cert.authority}`);
      if (cert.start?.year) lines.push(`  Year: ${cert.start.year}`);
    });
  }

  return lines;
}

function removeNonStandardWhitespace(text) {
  // Replace non-breaking spaces (both HTML entity and Unicode)
  let cleanedText = text.replace(/&nbsp;/g, ' ');
  cleanedText = cleanedText.replace(/\u00A0/g, ' ');

  // Remove various other Unicode whitespace characters (you might need to add more)
  cleanedText = cleanedText.replace(/[\u2000-\u200A\u202F\u205F\u3000]/g, ' '); // Various space types
  cleanedText = cleanedText.replace(/\uFEFF/g, ''); // Zero Width No-Break Space (BOM)

  // Remove control characters (except standard whitespace: \n, \r, \t)
  cleanedText = cleanedText.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  return cleanedText;
}

export function processYourJsonFile(data) {
  try {
    const cleanedData = removeNonStandardWhitespace(data);
    const jsonData = JSON.parse(cleanedData);
    return jsonData
    // Now you can work with jsonData in your project
  } catch (error) {
    console.error('Error processing JSON file:', error);
  }
}

export async function scrapeAndUpdateDb(){
  // Scrapes portfolio website
  const data = await scrapePortfolio("https://the-jola-amodu.vercel.app/")
  const chunksArray = formatToChunk(data)

  // Scrapes my LinkedIn to get more information about me

  const response = await fetch('https://linkedin-data-api.p.rapidapi.com/?username=jolaoluwa-amodu', {method: 'GET', headers: {'x-rapidapi-key': X_RAPIDAPI_KEY, 'x-rapidapi-host': X_RAPIDAPI_HOST}});
  const result = await response.text();
  const cleanedJson = processYourJsonFile(result);
  const extractedArray = extractLinkedInInfo(cleanedJson)

  const joinedText = chunksArray.join("\n\n") + "\n\n--\n\n" + extractedArray.join("\n\n")

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const index = new Index({
    url: UPSTASH_VECTOR_REST_URL,
    token: UPSTASH_VECTOR_REST_TOKEN,
  });
  const docs = await splitter.createDocuments([joinedText]);

  const embedder = new HuggingFaceInferenceEmbeddings({
    apiKey: HUGGING_FACE_API_KEY,
    model: 'sentence-transformers/e5-base-v2', // Or any other
  });

  for (const doc of docs) {
    const embedding = await embedder.embedQuery(doc.pageContent);
    const id = uuidv4();
    await index.upsert({
      indexName: 'profile-vector-storage',
      id,
      vector: embedding,
      metadata: { text: doc.pageContent, timestamp: new Date().toISOString() },
    });
  }
}