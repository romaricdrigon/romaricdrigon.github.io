(function($) {
  const repoName = 'romaricdrigon/romaricdrigon.github.io';
  const githubApiUrl = 'https://api.github.com';
  const $comments = $('#commentsList');
  const articleId = $comments.attr('data-article-id');
  let cachedIssueNumber = $comments.attr('data-issue-number');

  let showCommentButton = function(issueNumber) {
    $('#commentBtn')
      .attr('href', `https://github.com/${repoName}/issues/${issueNumber}`)
      .css('visibility', 'visible');
  };

  let renderComment = function(comment) {
    let commentDate = new Date(comment.created_at);
    let commentDateStr = commentDate ? commentDate.toLocaleString() : 'N/A';

    let html = `
    <div class="comment">
      <div class="author-img"><img src="${comment.user.avatar_url}" /></div>
      <div class="comment-body">
        <div class="comment-meta">
          <a href="${comment.user.html_url}">${comment.user.login}</a> commented on ${commentDateStr} :
        </div>
        <div class="comment-content">${comment.body}</div>
      </div>
    </div>`;

    $comments.append(html);
  };

  let loadCommentsForIssue = function(issueNumber) {
    $.ajax({
      url: `${githubApiUrl}/repos/${repoName}/issues/${issueNumber}/comments`
    }).fail(function() {
      $comments.html('<p>Comments could not be loaded.</p>');

      if (issueNumber) {
        showCommentButton();
      }
    }).done(function(data, textStatus, jqXHR) {
      if (!data) {
        $comments.html('<p>There are no comments yet on this post.</p>');
        showCommentButton(issueNumber);
      }

      $comments.empty();
      showCommentButton(issueNumber);

      data.map(renderComment);
    });
  };

  let searchIssueNumber = function() {
    let query = encodeURIComponent(`repo:${repoName} ${articleId}`);

    $.ajax({
      url: `${githubApiUrl}/search/issues?q=${query}`,
    }).fail(function() {
      $comments.html('<p>Comments could not be loaded.</p>');
    }).done(function(data) {
      if (!data.total_count) {
        $comments.html('<p>Comments are not open (yet) on this article.</p>');

        return;
      }

      if (data.items[0]['state'] !== 'open') {
        $comments.html('<p>Comments are closed on this post.</p>');

        return;
      }

      if (data.items[0]['comments'] === 0) {
        $comments.html('<p>There are no comments yet on this post.</p>');
        showCommentButton(data.items[0]['number']);

        return;
      }

      loadCommentsForIssue(data.items[0]['number']);
    });
  };

  let initialize = function() {
    if (!$comments || !articleId) {
      return;
    }

    $comments.html('<p>Comments are loading...</p>');

    if (cachedIssueNumber) {
      loadCommentsForIssue(cachedIssueNumber);

      return;
    }

    searchIssueNumber();
  };

  initialize();
})(jQuery);
