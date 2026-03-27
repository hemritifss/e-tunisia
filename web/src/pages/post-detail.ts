import { posts, comments } from '../data';

export function renderPostDetailPage(postId: string): string {
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return `
      <div class="post-detail-page page-enter">
        <div class="empty-state">
          <i class="lucide-file-question"></i>
          <h3>Post not found</h3>
          <p>This post may have been removed or the link is incorrect.</p>
          <a href="#/" class="btn btn-primary" style="margin-top: var(--space-4);">Back to Feed</a>
        </div>
      </div>
    `;
  }

  return `
    <div class="post-detail-page page-enter">
      <a href="#/" class="btn btn-ghost" style="margin-bottom: var(--space-4);">
        <i class="lucide-arrow-left"></i> Back to Feed
      </a>

      <div class="post-detail-card">
        <div class="post-meta" style="margin-bottom: var(--space-3);">
          <img src="${post.author.avatar}" alt="${post.author.name}" style="width: 28px; height: 28px; border-radius: 50%;" />
          <span class="post-meta-author">${post.author.name}</span>
          <span class="post-category ${post.categoryClass}">${post.category}</span>
          <span>${post.timeAgo}</span>
          ${post.location ? `<span><i class="lucide-map-pin" style="font-size: 0.75rem"></i> ${post.location}</span>` : ''}
        </div>

        <h1 class="post-detail-title">${post.title}</h1>

        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-detail-image" />` : ''}

        <div class="post-detail-body">${post.body}</div>

        <div class="post-detail-actions">
          <button class="post-action-btn">
            <i class="lucide-chevron-up"></i>
            <span>${post.votes}</span>
          </button>
          <button class="post-action-btn">
            <i class="lucide-message-square"></i>
            <span>${post.commentCount} comments</span>
          </button>
          <button class="post-action-btn">
            <i class="lucide-share-2"></i>
            <span>Share</span>
          </button>
          <button class="post-action-btn">
            <i class="lucide-bookmark"></i>
            <span>Save</span>
          </button>
        </div>
      </div>

      <div class="comments-section">
        <h3 class="comments-header">${comments.length} Comments</h3>

        <div class="comment-form">
          <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia" alt="You" style="width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;" />
          <div style="flex: 1;">
            <textarea placeholder="Share your thoughts..." class="input" style="min-height: 80px; resize: vertical;"></textarea>
            <div style="display: flex; justify-content: flex-end; margin-top: var(--space-2);">
              <button class="btn btn-primary btn-sm">Comment</button>
            </div>
          </div>
        </div>

        <div class="comments-list">
          ${comments.map(c => `
            <div class="comment-item">
              <img src="${c.avatar}" alt="${c.author}" class="comment-avatar" />
              <div class="comment-body">
                <div class="comment-author">${c.author}</div>
                <div class="comment-text">${c.text}</div>
                <div class="comment-time">
                  ${c.timeAgo}
                  <button class="post-action-btn" style="display: inline-flex; margin-left: var(--space-2);">
                    <i class="lucide-chevron-up"></i> ${c.votes}
                  </button>
                  <button class="post-action-btn" style="display: inline-flex;">
                    <i class="lucide-message-square"></i> Reply
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

export function initPostDetailPage() {
  // Comment form, vote buttons etc. could be wired here
}
