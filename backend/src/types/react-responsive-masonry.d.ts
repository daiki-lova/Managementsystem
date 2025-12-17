declare module 'react-responsive-masonry' {
  import { ReactNode } from 'react';

  interface MasonryProps {
    children: ReactNode;
    columnsCount?: number;
    gutter?: string;
  }

  interface ResponsiveMasonryProps {
    children: ReactNode;
    columnsCountBreakPoints?: Record<number, number>;
  }

  export function ResponsiveMasonry(props: ResponsiveMasonryProps): JSX.Element;
  export default function Masonry(props: MasonryProps): JSX.Element;
}
