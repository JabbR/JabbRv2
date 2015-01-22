﻿/// <reference path="Scripts/jquery-2.0.3.js" />
/// <reference path="Scripts/jQuery.tmpl.js" />
/// <reference path="Scripts/jquery.cookie.js" />
/// <reference path="Scripts/moment.min.js" />
/// <reference path="Scripts/marked.js" />

/*jshint evil:true, bitwise:false*/
(function ($, window, emoji, marked, hljs, linkify, moment, languageResources) {
    "use strict";

    var markdownOptions = {
        highlight: function(code) {
            return hljs.highlightAuto(code).value;
        },
        tables: false,
        breaks: true,
        sanitize: true,
        gfm: true
    };

    function processMarkdown(src) {
        function noop() { }
        noop.exec = noop;

        // process inline markdown elements using custom lexer rules
        var inlineLexer = new marked.InlineLexer([], markdownOptions);

        inlineLexer.rules.link = noop;
        inlineLexer.rules.url = noop;

        return inlineLexer.output(src);
    }

    // getting the browser's name for use in isMobile
    var nav = navigator.userAgent || navigator.vendor || window.opera;

    // checking to see if the current device is a mobile device 
    // and storing the result for repeated use
    var isMobile = /android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(nav) ||
                   /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(nav.substr(0, 4));

    function padZero(s) {
        s = s.toString();
        if (s.length === 1) {
            return "0" + s;
        }
        return s;
    }

    function guidGenerator() {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    $.fn.isNearTheEnd = function () {
        if (typeof this[0] === 'undefined') {
            return false;
        }
        // Because of some weird bug in Chrome, sometimes the scroll stops at
        // bottom-1. I'm just going to approximate here to hopefully handle most
        // cases where it gets buggy. I don't think anyone will complain about
        // 10 pixels.
        return this[0].scrollTop + this.height() >= this[0].scrollHeight - 10;
    };

    $.fn.expandableContent = function () {
        // These are selectors to various rich content that may increase the
        // scrollable area after they were initially appended
        var selectors = ['img:not(.gravatar)'];

        return this.find(selectors.join(','));
    };

    // REVIEW: is it safe to assume we do not need to strip tags before decoding?
    function decodeHtml(html) {
        // should we strip tags before running this?
        // obligatory link to SO http://stackoverflow.com/questions/1147359/how-to-decode-html-entities-using-jquery
        // is it safe to assume bad html has been removed before we've reached this function call?
        return $("<div/>").html(html).text();
    }

    function encodeHtml(html) {
        // html still emits double quotes so we need to replace these entities to use them in attributes.
        return $("<div/>").text(html).html().replace(/\"/g, "&quot;");
    }
    
    function format(formatString) {
        var formatArgs = arguments;
        return formatString.replace(/{(?:[0-9]+)}/g, function (match) {
            return formatArgs[parseInt(match.substr(1, match.length - 2), 10) + 1];
        });
    }
    
    function getLanguageResource(languageResourceKey) {
        var args = Array.prototype.slice.call(arguments, 0);
        args[0] = languageResources[languageResourceKey];
        return format.apply(null, args);
    }

    // adds a parenthesis and all relevent tags to the users in the userlist
    function tagUsers(usernames, online, admins, owners, creators) {
        online = online == null ? [] : $.makeArray(online);
        admins = admins == null ? [] : $.makeArray(admins);
        owners = owners == null ? [] : $.makeArray(owners);
        creators = creators == null ? [] : $.makeArray(creators);

        // add the user's tags to the end of their username
        return $.map(usernames, function (el) {
            var tags = [];

            if (online.indexOf(el) > -1) {
                tags.push(utility.getLanguageResource('Client_OnlineTag'));
            }

            if (admins.indexOf(el) > -1) {
                tags.push(utility.getLanguageResource('Client_AdminTag'));
            }

            if (owners.indexOf(el) > -1) {
                tags.push(utility.getLanguageResource('Client_OwnerTag'));
            }

            if (creators.indexOf(el) > -1) {
                tags.push(utility.getLanguageResource('Client_CreatorTag'));
            }

            return el + (tags.length > 0 ? ' (' + tags.join(', ') + ')' : '');
        });
    }

    String.prototype.fromJsonDate = function () {
        return new Date(moment(this.toString()).valueOf());
    };

    Date.prototype.formatDate = function () {
        var m = this.getMonth() + 1,
            d = this.getDate(),
            y = this.getFullYear();

        return m + "/" + d + "/" + y;
    };

    Date.prototype.formatTime = function (showAp) {
        var ap,
            hr = this.getHours();

        if (hr < 12) {
            ap = "AM";
        }
        else {
            ap = "PM";
        }

        if (hr === 0) {
            hr = 12;
        }

        if (hr > 12) {
            hr = hr - 12;
        }

        var mins = padZero(this.getMinutes());
        var seconds = padZero(this.getSeconds());
        return hr + ":" + mins + ":" + seconds + (showAp ? " " + ap : "");
    };

    // returns the date portion only (strips time)
    Date.prototype.toDate = function () {
        return new Date(this.getFullYear(), this.getMonth(), this.getDate());
    };

    // returns difference (this - d) in days
    Date.prototype.diffDays = function (d) {
        var t1 = this.getTime(),
            t2 = d.getTime();

        return parseInt((t1 - t2) / (24 * 3600 * 1000), 10);
    };

    // adds a certain number of days to a Date object
    Date.prototype.addDays = function (days) {
        return new Date(this.getTime() + 1000 * 3600 * 24 * days);
    };

    function processContent(content, templates, roomCache) {
        content = content || '';

        var hasNewline = content.indexOf('\n') !== -1;

        if (hasNewline) {
            // Multiline detection
            return $('<div />').append(templates.multiline.tmpl({ content: content })).html();
        } else {
            // Emoji
            content = utility.parseEmojis(content);

            // Convert markdown
            content = processMarkdown(content);

            // Transform emoji to html
            content = utility.transformEmojis(content);

            // Create rooms links, only if we actually have a room cache
            if (roomCache) {
                content = content.replace(/#([A-Za-z0-9-_]{1,30}\w*)/g, function (m) {
                    var roomName = m.substr(1);

                    if (roomCache[roomName.toUpperCase()]) {
                        return '<a href="#/rooms/' + roomName + '" title="' + roomName + '">' + m + '</a>';
                    }
                    return m;
                });
            }
                
            // Convert normal links
            content = linkify(content, {
                callback: function (text, href) {
                    return href ? '<a rel="nofollow external" target="_blank" href="' + href + '" title="' + href + '">' + text + '</a>' : text;
                }
            });

            return content;
        }
    }

    var utility = {
        trim: function (value, length) {
            if (value.length > length) {
                return value.substr(0, length - 3) + '...';
            }
            return value;
        },
        randomUniqueId: function (prefix) {
            var n = Math.floor(Math.random() * 100);
            while ($("#" + prefix + n.toString()).length > 0) {
                n = Math.Floor(Math.random() * 100);
            }
            return prefix + n;
        },
        markdownToHtml: function (content) {
            var transformer = marked.parse;
            return (transformer(content, markdownOptions));
        },
        isMobile: isMobile,
        parseEmojis: function (content) {
            var parser = new emoji.Parser().parse;
            return (parser(content));
        },
        transformEmojis: function (content) {
            var transformToHtml = new emoji.Parser().transformToHtml;
            return (transformToHtml(content));
        },
        decodeHtml: decodeHtml,
        encodeHtml: encodeHtml,
        newId: guidGenerator,
        processContent: processContent,
        format: format,
        getLanguageResource: getLanguageResource,
        tagUsers: tagUsers
    };

    if (!window.chat) {
        window.chat = {};
    }

    window.chat.utility = utility;

})(window.jQuery, window, window.Emoji, window.marked, window.hljs, window.linkify, window.moment, window.languageResources);
