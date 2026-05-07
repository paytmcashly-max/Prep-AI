export const questionPrompt = (jobRole, category, difficulty, company) => `
Generate a ${difficulty} level ${category} interview question
for a ${jobRole} position${company ? ` at ${company}` : ""}.
Return ONLY the question, nothing else.
`;

export const evaluatePrompt = (question, answer, jobRole) => `
You are an expert ${jobRole} interviewer.
Evaluate this interview answer:

Question: ${question}
Candidate's Answer: ${answer}

Respond ONLY in this JSON format:
{
  "score": <number 1-10>,
  "strengths": ["point1", "point2"],
  "improvements": ["point1", "point2"],
  "idealAnswer": "<ideal answer in 3-4 sentences>"
}
`;

export const resumePrompt = (resumeText, jobRole) => `
Analyze this resume for a ${jobRole} position.
Resume:
${resumeText}

Respond ONLY in this JSON format:
{
  "atsScore": <number 0-100>,
  "missingKeywords": ["keyword1", "keyword2"],
  "grammarIssues": ["issue1", "issue2"],
  "sectionFeedback": {
    "summary": "<feedback>",
    "experience": "<feedback>",
    "skills": "<feedback>",
    "education": "<feedback>"
  }
}
`;

export const tipPrompt = (jobRole) => `
Give ONE actionable interview tip for a ${jobRole} candidate in exactly 2 sentences.
Make it specific, practical, and motivating.
`;
