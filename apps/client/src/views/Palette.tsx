import { faChevronRight, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Buttons, Form, Input, Toggle, colors } from '@mikoto-io/lucid';
import styled from 'styled-components';

import { TabName } from '../components/TabBar';
import { ViewContainer } from '../components/ViewContainer';
import { Triselector } from '../components/atoms/Triselect';

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

function ColorPalette({ colors: clrs }: { colors: Record<string, string> }) {
  return (
    <ColorPaletteContainer>
      {Object.keys(clrs).map((nm) => (
        <ColorItem
          clr={{
            name: nm,
            hex: clrs[nm],
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

const audio = new Audio('audio/notification/extralife.wav');
audio.volume = 0.05;

export function DesignStory() {
  return (
    <ViewContainer padded scroll>
      <TabName name="Design Stories" />
      <h1>Design Stories</h1>
      <ColorPalette colors={colors.neutrals} />
      <ColorPalette colors={colors.purples} />
      <ColorPalette colors={colors.blues} />
      <ColorPalette colors={colors.greens} />
      <ColorPalette colors={colors.yellows} />
      <ColorPalette colors={colors.reds} />
      <ColorPalette colors={colors.pinks} />

      <Form>
        <Input labelName="Test Input" />
        <Buttons>
          <Button
            type="button"
            onClick={() => {
              const notification = new Notification('Cactus (#general)', {
                body: 'This is a message that I am testing',
                icon: 'https://cdn.alpha.mikoto.io/spaceicon/927eec40-9274-45b3-8d1c-393aa7186cce.png',
                silent: true,
              });
              notification.onshow = () => {
                audio.play();

                setTimeout(() => {
                  notification.close();
                }, 3000);
              };
              // toast(<div>lol</div>);
            }}
          >
            Default Button
          </Button>
          <Button variant="primary" type="button">
            Primary Button
            <FontAwesomeIcon icon={faStar} />
          </Button>
          <Button variant="success" type="button">
            Success Button
          </Button>
          <Button variant="warning" type="button">
            Warning Button
          </Button>
          <Button variant="danger" type="button">
            Danger Button
          </Button>
        </Buttons>

        <Buttons>
          <Button variant="primary" type="button" transparent>
            Transparent button
            <FontAwesomeIcon icon={faChevronRight} />
          </Button>
        </Buttons>
        <div>
          <Triselector />
        </div>
        <Toggle />
      </Form>
    </ViewContainer>
  );
}
