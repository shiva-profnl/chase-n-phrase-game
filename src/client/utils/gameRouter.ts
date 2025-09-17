// utils/gameRouter.ts
export type GameMode = 'chaser' | 'phraser';

export interface GameRouteParams {
  mode: GameMode;
  postId?: string | undefined;
  userId?: string | undefined;
}

export class GameRouter {
  /**
   * Navigate to Chaser game
   */
  static navigateToChaser(): void {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'chaser');
    url.searchParams.delete('postId');
    window.location.href = url.toString();
  }

  /**
   * Navigate to Phraser game with specific post
   */
  static navigateToPhraserGame(postId: string, userId?: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'phraser');
    url.searchParams.set('postId', postId);
    if (userId) {
      url.searchParams.set('userId', userId);
    }
    window.location.href = url.toString();
  }

  /**
   * Generate Phraser game URL (for sharing)
   */
  static generatePhraserGameUrl(postId: string, baseUrl?: string): string {
    const base = baseUrl || window.location.origin + window.location.pathname;
    const url = new URL(base);
    url.searchParams.set('mode', 'phraser');
    url.searchParams.set('postId', postId);
    return url.toString();
  }

  /**
   * Parse current URL parameters
   */
  static parseCurrentRoute(): GameRouteParams {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = (urlParams.get('mode') as GameMode) || 'chaser';
    const postId = urlParams.get('postId') || undefined;
    const userId = urlParams.get('userId') || undefined;

    return { mode, postId, userId };
  }

  /**
   * Check if current route is valid Phraser game
   */
  static isValidPhraserRoute(): boolean {
    const params = this.parseCurrentRoute();
    return params.mode === 'phraser' && !!params.postId;
  }

  /**
   * Get current user ID from various sources
   */
  static getCurrentUserId(): string {
    const params = this.parseCurrentRoute();
    
    // Priority order: URL param -> localStorage -> generate new
    return params.userId || 
           localStorage.getItem('gameUserId') || 
           this.generateUserId();
  }

  /**
   * Generate a user ID for testing/anonymous users
   */
  private static generateUserId(): string {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    localStorage.setItem('gameUserId', userId);
    return userId;
  }

  /**
   * Set user ID (for testing or manual user management)
   */
  static setUserId(userId: string): void {
    localStorage.setItem('gameUserId', userId);
  }
}