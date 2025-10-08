/**
 * Extended Obsidian types for development
 */

declare global {
  interface HTMLElement {
    createEl<T extends keyof HTMLElementTagNameMap>(
      tag: T,
      options?: { text?: string; cls?: string }
    ): HTMLElementTagNameMap[T];
    
    empty(): void;
    addClass(cls: string): void;
  }
}

export {};