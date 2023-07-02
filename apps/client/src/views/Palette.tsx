import styled from 'styled-components';

import { TabName } from '../components/TabBar';
import { ViewContainer } from '../components/ViewContainer';
import { Button, Buttons } from '../lucid/Button';
import { Form } from '../lucid/Form';
import { Input } from '../lucid/Input';
import {
  blues,
  greens,
  neutrals,
  pinks,
  purples,
  reds,
  yellows,
} from '../lucid/theme';

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
      <TabName name="Design Stories" />
      <h1>Design Stories</h1>
      <ColorPalette colors={neutrals} />
      <ColorPalette colors={purples} />
      <ColorPalette colors={blues} />
      <ColorPalette colors={greens} />
      <ColorPalette colors={yellows} />
      <ColorPalette colors={reds} />
      <ColorPalette colors={pinks} />

      <Form>
        <Input labelName="Test Input" />
        <Buttons>
          <Button variant="primary">Primary Button</Button>
          <Button>Secondary Button</Button>
        </Buttons>
      </Form>
    </ViewContainer>
  );
}
