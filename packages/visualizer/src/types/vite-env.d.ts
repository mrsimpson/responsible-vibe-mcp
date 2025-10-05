/// <reference types="vite/client" />

// Declare raw imports for YAML files
declare module '*.yaml?raw' {
  const content: string;
  export default content;
}

declare module '*.yml?raw' {
  const content: string;
  export default content;
}
