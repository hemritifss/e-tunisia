import { posts, places, type Post } from '../data';
import { replaceIcons } from '../icons';

function parseTimeAgo(timeStr: string): number {
  const match = timeStr.match(/(\d+)(m|h|d|w)/);
  if (!match) return 0; // "just now" = 0
  const val = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { m: 1, h: 60, d: 1440, w: 10080 };
  return val * (multipliers[unit] || 1);
}

function renderPostCard(post: Post): string {
  return `
    <article class="post-card reveal-on-scroll" data-post-id="${post.id}">
      <div class="post-card-inner">
        <div class="post-votes">
          <button class="vote-btn ${post.userVote === 1 ? 'active' : ''}" data-vote="up" data-post="${post.id}" aria-label="Upvote">
            <i class="lucide-chevron-up"></i>
          </button>
          <span class="vote-count" id="vote-count-${post.id}">${post.votes + post.userVote}</span>
          <button class="vote-btn down ${post.userVote === -1 ? 'active' : ''}" data-vote="down" data-post="${post.id}" aria-label="Downvote">
            <i class="lucide-chevron-down"></i>
          </button>
        </div>
        <div class="post-content">
          <div class="post-meta">
            <span class="post-category ${post.categoryClass}">${post.category}</span>
            <span class="post-meta-author">${post.author.name}</span>
            <span>Lv.${post.author.level}</span>
            <span>${post.timeAgo}</span>
            ${post.location ? `<span><i class="lucide-map-pin" style="font-size: 0.75rem"></i> ${post.location}</span>` : ''}
          </div>
          <h3 class="post-title">
            <a href="#/post/${post.id}">${post.title}</a>
          </h3>
          ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image" loading="lazy" onerror="this.style.display='none'" />` : ''}
          <p class="post-excerpt">${post.excerpt}</p>
          <div class="post-actions">
            <div class="post-mobile-votes">
              <button class="vote-btn ${post.userVote === 1 ? 'active' : ''}" data-vote="up" data-post="${post.id}">
                <i class="lucide-chevron-up"></i>
              </button>
              <span class="vote-count">${post.votes + post.userVote}</span>
              <button class="vote-btn down ${post.userVote === -1 ? 'active' : ''}" data-vote="down" data-post="${post.id}">
                <i class="lucide-chevron-down"></i>
              </button>
            </div>
            <button class="post-action-btn" onclick="location.hash='#/post/${post.id}'">
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
      </div>
    </article>
  `;
}

function renderMobileCommunityBar(): string {
  return `
    <div class="mobile-community-bar" id="mobile-community-bar">
      <div class="mobile-community-bar-header" id="mobile-community-toggle">
        <div class="mobile-community-bar-stats">
          <span class="mobile-community-stat"><i class="lucide-users"></i> 12.4k members</span>
          <span class="mobile-community-stat"><span style="display:inline-block;width:6px;height:6px;background:var(--success);border-radius:50%;margin-right:4px;"></span>342 online</span>
        </div>
        <button class="btn-icon btn-sm" aria-label="Expand community info">
          <i class="lucide-chevron-down" id="community-toggle-icon"></i>
        </button>
      </div>
      <div class="mobile-community-bar-content" id="mobile-community-content">
        <p class="text-sm text-secondary" style="margin-bottom: var(--space-3);">
          A community-driven platform for discovering, sharing, and celebrating the beauty of Tunisia.
        </p>
        <div style="margin-bottom: var(--space-3);">
          <h4 class="text-xs fw-700 text-muted" style="text-transform:uppercase;letter-spacing:var(--tracking-wide);margin-bottom:var(--space-2);">Trending Places</h4>
          <div style="display:flex;gap:var(--space-2);overflow-x:auto;padding-bottom:var(--space-1);-webkit-overflow-scrolling:touch;">
            ${places.slice(0, 4).map(p => `
              <div style="flex-shrink:0;display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2);background:var(--bg-secondary);border-radius:var(--radius-md);min-width:160px;">
                <img src="${p.image}" alt="${p.name}" style="width:36px;height:36px;border-radius:var(--radius-sm);object-fit:cover;" loading="lazy" />
                <div>
                  <div class="text-sm fw-600" style="white-space:nowrap;">${p.name}</div>
                  <div class="text-xs text-muted">${p.location}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-bottom: var(--space-3);">
          <h4 class="text-xs fw-700 text-muted" style="text-transform:uppercase;letter-spacing:var(--tracking-wide);margin-bottom:var(--space-2);">Popular Tags</h4>
          <div class="tag-list">
            <span class="tag">Beaches</span>
            <span class="tag">Historical</span>
            <span class="tag">Street Food</span>
            <span class="tag">Desert</span>
            <span class="tag">Photography</span>
          </div>
        </div>
        <div>
          <h4 class="text-xs fw-700 text-muted" style="text-transform:uppercase;letter-spacing:var(--tracking-wide);margin-bottom:var(--space-2);">Community Guidelines</h4>
          <ol style="padding-left:var(--space-4);display:flex;flex-direction:column;gap:var(--space-1);font-size:var(--text-xs);color:var(--text-secondary);list-style:decimal;">
            <li>Be respectful and welcoming</li>
            <li>Share authentic experiences</li>
            <li>Credit original photographers</li>
            <li>No spam or self-promotion</li>
            <li>Keep it relevant to Tunisia</li>
          </ol>
        </div>
      </div>
    </div>
  `;
}

function renderSidebar(): string {
  return `
    <aside class="feed-sidebar">
      <div class="sidebar-card sidebar-about">
        <div class="sidebar-card-header">
          <i class="lucide-info"></i>
          About e-Tunisia
        </div>
        <div class="sidebar-card-body">
          <p class="text-sm" style="margin-bottom: var(--space-3);">
            A community-driven platform for discovering, sharing, and celebrating the beauty of Tunisia.
            Join thousands of travelers and locals sharing their experiences.
          </p>
          <div class="sidebar-stats">
            <div class="sidebar-stat">
              <div class="sidebar-stat-value">12.4k</div>
              <div class="sidebar-stat-label">Members</div>
            </div>
            <div class="sidebar-stat-divider"></div>
            <div class="sidebar-stat">
              <div class="sidebar-stat-value"><span class="online-dot"></span>342</div>
              <div class="sidebar-stat-label">Online</div>
            </div>
          </div>
          <button class="btn btn-primary" style="width: 100%;">
            <i class="lucide-plus"></i>
            Create Post
          </button>
        </div>
      </div>

      <div class="sidebar-card">
        <div class="sidebar-card-header">
          <i class="lucide-trending-up"></i>
          Trending Places
        </div>
        <div class="sidebar-card-body sidebar-trending-scroll">
          ${places.slice(0, 6).map(p => `
            <div class="sidebar-place-item">
              <img src="${p.image}" alt="${p.name}" class="sidebar-place-img" loading="lazy" onerror="this.style.background='linear-gradient(135deg, var(--terracotta-pale), var(--mediterranean-pale))'" />
              <div class="sidebar-place-info">
                <div class="sidebar-place-name">${p.name}</div>
                <div class="sidebar-place-loc"><i class="lucide-map-pin" style="font-size:0.65rem"></i> ${p.location}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="sidebar-card">
        <div class="sidebar-card-header">
          <i class="lucide-tag"></i>
          Popular Tags
        </div>
        <div class="sidebar-card-body">
          <div class="tag-list-scroll">
            <span class="tag">Beaches</span>
            <span class="tag">Historical</span>
            <span class="tag">Street Food</span>
            <span class="tag">Desert</span>
            <span class="tag">Photography</span>
            <span class="tag">Budget Travel</span>
            <span class="tag">Hidden Gems</span>
            <span class="tag">Architecture</span>
            <span class="tag">Nightlife</span>
          </div>
        </div>
      </div>

      <div class="sidebar-card">
        <div class="sidebar-card-header">
          <i class="lucide-book-open"></i>
          Community Guidelines
        </div>
        <div class="sidebar-card-body">
          <ol style="padding-left: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--text-xs); color: var(--text-secondary); list-style: decimal;">
            <li>Be respectful and welcoming</li>
            <li>Share authentic experiences</li>
            <li>Credit original photographers</li>
            <li>No spam or self-promotion</li>
            <li>Keep it relevant to Tunisia</li>
          </ol>
        </div>
      </div>
    </aside>
  `;
}

export function renderFeedPage(): string {
  return `
    <div class="feed-layout">
      <div class="feed-main">
        <div class="create-post-bar">
          <img src="https://api.dicebear.com/9.x/thumbs/svg?seed=Tunisia" alt="You" class="create-post-avatar" />
          <div class="create-post-input">Share your Tunisia experience...</div>
          <button class="btn btn-sm btn-secondary"><i class="lucide-image"></i></button>
          <button class="btn btn-sm btn-secondary"><i class="lucide-link"></i></button>
        </div>

        <div class="feed-sort-bar">
          <button class="sort-btn active" data-sort="hot"><i class="lucide-flame"></i> Hot</button>
          <button class="sort-btn" data-sort="new"><i class="lucide-clock"></i> New</button>
          <button class="sort-btn" data-sort="top"><i class="lucide-bar-chart-3"></i> Top</button>
          <button class="sort-btn" data-sort="nearby"><i class="lucide-map-pin"></i> Nearby</button>
        </div>

        ${renderMobileCommunityBar()}

        <div class="feed-posts stagger-children">
          ${posts.map(p => renderPostCard(p)).join('')}
        </div>
      </div>
      ${renderSidebar()}
    </div>
  `;
}

function bindVoteButtons() {
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const el = btn as HTMLElement;
      const postId = el.dataset.post;
      const direction = el.dataset.vote;
      if (!postId) return;

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const wasActive = el.classList.contains('active');
      document.querySelectorAll(`[data-post="${postId}"]`).forEach(b => b.classList.remove('active'));

      if (!wasActive) {
        document.querySelectorAll(`[data-post="${postId}"][data-vote="${direction}"]`).forEach(b => b.classList.add('active'));
        post.userVote = direction === 'up' ? 1 : -1;
      } else {
        post.userVote = 0;
      }

      el.classList.add('vote-animate');
      setTimeout(() => el.classList.remove('vote-animate'), 300);

      const newCount = post.votes + post.userVote;
      // Update all vote count displays for this post
      const article = document.querySelector(`[data-post-id="${postId}"]`);
      article?.querySelectorAll('.vote-count').forEach(c => c.textContent = String(newCount));
    });
  });
}

export function initFeedPage() {
  bindVoteButtons();

  // Sort buttons - functional sorting
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sortType = (btn as HTMLElement).dataset.sort;
      const postsContainer = document.querySelector('.feed-posts');
      if (!postsContainer) return;

      let sorted: Post[];
      switch (sortType) {
        case 'hot':
          sorted = [...posts].sort((a, b) => (b.votes + b.commentCount) - (a.votes + a.commentCount));
          break;
        case 'new':
          sorted = [...posts].sort((a, b) => parseTimeAgo(a.timeAgo) - parseTimeAgo(b.timeAgo));
          break;
        case 'top':
          sorted = [...posts].sort((a, b) => b.votes - a.votes);
          break;
        case 'nearby':
          sorted = [...posts].filter(p => p.location).sort(() => Math.random() - 0.5);
          break;
        default:
          sorted = posts;
      }

      postsContainer.innerHTML = sorted.map(p => renderPostCard(p)).join('');
      replaceIcons();
      bindVoteButtons();
    });
  });

  // Mobile community bar toggle
  const communityToggle = document.getElementById('mobile-community-toggle');
  const communityBar = document.getElementById('mobile-community-bar');
  communityToggle?.addEventListener('click', () => {
    communityBar?.classList.toggle('expanded');
  });
}
