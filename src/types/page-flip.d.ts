declare module 'page-flip' {
  export enum SizeType {
    FIXED = 'fixed',
    STRETCH = 'stretch',
  }

  export interface FlipSetting {
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    showCover?: boolean;
    usePortrait?: boolean;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    mobileScrollSupport?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    drawShadow?: boolean;
    flippingTime?: number;
    startZIndex?: number;
    startPage?: number;
  }

  export interface DataSource {
    data: number;
  }

  export class PageFlip {
    constructor(element: HTMLElement, setting: FlipSetting);
    loadFromImages(images: string[]): void;
    updateFromImages(images: string[]): void;
    loadFromHTML(elements: NodeListOf<Element> | HTMLElement[]): void;
    updateFromHtml(elements: NodeListOf<Element> | HTMLElement[]): void;
    flip(pageNum: number, corner?: string): void;
    flipNext(corner?: string): void;
    flipPrev(corner?: string): void;
    on(eventName: string, callback: (e: DataSource) => void): PageFlip;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): string;
    destroy(): void;
  }
}
