import { useEffect, useState } from 'react';

import { DocNav } from '../components/DocNav';
import {
  ButtonsSection,
  TagsSection,
  UIElementsSection,
} from '../components/sections/ComponentSections';
import {
  CactuspunkSection,
  PhilosophySection,
  PrinciplesSection,
} from '../components/sections/FoundationSections';
import {
  CellsSection,
  GridSection,
  GroupsSection,
} from '../components/sections/LayoutSections';
import {
  ColorsSection,
  SpacingSection,
  TypographySection,
} from '../components/sections/TokenSections';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Mikoto Design System — Cactuspunk' },
    {
      name: 'description',
      content:
        'The Mikoto design system documentation. Cactuspunk aesthetic, modular grid, and systematic design tokens.',
    },
  ];
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('philosophy');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.doc-section');
      let current = '';
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (scrollY >= sectionTop - 100) {
          current = section.getAttribute('id') ?? '';
        }
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <DocNav activeSection={activeSection} />
      <main className="doc-main">
        <PhilosophySection />
        <PrinciplesSection />
        <CactuspunkSection />
        <ColorsSection />
        <TypographySection />
        <SpacingSection />
        <GridSection />
        <CellsSection />
        <GroupsSection />
        <ButtonsSection />
        <TagsSection />
        <UIElementsSection />
      </main>
    </>
  );
}
