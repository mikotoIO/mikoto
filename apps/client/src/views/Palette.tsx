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
  V1000: 'hsl(282, 100%, 11%)',
  V900: 'hsl(282, 100%, 20%)',
  V800: 'hsl(282, 100%, 37%)',
  V700: 'hsl(282, 90%, 50%)',
  V600: 'hsl(282, 86%, 60%)',
  V500: 'hsl(282, 82%, 70%)',
  V400: 'hsl(282, 80%, 75%)',
  V300: 'hsl(282, 78%, 80%)',
  V200: 'hsl(282, 76%, 85%)',
  V100: 'hsl(282, 74%, 90%)',
}

const blues = {
  B1000: 'hsl(214, 100%, 11%)',
  B900: 'hsl(214, 100%, 20%)',
  B800: 'hsl(214, 100%, 37%)',
  B700: 'hsl(214, 100%, 50%)',
  B600: 'hsl(214, 96%, 60%)',
  B500: 'hsl(214, 92%, 70%)',
  B400: 'hsl(214, 90%, 75%)',
  B300: 'hsl(214, 88%, 80%)',
  B200: 'hsl(214, 86%, 85%)',
  B100: 'hsl(214, 84%, 90%)',
}

const greens = {
  G1000: 'hsl(159, 100%, 11%)',
  G900: 'hsl(159, 100%, 20%)',
  G800: 'hsl(159, 100%, 33%)',
  G700: 'hsl(159, 100%, 42%)',
  G600: 'hsl(159, 98%, 55%)',
  G500: 'hsl(159, 92%, 70%)',
  G400: 'hsl(159, 90%, 75%)',
  G300: 'hsl(159, 88%, 80%)',
  G200: 'hsl(159, 86%, 85%)',
  G100: 'hsl(159, 84%, 90%)',
}

const yellows = {
  Y1000: 'hsl(33, 100%, 21%)',
  Y900: 'hsl(33, 100%, 35%)',
  Y800: 'hsl(33, 100%, 45%)',
  Y700: 'hsl(33, 100%, 55%)',
  Y600: 'hsl(33, 100%, 65%)',
  Y500: 'hsl(33, 100%, 75%)',
  Y400: 'hsl(33, 100%, 80%)',
  Y300: 'hsl(33, 100%, 85%)',
  Y200: 'hsl(33, 100%, 90%)',
  Y100: 'hsl(33, 100%, 95%)',
}

const reds = {
  R1000: 'hsl(350, 90%, 11%)',
  R900: 'hsl(350, 90%, 20%)',
  R800: 'hsl(350, 90%, 33%)',
  R700: 'hsl(350, 90%, 44%)',
  R600: 'hsl(350, 90%, 55%)',
  R500: 'hsl(350, 90%, 65%)',
  R400: 'hsl(350, 90%, 75%)',
  R300: 'hsl(350, 90%, 80%)',
  R200: 'hsl(350, 90%, 85%)',
  R100: 'hsl(350, 90%, 90%)',
}

const pinks = {
  P1000: 'hsl(328, 100%, 11%)',
  P900: 'hsl(328, 100%, 20%)',
  P800: 'hsl(328, 100%, 37%)',
  P700: 'hsl(328, 95%, 50%)',
  P600: 'hsl(328, 95%, 60%)',
  P500: 'hsl(328, 95%, 70%)',
  P400: 'hsl(328, 95%, 75%)',
  P300: 'hsl(328, 95%, 80%)',
  P200: 'hsl(328, 95%, 85%)',
  P100: 'hsl(328, 95%, 90%)',
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
    font-weight: bolder;
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
    <ViewContainer padded scroll>
      <ColorPalette colors={neutrals} />
      <ColorPalette colors={purple} />
      <ColorPalette colors={blues} />
      <ColorPalette colors={greens} />
      <ColorPalette colors={yellows} />
      <ColorPalette colors={reds} />
      <ColorPalette colors={pinks} />

      <Form>
        <Input labelName="Test Input" />
      </Form>
    </ViewContainer>
  );
}