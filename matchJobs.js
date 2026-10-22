
const mammoth = require("mammoth");

const apiKey = process.env.REMOTE_ROCKETSHIP_API_KEY;

const resumeFile =
  "Romero_Micheaux_Updated_AI_Operations_Resume Chatgpt.docx";

// Four roles we are targeting RIGHT NOW
const searches = [
  { lane: "AI", keyword: "AI evaluator" },
  { lane: "AI", keyword: "AI response quality rater" },
  { lane: "AI", keyword: "AI content reviewer" },
  { lane: "AI", keyword: "AI data annotation" }
];

const MAX_RESULTS = 10;

// Skills supported by the resume
const skills = [
  "ai evaluation",
  "ai evaluator",
  "ai training",
  "ai trainer",
  "llm evaluation",
  "model evaluation",
  "response evaluation",
  "content review",
  "content grading",
  "quality assurance",
  "annotation",
  "data annotation",
  "prompt engineering",
  "generative ai",
  "llm",
  "rubric",
  "guidelines",
  "instruction following",
  "accuracy",
  "aws",
  "amazon bedrock",
  "node.js",
  "javascript",
  "incident management",
  "servicenow"
];

// Jobs requiring unrelated professional qualifications
const excludedTitlePatterns = [
  /\bphysician\b/i,
  /\bmedical doctor\b/i,
  /\bnurse\b/i,
  /\battorney\b/i,
  /\blawyer\b/i,
  /\bmechanical engineer\b/i,
  /\bcfd engineer\b/i,
  /\bcad engineer\b/i,
  /\bstructural engineer\b/i,
  /\bcivil engineer\b/i,
  /\baccount executive\b/i,
  /\bsoftware engineer\b/i,
  /\bmachine learning engineer\b/i,
  /\bdata scientist\b/i,
  /\bsecurity engineer\b/i,
  /\barchitect\b/i,
  /\bhead of\b/i,
  /\bdirector\b/i,
  /\bvice president\b/i,
  /\bvp\b/i,
  /\bprincipal\b/i,
  /\bstaff engineer\b/i,
  /\bsenior manager\b/i
];

// Specialized language requirements to review/exclude
const languagePatterns = [
  /\b(?:english\s*[-–/,]\s*)?(?:tamil|gujarati|kannada|assamese|odia|finnish|dutch|hindi|spanish|french|german|japanese|korean|mandarin|arabic)\b/i,
  /\bbilingual\b/i,
  /\bmultilingual\b/i
];

const relevantTitlePatterns = [
  /\bai evaluator\b/i,
  /\bai response\b/i,
  /\bresponse quality\b/i,
  /\bresponse evaluator\b/i,
  /\bai content\b/i,
  /\bcontent reviewer\b/i,
  /\bcontent rater\b/i,
  /\bai trainer\b/i,
  /\bdata annotat/i,
  /\btext annotat/i,
  /\bllm evaluator\b/i,
  /\bmodel evaluator\b/i,
  /\bai quality\b/i,
  /\bai rater\b/i,
  /\bdata label/i
];

async function loadResume() {
  const result = await mammoth.extractRawText({
    path: resumeFile
  });

  return result.value.toLowerCase();
}

async function fetchJobs(keyword) {
  const response = await fetch(
    "https://www.remoterocketship.com/api/openclaw/jobs",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filters: {
          page: 1,
          itemsPerPage: 20,
          locationFilters: ["United States"],
          showRemoteJobs: true,
          showHybridJobs: false,
          showOnsiteJobs: false,
          keywordFilters: [keyword],
          sortBy: "DateAdded"
        },
        includeJobDescription: true
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `API error ${response.status} for ${keyword}`
    );
  }

  const data = await response.json();

  return data.jobOpenings ?? [];
}

function getJobText(job) {
  return [
    job.roleTitle,
    job.roleDescription,
    job.roleRequirements,
    job.jobDescriptionSummary
  ]
    .filter(value => typeof value === "string")
    .join(" ");
}

