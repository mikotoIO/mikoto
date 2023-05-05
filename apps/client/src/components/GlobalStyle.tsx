import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
  
  :root {
    --main-font: 'Open Sans', sans-serif;
  }

  body {
    overscroll-behavior-y: none;
    height: 100%;
    min-height: 100%;
    margin: 0;
    background-color: #2f3237;
    font-family: var(--main-font);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::-webkit-scrollbar {
    width: 10px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: hsl(220, 7%, 23%);
    border-radius: 4px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: hsl(220, 7%, 17%);
    border-radius: 4px;
  }
`;