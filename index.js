const apiKey = process.env.REMOTE_ROCKETSHIP_API_KEY;

async function searchJobs() {
  if (!apiKey) {
    console.log("API key not found.");
    return;
  }

  try {
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
            keywordFilters: [
              "AI evaluator",
              "AI trainer",
              "LLM evaluator",
              "agent evaluator",
              "RLHF"
            ],
            sortBy: "DateAdded"
          },
          includeJobDescription: false
        })
      }
    );

    if (!response.ok) {
      console.log("API returned status:", response.status);
      const error = await response.json().catch(() => ({}));
      console.log(error.message || "Request failed.");
      return;
    }

    const data = await response.json();

    console.log("\n=== REMOTE ROCKETSHIP JOB SEARCH ===");
    console.log("Total matching jobs:", data.totalCount);
    console.log("Jobs returned:", data.jobOpenings?.length ?? 0);
    console.log("------------------------------------");

    for (const job of data.jobOpenings ?? []) {
      console.log(`\nJob: ${job.roleTitle}`);
      console.log(`Company: ${job.company?.name ?? "Unknown"}`);
      console.log(`Salary: ${job.salaryRange ?? "Not listed"}`);
      console.log(`Apply: ${job.url}`);
    }

    console.log("\n=== SEARCH COMPLETE ===");
  } catch (error) {
    console.log("Connection error:", error.message);
  }
}

searchJobs();