function evaluateJob(job, resume) {
  const title = job.roleTitle ?? "";
  const jobText = getJobText(job).toLowerCase();

  // Exclude jobs clearly outside our four targets
  if (!relevantTitlePatterns.some(pattern => pattern.test(title))) {
    return {
      eligible: false,
      reason: "Outside target roles"
    };
  }

  if (excludedTitlePatterns.some(pattern => pattern.test(title))) {
    return {
      eligible: false,
      reason: "Specialized or senior position"
    };
  }

  if (languagePatterns.some(pattern => pattern.test(title))) {
    return {
      eligible: false,
      reason: "Specialized language position"
    };
  }

  const matched = skills.filter(
    skill =>
      resume.includes(skill) &&
      jobText.includes(skill)
  );

  // Give extra weight to direct AI evaluation experience
  const primarySkills = [
    "ai evaluation",
    "ai evaluator",
    "ai training",
    "ai trainer",
    "llm evaluation",
    "response evaluation",
    "content review",
    "content grading",
    "quality assurance",
    "annotation",
    "data annotation"
  ];

  const primaryMatches = matched.filter(
    skill => primarySkills.includes(skill)
  );

  const score =
    matched.length +
    primaryMatches.length * 3;

  // This is a preliminary fit indicator,
  // not a verified qualification determination.
  let fit = "Review requirements";

  if (primaryMatches.length >= 2) {
    fit = "Promising match";
  } else if (primaryMatches.length >= 1) {
    fit = "Potential match";
  }

  return {
    eligible: true,
    matched,
    score,
    fit,
    descriptionAvailable: Boolean(
      job.roleDescription ||
      job.roleRequirements ||
      job.jobDescriptionSummary
    )
  };
}

async function main() {
  if (!apiKey) {
    console.log(
      "Remote Rocketship API key not found."
    );
    return;
  }

  try {
    const resume = await loadResume();

    console.log("Resume loaded successfully.");
    console.log("\n=== AI JOB SEARCH ===");

    const uniqueJobs = new Map();
    let totalReturned = 0;

    for (const search of searches) {
      console.log(`\nSearching: ${search.keyword}`);

      try {
        const jobs = await fetchJobs(search.keyword);

        console.log(`Returned: ${jobs.length}`);

        totalReturned += jobs.length;

        for (const job of jobs) {
          const key =
            job.url ||
            `${job.company?.name}-${job.roleTitle}`;

          if (!uniqueJobs.has(key)) {
            uniqueJobs.set(key, job);
          }
        }
      } catch (error) {
        console.log(
          `Search error: ${error.message}`
        );
      }
    }

    const evaluated = [...uniqueJobs.values()].map(
      job => ({
        job,
        evaluation: evaluateJob(job, resume)
      })
    );

    const eligible = evaluated.filter(
      result => result.evaluation.eligible
    );

    eligible.sort(
      (a, b) =>
        b.evaluation.score -
        a.evaluation.score
    );

    const shortlist = eligible.slice(0, MAX_RESULTS);

    console.log("\n==============================");
    console.log("       SEARCH SUMMARY");
    console.log("==============================");

    console.log("Jobs returned:", totalReturned);
    console.log("Unique jobs:", uniqueJobs.size);
    console.log(
      "Excluded by title:",
      evaluated.length - eligible.length
    );
    console.log("Candidates for review:", eligible.length);
    console.log("Shortlisted:", shortlist.length);

    console.log("\n=== TOP AI OPPORTUNITIES ===");

    if (shortlist.length === 0) {
      console.log(
        "No matching titles found in this search."
      );
    }

    for (const { job, evaluation } of shortlist) {
      console.log("\n----------------------------");
      console.log("JOB:", job.roleTitle);
      console.log(
        "COMPANY:",
        job.company?.name ?? "Unknown"
      );
      console.log("FIT:", evaluation.fit);
      console.log("MATCH SCORE:", evaluation.score);
      console.log(
        "SHARED SKILLS:",
        evaluation.matched.join(", ") ||
          "No exact skill phrases identified"
      );
      console.log(
        "DESCRIPTION:",
        evaluation.descriptionAvailable
          ? "Available"
          : "Not available"
      );
      console.log("APPLY:", job.url);
    }

    console.log("\n=== SEARCH COMPLETE ===");

    console.log(
      "IMPORTANT: Results are preliminary. Review job requirements, credentials, language needs, and work arrangement before applying."
    );

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
