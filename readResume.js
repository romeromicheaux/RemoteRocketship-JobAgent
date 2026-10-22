
const mammoth = require("mammoth");

const resumeFile =
  "Romero_Micheaux_Updated_AI_Operations_Resume Chatgpt.docx";

async function readResume() {
  try {
    const result = await mammoth.extractRawText({
      path: resumeFile
    });

    console.log("\n=== RESUME LOADED ===\n");
    console.log(result.value);
    console.log("\n=== END OF RESUME ===");
  } catch (error) {
    console.error("Error reading resume:", error.message);
  }
}

readResume();
