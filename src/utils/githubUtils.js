import axios from 'axios';

export const fetchRepoStructure = async (owner, repo) => {
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`);
    const tree = response.data.tree;

    const nodes = [];
    const links = [];
    const pathMap = new Map();

    tree.forEach(item => {
      const parts = item.path.split('/');
      const name = parts.pop();
      const parentPath = parts.join('/');

      nodes.push({ id: item.path, name, group: item.type });
      pathMap.set(item.path, true);

      if (parentPath && pathMap.has(parentPath)) {
        links.push({ source: parentPath, target: item.path });
      }
    });

    return { nodes, links };
  } catch (error) {
    console.error('Error fetching repo structure:', error);
    throw error;
  }
};

export const fetchRepoInfo = async (owner, repo) => {
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching repo info:', error);
    throw error;
  }
};

export const analyzeRepoContent = async (owner, repo) => {
  try {
    // Fetch repository content
    const contentResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`);
    const readmeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`);
    
    // Extract relevant information
    const files = contentResponse.data.map(item => item.name);
    const readmeContent = atob(readmeResponse.data.content);

    // Prepare data for AI analysis
    const analysisData = {
      repo: `${owner}/${repo}`,
      files: files,
      readme: readmeContent
    };

    // Send data to AI for analysis (replace with actual AI API call)
    const aiAnalysis = await simulateAIAnalysis(analysisData);

    return aiAnalysis;
  } catch (error) {
    console.error('Error analyzing repo content:', error);
    throw error;
  }
};

// Simulated AI analysis function (replace with actual AI API call)
const simulateAIAnalysis = async (data) => {
  // This is a placeholder for the actual AI analysis
  // In a real implementation, you would send the data to an AI service (e.g., OpenAI API)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`
Repository Analysis for ${data.repo}

Summary:
This repository appears to be a ${data.files.includes('package.json') ? 'JavaScript' : 'unknown'} project with ${data.files.length} files at the root level.

Key Files:
${data.files.slice(0, 5).join(', ')}${data.files.length > 5 ? ', ...' : ''}

README Summary:
${data.readme.slice(0, 200)}...

Recommendations:
1. Review the README for completeness and clarity.
2. Ensure proper documentation for key components.
3. Consider adding or updating unit tests if not present.

Note: This is a simulated AI analysis. For more accurate and comprehensive results, integrate with a real AI service.
      `);
    }, 2000); // Simulate 2 second processing time
  });
};