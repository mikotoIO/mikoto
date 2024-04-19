import SyntaxHighlighter from 'react-syntax-highlighter';

import { highlightTheme } from './highlightTheme';

// map of extension -> language name
const languageExtensions: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  sh: 'bash',
  py: 'python',
  rb: 'ruby',
  yml: 'yaml',
  gql: 'graphql',
  rs: 'rust',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  kt: 'kotlin',
  md: 'markdown',
};

export default function CodeHighlight({
  language,
  content,
}: {
  language: string;
  content: string;
}) {
  const langExt = languageExtensions[language as any];
  return (
    <SyntaxHighlighter
      language={langExt ?? language}
      style={highlightTheme as any}
    >
      {content}
    </SyntaxHighlighter>
  );
}
