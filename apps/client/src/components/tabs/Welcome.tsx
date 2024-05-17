import { Box, Flex } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faAtom,
  faChevronCircleRight,
  faDonate,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faMikoto } from '../icons';

const StyledWelcome = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

interface WelcomeButtonProps {
  emoji: IconDefinition;
  text: string;
  linkTo: string;
}

function WelcomeButton(props: WelcomeButtonProps) {
  return (
    <Flex
      as="a"
      target="_blank" // TODO: allow opening join links as a surface
      textDecoration="none"
      href={props.linkTo}
      align="center"
      justify="space-between"
      w="300px"
      _hover={{ bg: 'gray.700' }}
      px={4}
      py={2}
      rounded="md"
      color="gray.600"
    >
      <Flex
        align="center"
        justify="center"
        bg="gray.800"
        rounded="md"
        fontSize="lg"
        w={10}
        h={10}
      >
        <FontAwesomeIcon icon={props.emoji} />
      </Flex>
      <Box fontSize="sm" color="gray.450" fontWeight="600">
        {props.text}
      </Box>
      <Box>
        <FontAwesomeIcon icon={faChevronCircleRight} />
      </Box>
    </Flex>
  );
}

export function WelcomeToMikoto() {
  return (
    <StyledWelcome>
      <Box color="gray.650">
        <FontAwesomeIcon icon={faMikoto} fontSize="160px" />
      </Box>
      <Flex mt={8} direction="column">
        <WelcomeButton
          emoji={faAtom}
          text="Official Mikoto Space"
          linkTo="https://alpha.mikoto.io/invite/WtvbKS7mrLSd"
        />
        <WelcomeButton
          emoji={faDonate}
          text="Sponsor a feature"
          linkTo="https://buy.stripe.com/3cseWUcvd5uZcAEaEG"
        />
      </Flex>
    </StyledWelcome>
  );
}
