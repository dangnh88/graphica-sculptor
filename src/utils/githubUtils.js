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