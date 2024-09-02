import axios from 'axios';
import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';

const TEMP_CLONE_DIR = '/tmp/repo-clone';

export const cloneAndAnalyzeRepo = async (repoUrl) => {
  const repoName = repoUrl.split('/').pop().replace('.git', '');
  const clonePath = path.join(TEMP_CLONE_DIR, repoName);

  // Clone the repository
  await simpleGit().clone(repoUrl, clonePath);

  // Analyze the repository structure
  const fileStructure = await analyzeDirectory(clonePath);

  // Clean up: remove the cloned repository
  fs.rmdirSync(clonePath, { recursive: true });

  return fileStructure;
};

const analyzeDirectory = async (dirPath, parentId = null) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const nodes = [];
  const links = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const id = fullPath;

    if (entry.isDirectory()) {
      nodes.push({ id, name: entry.name, group: 'directory' });
      if (parentId) {
        links.push({ source: parentId, target: id });
      }
      const { nodes: childNodes, links: childLinks } = await analyzeDirectory(fullPath, id);
      nodes.push(...childNodes);
      links.push(...childLinks);
    } else {
      nodes.push({ id, name: entry.name, group: 'file' });
      if (parentId) {
        links.push({ source: parentId, target: id });
      }
    }
  }

  return { nodes, links };
};