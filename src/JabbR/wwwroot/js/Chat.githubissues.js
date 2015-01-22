﻿/*global chat: true */
(function ($, window, ui) {
    'use strict';

    window.addGitHubIssue = function (issue) {
        if (!issue.data.user) {
            return;
        }

        // Keep track of whether we're need the end, so we can auto-scroll once the tweet is added.
        var nearEnd = ui.isNearTheEnd(),
            elements = null;

        elements = $('div.git-hub-issue-' + issue.data.number)
            .removeClass('git-hub-issue-' + issue.data.number);


        issue.data.body = chat.utility.markdownToHtml(issue.data.body);

        // Process the template, and add it in to the div.
        $('#github-issues-template').tmpl(issue.data).appendTo(elements);

        // After the string has been added to the template etc, remove any existing targets and re-add with _blank
        $('a', elements).removeAttr('target').attr('target', '_blank');

        $('.js-relative-date').timeago();
        // If near the end, scroll.
        if (nearEnd) {
            ui.scrollToBottom();
        }
        elements.append('<script src="https://api.github.com/users/' + issue.data.user.login + '?callback=addGitHubIssuesUser"></script>');
        if (issue.data.assignee) {
            elements.append('<script src="https://api.github.com/users/' + issue.data.assignee.login + '?callback=addGitHubIssuesUser"></script>');
        }
    };

    window.addGitHubIssueComment = function (comment) {
        
        var nearEnd = ui.isNearTheEnd(),
            elements = null;

        elements = $('div.git-hub-issue-' + comment.data.id)
            .removeClass('git-hub-issue-' + comment.data.id);


        comment.data.body = chat.utility.markdownToHtml(comment.data.body);
        // Process the template, and add it in to the div.
        $('#github-issues-comment-template').tmpl(comment.data).appendTo(elements);

        // After the string has been added to the template etc, remove any existing targets and re-add with _blank
        $('a', elements).removeAttr('target').attr('target', '_blank');

        $('.js-relative-date').timeago();
        // If near the end, scroll.
        if (nearEnd) {
            ui.scrollToBottom();
        }
    };

    window.addGitHubIssuesUser = function (user) {
        var elements = $("a.github-issue-user-" + user.data.login);
        elements.attr("href", user.data.html_url);
    };

})(window.jQuery, window, chat.ui);