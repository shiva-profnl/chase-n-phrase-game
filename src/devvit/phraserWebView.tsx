import { Devvit } from '@devvit/web';
import { PhraserGameWrapper } from '../client/components/PhraserGameWrapper';

Devvit.addWebView({
  path: '/phraser/:postId',
  render: async (ctx) => {
    const userId = ctx.userId ?? ""; // may be undefined if logged out
    const username = ctx.username ?? "Anonymous"; // may be undefined if logged out
    const postId = ctx.params.postId ?? "";
    // Render your React component, passing userId and postId
    return <PhraserGameWrapper postId={postId} currentUserId={userId} currentUsername={username} />;
  },
});
