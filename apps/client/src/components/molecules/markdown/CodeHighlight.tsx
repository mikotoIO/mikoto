import Highlight from 'react-highlight';

export default function CodeHighlight({
  language,
  content,
}: {
  language: string;
  content: string;
}) {
  return <Highlight className={language}>{content}</Highlight>;
}
