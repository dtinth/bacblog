import fs from "fs";
import OpenAI from "openai";
const openai = new OpenAI();

async function generateIntro(title) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              'Write an introduction paragraph of an article. The title is "' +
              title +
              '". DO NOT use aposthrophes (\') or quotes (") or slashes or hyphens in the article. No new lines.',
          },
        ],
      },
    ],
    temperature: 1,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "intro_schema",
        strict: true,
        schema: {
          type: "object",
          properties: {
            intro: {
              type: "string",
              description: "An article introduction string.",
            },
          },
          required: ["intro"],
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(response.choices[0].message.content)
    .intro.trim()
    .replace(/-/g, " ")
    .trim();
}

import crypto from "crypto";
const lines = fs
  .readFileSync("_scripts/list.tsv", "utf8")
  .split("\n")
  .map((x) => x.trim())
  .filter((x) => x);
let ok = true;
for (const title of lines) {
  const hash = crypto
    .createHash("sha256")
    .update(title)
    .digest("hex")
    .slice(0, 32);
  const file = `_posts/2023-11-20-${hash}.markdown`;
  if (fs.existsSync(file)) {
    const intro = fs
      .readFileSync(file, "utf8")
      .split("---")
      .pop()
      .trim()
      .split(" ").length;
    console.log([title, intro].join("\t"));
    continue;
  }
  console.log(file, title);
  const intro = await generateIntro(title);
  const wordCount1 = intro.trim().split(" ").length;
  const wordCount2 = [...intro.matchAll(/\w+/g)].length;
  console.log(intro);
  if (wordCount1 !== wordCount2) {
    ok = false;
    continue;
  }
  fs.writeFileSync(
    file,
    `---
layout: post
title: "${title}"
date: 2023-11-20
---

${intro}
`
  );
  console.log();
}

if (!ok) {
  console.error("Word count mismatch");
  process.exit(1);
}
