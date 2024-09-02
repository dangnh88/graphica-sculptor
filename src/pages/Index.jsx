import RepoVisualizer from '../components/RepoVisualizer';
import { ThemeProvider } from 'next-themes';

const Index = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <RepoVisualizer />
      </div>
    </ThemeProvider>
  );
};

export default Index;