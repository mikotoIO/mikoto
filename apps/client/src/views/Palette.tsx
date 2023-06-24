import styled from 'styled-components';

import { ViewContainer } from '../components/ViewContainer';
import { Form } from '../lucid/Form';
import { Input } from '../lucid/Input';

// design a color palette component, using styled components
interface Color {
  name: string;
  hex: string;
}

// use CSS grid. max width
const ColorPaletteContainer = styled.div`
  background-color: #000000;
  display: flex;
  box-sizing: border-box;
  padding: 16px;
  gap: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
`;

const neutrals = {
  N1200: 'hsl(220, 4%, 11%)', // darkest
  N1100: 'hsl(220, 4%, 15%)', // darkest
  N1000: 'hsl(220, 7%, 17%)', // darkest
  N900: 'hsl(220, 7%, 20%)', // darker
  N800: 'hsl(220, 8%, 23%)', // backgrounds
  N700: 'hsl(220, 8%, 27%)', // backgrounds
  N600: 'hsl(220, 9%, 31%)',
  N500: 'hsl(220, 9%, 42%)',
  N400: 'hsl(220, 9%, 60%)',
  N300: 'hsl(220, 8%, 81%)',
  N200: 'hsl(220, 8%, 93%)',
  N100: 'hsl(220, 8%, 97%)',
  N0: 'hsl(220, 0%, 100%)',
};

const purple = {
  V1200: 'hsl(282, 100%, 11%)',
  V1100: 'hsl(282, 100%, 20%)',
  V1000: 'hsl(282, 100%, 37%)',
  V900: 'hsl(282, 100%, 45%)',
  V800: 'hsl(282, 90%, 50%)',
  V700: 'hsl(282, 88%, 55%)',
  V600: 'hsl(282, 86%, 60%)',
  V500: 'hsl(282, 84%, 65%)',
  V400: 'hsl(282, 82%, 70%)',
  V300: 'hsl(282, 80%, 75%)',
  V200: 'hsl(282, 78%, 80%)',
  V100: 'hsl(282, 76%, 85%)',
  V0: 'hsl(282, 74%, 90%)',
}

const blues = {
  B1200: 'hsl(214, 100%, 11%)',
  B1100: 'hsl(214, 100%, 20%)',
  B1000: 'hsl(214, 100%, 37%)',
  B900: 'hsl(214, 100%, 45%)',
  B800: 'hsl(214, 100%, 50%)',
  B700: 'hsl(214, 98%, 55%)',
  B600: 'hsl(214, 96%, 60%)',
  B500: 'hsl(214, 94%, 65%)',
  B400: 'hsl(214, 92%, 70%)',
  B300: 'hsl(214, 90%, 75%)',
  B200: 'hsl(214, 88%, 80%)',
  B100: 'hsl(214, 86%, 85%)',
  B0: 'hsl(214, 84%, 90%)',
}

const greens = {
  G1200: 'hsl(159, 100%, 11%)',
  G1100: 'hsl(159, 100%, 20%)',
  G1000: 'hsl(159, 100%, 37%)',
  G900: 'hsl(159, 100%, 45%)',
  G800: 'hsl(159, 100%, 50%)',
  G700: 'hsl(159, 98%, 55%)',
  G600: 'hsl(159, 96%, 60%)',
  G500: 'hsl(159, 94%, 65%)',
  G400: 'hsl(159, 92%, 70%)',
  G300: 'hsl(159, 90%, 75%)',
  G200: 'hsl(159, 88%, 80%)',
  G100: 'hsl(159, 86%, 85%)',
  G0: 'hsl(159, 84%, 90%)',
}

const ColorItem = styled.div<{ clr: Color }>`
  width: 70px;
  .block {
    box-shadow: rgba(0, 0, 0, 0.2) 0px 7px 29px 0px;
    height: 55px;
    border-radius: 8px;
    background-color: ${(p) => p.clr.hex};
  }
  .desc {
    color: white;
    padding: 4px;
    opacity: 0.8;
  }
`;

function ColorPalette({ colors }: { colors: Record<string, string> }) {
  return (
    <ColorPaletteContainer>
      {Object.keys(colors).map((nm) => (
        <ColorItem
          clr={{
            name: nm,
            hex: colors[nm],
          }}
          key={nm}
        >
          <div className="block" />
          <div className="desc">{nm}</div>
        </ColorItem>
      ))}
    </ColorPaletteContainer>
  );
}

export function DesignStory() {
  return (
    <ViewContainer padded>
      <ColorPalette colors={neutrals} />
      <ColorPalette colors={purple} />
      <ColorPalette colors={blues} />
      <ColorPalette colors={greens} />
      <Form>
        <Input labelName="Test Input" />
      </Form>
    </ViewContainer>
  );
}
