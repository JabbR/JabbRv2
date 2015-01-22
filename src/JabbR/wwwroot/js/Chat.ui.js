﻿/// <reference path="Scripts/jquery-2.0.3.js" />
/// <reference path="Scripts/jQuery.tmpl.js" />
/// <reference path="Scripts/jquery.cookie.js" />
/// <reference path="Chat.toast.js" />
/// <reference path="Scripts/livestamp.min.js" />
/// <reference path="Scripts/moment.min.js" />

/*jshint bitwise:false */
(function ($, window, document, chat, utility, emoji, moment) {
    "use strict";

    var $chatArea = null,
        $tabs = null,
        $submitButton = null,
        $newMessage = null,
        $roomActions = null,
        $toast = null,
        $disconnectDialog = null,
        $downloadIcon = null,
        $downloadDialog = null,
        $downloadDialogButton = null,
        $downloadRange = null,
        $logout = null,
        $help = null,
        $ui = null,
        $sound = null,
        templates = null,
        focus = true,
        readOnly = false,
        Keys = { Up: 38, Down: 40, Esc: 27, Enter: 13, Slash: 47, Space: 32, Tab: 9, Question: 191 },
        scrollTopThreshold = 75,
        toast = window.chat.toast,
        preferences = null,
        lastCycledMessage = null,
        $helpPopup = null,
        $helpBody = null,
        helpHeight = 0,
        $shortCutHelp = null,
        $globalCmdHelp = null,
        $roomCmdHelp = null,
        $userCmdHelp = null,
        $updatePopup = null,
        $window = $(window),
        $document = $(document),
        $lobbyRoomFilterForm = null,
        lobbyLoaded = false,
        $roomFilterInput = null,
        $closedRoomFilter = null,
        updateTimeout = 15000,
        $richness = null,
        lastPrivate = null,
        roomCache = {},
        $reloadMessageNotification = null,
        popoverTimer = null,
        $connectionStatus = null,
        connectionState = -1,
        $connectionStateChangedPopover = null,
        connectionStateIcon = null,
        $connectionInfoPopover = null,
        $connectionInfoContent = null,
        $fileUploadButton = null,
        $hiddenFile = null,
        $fileRoom = null,
        $fileConnectionId = null,
        connectionInfoStatus = null,
        connectionInfoTransport = null,
        $loadingHistoryIndicator = null,
        trimRoomHistoryFrequency = 1000 * 60 * 2, // 2 minutes in ms
        $loadMoreRooms = null,
        publicRoomList = null,
        sortedRoomList = null,
        maxRoomsToLoad = 100,
        lastLoadedRoomIndex = 0,
        $lobbyPrivateRooms = null,
        $lobbyOtherRooms = null,
        $roomLoadingIndicator = null,
        roomLoadingDelay = 250,
        roomLoadingTimeout = null,
        Room = chat.Room,
        $unreadNotificationCount = null,
        $splashScreen = null,
        $createRoomButton = null;

    function getRoomNameFromHash(hash) {
        if (hash.length && hash[0] === '/') {
            hash = hash.substr(1);
        }

        var parts = hash.split('/');
        if (parts[0] === 'rooms') {
            return parts[1];
        }

        return null;
    }

    function getRoomId(roomName) {
        return window.escape(roomName.toString().toLowerCase()).replace(/[^A-Za-z0-9]/g, '_');
    }

    function getUserClassName(userName) {
        return '[data-name="' + userName + '"]';
    }

    function getRoomPreferenceKey(roomName) {
        return '_room_' + roomName;
    }

    function setRoomLoading(isLoading, roomName) {
        if (isLoading) {
            var room = getRoomElements(roomName);
            if (!room.isInitialized()) {
                roomLoadingTimeout = window.setTimeout(function () {
                    $roomLoadingIndicator.fadeIn('slow');
                }, roomLoadingDelay);
            }
        } else {
            if (roomLoadingTimeout) {
                clearTimeout(roomLoadingTimeout);
            }
            $roomLoadingIndicator.fadeOut();
        }
    }

    function populateLobbyRoomList(item, template, listToPopulate) {
        $.tmpl(template, item).appendTo(listToPopulate);
    }

    function sortRoomList(listToSort) {
        var sortedList = listToSort.sort(function (a, b) {
            if (a.Closed && !b.Closed) {
                return 1;
            } else if (b.Closed && !a.Closed) {
                return -1;
            }

            if (a.Count > b.Count) {
                return -1;
            } else if (b.Count > a.Count) {
                return 1;
            }

            return a.Name.toString().toUpperCase().localeCompare(b.Name.toString().toUpperCase());
        });
        return sortedList;
    }

    function getRoomElements(roomName) {
        var roomId = getRoomId(roomName);
        var room = new Room($('#tabs-' + roomId),
                        $('#userlist-' + roomId),
                        $('#userlist-' + roomId + '-owners'),
                        $('#userlist-' + roomId + '-active'),
                        $('#messages-' + roomId),
                        $('#roomTopic-' + roomId));
        return room;
    }

    function getCurrentRoomElements() {
        var $tab = $tabs.find('li.current');
        var room;
        if ($tab.data('name') === 'Lobby') {
            room = new Room($tab,
                $('#userlist-lobby'),
                $('#userlist-lobby-owners'),
                $('#userlist-lobby-active'),
                $('.messages.current'),
                $('.roomTopic.current'));
        } else {
            room = new Room($tab,
                $('.users.current'),
                $('.userlist.current .owners'),
                $('.userlist.current .active'),
                $('.messages.current'),
                $('.roomTopic.current'));
        }
        return room;
    }
    
    function getActiveRoomName() {
        //TODO: make this less DOM-read-ey
        return $tabs.find('li.current').data('name');
    }

    function getAllRoomElements() {
        var rooms = [];
        $("ul#tabs > li.room, ul#tabs-dropdown > li.room").each(function () {
            rooms[rooms.length] = getRoomElements($(this).data("name"));
        });
        return rooms;
    }

    function getLobby() {
        return getRoomElements('Lobby');
    }

    function getRooms() {
        return sortedRoomList;
    }

    function updateLobbyRoom(room) {
        var lobby = getLobby(),
            $targetList = room.Private === true ? lobby.owners : lobby.users,
            $room = $targetList.find('[data-room="' + room.Name + '"]'),
            $count = $room.find('.count'),
            $topic = $room.find('.topic'),
            roomName = room.Name.toString().toUpperCase(),
            processedTopic = ui.processContent(room.Topic);
        
        // if we don't find the room, we need to create it
        if ($room.length === 0) {
            addRoomToLobby(room);
            return;
        }           

        if (room.Count === 0) {
            $count.text(utility.getLanguageResource('Client_OccupantsZero'));
        } else if (room.Count === 1) {
            $count.text(utility.getLanguageResource('Client_OccupantsOne'));
        } else {
            $count.text(utility.getLanguageResource('Client_OccupantsMany', room.Count));
        }

        if (room.Private === true) {
            $room.addClass('locked');
        } else {
            $room.removeClass('locked');
        }

        if (room.Closed === true) {
            $room.addClass('closed');
        } else {
            $room.removeClass('closed');
        }

        $topic.html(processedTopic);

        var nextListElement = getNextRoomListElement($targetList, roomName, room.Count, room.Closed);

        $room.data('count', room.Count);
        if (nextListElement !== null) {
            $room.insertBefore(nextListElement);
        } else {
            $room.appendTo($targetList);
        }

        // Do a little animation
        $room.css('-webkit-animation-play-state', 'running').css('animation-play-state', 'running');
    }

    function addRoomToLobby(roomViewModel) {
        var lobby = getLobby(),
            $room = null,
            roomName = roomViewModel.Name.toString().toUpperCase(),
            count = roomViewModel.Count,
            closed = roomViewModel.Closed,
            nonPublic = roomViewModel.Private,
            $targetList = roomViewModel.Private ? lobby.owners : lobby.users,
            i = null;

        roomViewModel.processedTopic = ui.processContent(roomViewModel.Topic);
        $room = templates.lobbyroom.tmpl(roomViewModel);

        var nextListElement = getNextRoomListElement($targetList, roomName, count, closed);

        if (nextListElement !== null) {
            $room.insertBefore(nextListElement);
        } else {
            $room.appendTo($targetList);
        }

        filterIndividualRoom($room);
        lobby.setListState($targetList);
        
        roomCache[roomName] = true;

        // don't try to populate the sortedRoomList while we're initially filling up the lobby
        if (sortedRoomList) {
            var sortedRoomInsertIndex = sortedRoomList.length;
            for (i = 0; i < sortedRoomList.length; i++) {
                if (sortedRoomList[i].Name.toString().toUpperCase().localeCompare(roomName) > 0) {
                    sortedRoomInsertIndex = i;
                    break;
                }
            }
            sortedRoomList.splice(sortedRoomInsertIndex, 0, roomViewModel);
        }
        
        // handle updates on rooms not currently displayed to clients by removing from the public room list
        if (publicRoomList) {
            for (i = 0; i < publicRoomList.length; i++) {
                if (publicRoomList[i].Name.toString().toUpperCase().localeCompare(roomName) === 0) {
                    publicRoomList.splice(i, 1);
                    break;
                }
            }
        }
        
        // if it's a private room, make sure that we're displaying the private room section
        if (nonPublic) {
            $lobbyPrivateRooms.show();
            $lobbyOtherRooms.find('.nav-header').html(utility.getLanguageResource('Client_OtherRooms'));
        }
    }
    
    function getNextRoomListElement($targetList, roomName, count, closed) {
        var nextListElement = null;

        // move the item to before the next element
        $targetList.find('li').each(function () {
            var $this = $(this),
                liRoomCount = $this.data('count'),
                liRoomClosed = $this.hasClass('closed'),
                name = $this.data('name'),
                nameComparison;

            if (name === undefined) {
                return true;
            }

            nameComparison = name.toString().toUpperCase().localeCompare(roomName);

            // skip this element
            if (nameComparison === 0) {
                return true;
            }

            // skip closed rooms which always go after unclosed ones
            if (!liRoomClosed && closed) {
                return true;
            }

            // skip where we have more occupants
            if (liRoomCount > count) {
                return true;
            }

            // skip where we have the same number of occupants but the room is alphabetically earlier
            if (liRoomCount === count && nameComparison < 0) {
                return true;
            }

            nextListElement = $this;
            return false;
        });

        return nextListElement;
    }
    
    function filterIndividualRoom($room) {
        var filter = $roomFilterInput.val().toUpperCase(),
            showClosedRooms = $closedRoomFilter.is(':checked');
        
        if ($room.data('room').toString().toUpperCase().score(filter) > 0.0 && (showClosedRooms || !$room.is('.closed'))) {
            $room.show();
        } else {
            $room.hide();
        }
    }

    function addRoom(roomViewModel) {
        // Do nothing if the room exists
        var roomName = roomViewModel.Name,
            room = getRoomElements(roomViewModel.Name),
            roomId = null,
            viewModel = null,
            $messages = null,
            $roomTopic = null,
            scrollHandler = null,
            userContainer = null,
            roomOwnersHeader = utility.getLanguageResource('Chat_UserOwnerHeader'),
            usersHeader = utility.getLanguageResource('Chat_UserHeader'),
            $tabsDropdown = $tabs.last();

        if (room.exists()) {
            return false;
        }

        roomId = getRoomId(roomName);

        // Add the tab
        viewModel = {
            id: roomId,
            name: roomName,
            closed: roomViewModel.Closed
        };

        if (!roomCache[roomName.toString().toUpperCase()]) {
            addRoomToLobby(roomViewModel);
        }
        
        templates.tab.tmpl(viewModel).data('name', roomName).appendTo($tabsDropdown);
        ui.updateTabOverflow();

        $messages = $('<ul/>').attr('id', 'messages-' + roomId)
                              .addClass('messages')
                              .appendTo($chatArea)
                              .hide();

        $('<div/>').attr('id', 'roomTopic-' + roomId)
                              .addClass('roomTopic')
                              .appendTo($chatArea)
                              .hide();

        userContainer = $('<div/>').attr('id', 'userlist-' + roomId)
            .addClass('users')
            .appendTo($chatArea).hide();
        templates.userlist.tmpl({ listname: roomOwnersHeader, id: 'userlist-' + roomId + '-owners' })
            .addClass('owners')
            .appendTo(userContainer);
        templates.userlist.tmpl({ listname: usersHeader, id: 'userlist-' + roomId + '-active' })
            .appendTo(userContainer);

        scrollHandler = function () {
            var messageId = null;

            // Do nothing if there's nothing else
            if ($(this).data('full') === true) {
                return;
            }

            // If you're we're near the top, raise the event, but if the scroll
            // bar is small enough that we're at the bottom edge, ignore it.
            // We have to use the ui version because the room object above is
            // not fully initialized, so there are no messages.
            if ($(this).scrollTop() <= scrollTopThreshold && !ui.isNearTheEnd(roomId)) {
                var $child = $messages.children('.message:first');
                if ($child.length > 0) {
                    messageId = $child.attr('id')
                                      .substr(2); // Remove the "m-"
                    $ui.trigger(ui.events.scrollRoomTop, [{ name: roomName, messageId: messageId }]);
                }
            }
        };

        // Hookup the scroll handler since event delegation doesn't work with scroll events
        $messages.bind('scroll', scrollHandler);

        // Store the scroll handler so we can remove it later
        $messages.data('scrollHandler', scrollHandler);

        setAccessKeys();

        lobbyLoaded = false;
        return true;
    }

    function removeRoom(roomName) {
        var room = getRoomElements(roomName),
            scrollHandler = null;

        if (room.exists()) {
            // Remove the scroll handler from this room
            scrollHandler = room.messages.data('scrollHandler');
            room.messages.unbind('scrollHandler', scrollHandler);

            room.tab.remove();
            room.messages.remove();
            room.users.remove();
            room.roomTopic.remove();
            setAccessKeys();
            
            ui.updateTabOverflow();
        }
    }

    function setAccessKeys() {
        $.each($tabs.find('li.room > a'), function (index, item) {
            if (index < 10) {
                $(item).attr('accesskey', ((index + 1) % 10).toString());
            } else {
                $(item).attr('accesskey', null);
            }
        });
    }

    function navigateToRoom(roomName) {
        var hash = (document.location.hash || '#').substr(1),
            hashRoomName = getRoomNameFromHash(hash);

        if (hashRoomName && hashRoomName === roomName) {
            ui.setActiveRoomCore(roomName);
        }
        else {
            document.location.hash = '#/rooms/' + roomName;
        }
    }

    function processMessage(message, roomName) {
        var collapseContent = shouldCollapseContent(message.message, roomName);

        message.when = message.date.formatTime(true);
        message.fulldate = message.date.toLocaleString();

        if (collapseContent) {
            message.message = collapseRichContent(message.message);
        }
    }

    function isFromCollapsibleContentProvider(content) {
        return content.indexOf('class="collapsible_box') > -1; // leaving off trailing " purposefully
    }

    function shouldCollapseContent(content, roomName) {
        var collapsible = isFromCollapsibleContentProvider(content),
            collapseForRoom = roomName ? getRoomPreference(roomName, 'blockRichness') : getActiveRoomPreference('blockRichness');

        return collapsible && collapseForRoom;
    }

    function collapseRichContent(content) {
        content = content.replace(/class="collapsible_box/g, 'style="display: none;" class="collapsible_box');
        return content.replace(/class="collapsible_title"/g, 'class="collapsible_title" title="' + utility.getLanguageResource('Content_DisabledMessage') + '"');
    }

    function triggerFocus() {
        if (!utility.isMobile && !readOnly) {
            if (getActiveRoomName() === 'Lobby') {
                $roomFilterInput.focus();
            } else {
                $newMessage.focus();
            }
        }

        if (focus === false) {
            focus = true;
            $ui.trigger(ui.events.focusit);
        }
    }

    function loadPreferences() {
        // Restore the global preferences
    }

    function toggleRichness($element, roomName) {
        var blockRichness = roomName ? getRoomPreference(roomName, 'blockRichness') : preferences.blockRichness;

        if (blockRichness === true) {
            $element.addClass('off');
        }
        else {
            $element.removeClass('off');
        }
    }

    function toggleElement($element, preferenceName, roomName) {
        var value = roomName ? getRoomPreference(roomName, preferenceName) : preferences[preferenceName];

        if (value === true) {
            $element.removeClass('off');
        }
        else {
            $element.addClass('off');
        }
    }

    function loadRoomPreferences(roomName) {
        // Placeholder for room level preferences
        toggleElement($sound, 'hasSound', roomName);
        toggleElement($toast, 'canToast', roomName);
        toggleRichness($richness, roomName);
    }

    function setRoomPreference(roomName, name, value) {
        var roomPreferences = preferences[getRoomPreferenceKey(roomName)];

        if (!roomPreferences) {
            roomPreferences = {};
            preferences[getRoomPreferenceKey(roomName)] = roomPreferences;
        }

        roomPreferences[name] = value;

        $ui.trigger(ui.events.preferencesChanged);
    }

    function getRoomPreference(roomName, name) {
        return (preferences[getRoomPreferenceKey(roomName)] || {})[name];
    }

    function getActiveRoomPreference(name) {
        var room = getCurrentRoomElements();
        return getRoomPreference(room.getName(), name);
    }

    function anyRoomPreference(name, value) {
        var rooms = $.map(getAllRoomElements(), function (r) { return "_room_" + r.getName(); });
        for (var key in preferences) {
            if (rooms.indexOf(key) !== -1) {
                if (preferences[key][name] === value) {
                    return true;
                }
            }
        }
        return false;
    }

    function triggerSend() {
        if (readOnly) {
            return;
        }

        var msg = $.trim($newMessage.val()),
            room = getCurrentRoomElements();

        focus = true;

        if (msg) {
            if (ui.isCommand(msg)) {
                if (!ui.confirmCommand(msg)) {
                    $ui.trigger(ui.events.sendMessage, [msg, null, true]);
                }
            } else {
                // if you're in the lobby, you can't send mesages (only commands)
                if (room.isLobby()) {
                    ui.addErrorToActiveRoom(utility.getLanguageResource('Chat_CannotSendLobby'));
                    return false;
                }

                // Added the message to the ui first
                var viewModel = {
                    name: ui.getUserName(),
                    hash: ui.getUserHash(),
                    message: ui.processContent(msg),
                    id: utility.newId(),
                    date: new Date(),
                    highlight: '',
                    isMine: true
                };

                ui.addChatMessage(viewModel, room.getName());

                $ui.trigger(ui.events.sendMessage, [msg, viewModel.id, false]);
            }
        }

        $newMessage.val('');
        $newMessage.focus();

        // always scroll to bottom after new message sent
        room.scrollToBottom();
        room.removeSeparator();
    }

    function updateNote(userViewModel, $user) {
        var $title = $user.find('.name'),
            noteText = userViewModel.note,
            noteTextEncoded = null,
            requireRoomUpdate = false;

        if (userViewModel.noteClass === 'afk') {
            noteText = userViewModel.note + ' (' + userViewModel.timeAgo + ')';
            requireRoomUpdate = ui.setUserInActive($user);
        }
        else if (userViewModel.active) {
            requireRoomUpdate = ui.setUserActive($user);
        }
        else {
            requireRoomUpdate = ui.setUserInActive($user);
        }

        noteTextEncoded = $('<div/>').html(noteText).text();

        // Remove all classes and the text
        $title.removeAttr('title');

        if (userViewModel.note) {
            $title.attr('title', noteTextEncoded);
        }

        if (requireRoomUpdate) {
            $user.each(function () {
                var room = getRoomElements($(this).data('inroom'));
                room.updateUserStatus($(this));
                room.sortLists($(this));
            });
        }
    }

    function updateFlag(userViewModel, $user) {
        var $flag = $user.find('.flag');

        $flag.removeAttr('class');
        $flag.addClass('flag');
        $flag.removeAttr('title');

        if (userViewModel.flagClass) {
            $flag.addClass(userViewModel.flagClass);
            $flag.show();
        } else {
            $flag.hide();
        }

        if (userViewModel.country) {
            $flag.attr('title', userViewModel.country);
        }
    }

    function updateRoomTopic(roomName, topic) {
        var room = getRoomElements(roomName);
        var topicHtml = topic === '' ? utility.getLanguageResource('Chat_DefaultTopic', roomName) : ui.processContent(topic);
        var roomTopic = room.roomTopic;
        var isVisibleRoom = getCurrentRoomElements().getName() === roomName;

        if (isVisibleRoom) {
            roomTopic.hide();
        }

        roomTopic.html(topicHtml);

        if (isVisibleRoom) {
            roomTopic.fadeIn(2000);
        }
    }

    function getConnectionStateChangedPopoverOptions(statusText) {
        var options = {
            html: true,
            trigger: 'hover',
            template: $connectionStateChangedPopover,
            content: function () {
                return statusText;
            }
        };
        return options;
    }

    function getConnectionInfoPopoverOptions(transport) {
        var options = {
            html: true,
            trigger: 'hover',
            delay: {
                show: 0,
                hide: 500
            },
            template: $connectionInfoPopover,
            content: function () {
                var connectionInfo = $connectionInfoContent;
                connectionInfo.find(connectionInfoStatus).text(utility.getLanguageResource('Client_ConnectedStatus'));
                connectionInfo.find(connectionInfoTransport).text(utility.getLanguageResource('Client_Transport', transport));
                return connectionInfo.html();
            }
        };
        return options;
    }

    function loadMoreLobbyRooms() {
        var lobby = getLobby(),
            moreRooms = publicRoomList.slice(lastLoadedRoomIndex, lastLoadedRoomIndex + maxRoomsToLoad);

        populateLobbyRoomList(moreRooms, templates.lobbyroom, lobby.users);
        lastLoadedRoomIndex = lastLoadedRoomIndex + maxRoomsToLoad;
        
        // re-filter lists
        $lobbyRoomFilterForm.submit();
    }

    var ui = {

        //lets store any events to be triggered as constants here to aid intellisense and avoid
        //string duplication everywhere
        events: {
            closeRoom: 'jabbr.ui.closeRoom',
            prevMessage: 'jabbr.ui.prevMessage',
            openRoom: 'jabbr.ui.openRoom',
            nextMessage: 'jabbr.ui.nextMessage',
            activeRoomChanged: 'jabbr.ui.activeRoomChanged',
            scrollRoomTop: 'jabbr.ui.scrollRoomTop',
            typing: 'jabbr.ui.typing',
            sendMessage: 'jabbr.ui.sendMessage',
            focusit: 'jabbr.ui.focusit',
            blurit: 'jabbr.ui.blurit',
            preferencesChanged: 'jabbr.ui.preferencesChanged',
            loggedOut: 'jabbr.ui.loggedOut',
            reloadMessages: 'jabbr.ui.reloadMessages',
            fileUploaded: 'jabbr.ui.fileUploaded',
            tabOrderChanged: 'jabbr.ui.tabOrderChanged'
        },

        help: {
            shortcut: 'shortcut',
            global: 'global',
            room: 'room',
            user: 'user'
        },

        initialize: function (state) {
            $ui = $(this);
            preferences = state || {};
            $chatArea = $('#chat-area');
            $tabs = $('#tabs, #tabs-dropdown');
            $submitButton = $('#send');
            $newMessage = $('#new-message');
            $roomActions = $('#room-actions');
            $toast = $('#room-preferences .toast');
            $sound = $('#room-preferences .sound');
            $richness = $('#room-preferences .richness');
            $downloadIcon = $('#room-preferences .download');
            $downloadDialog = $('#download-dialog');
            $downloadDialogButton = $('#download-dialog-button');
            $downloadRange = $('#download-range');
            $logout = $('#preferences .logout');
            $help = $('#preferences .help');
            $disconnectDialog = $('#disconnect-dialog');
            $helpPopup = $('#jabbr-help');
            $helpBody = $('#jabbr-help .help-body');
            $shortCutHelp = $('#jabbr-help #shortcut');
            $globalCmdHelp = $('#jabbr-help #global');
            $roomCmdHelp = $('#jabbr-help #room');
            $userCmdHelp = $('#jabbr-help #user');
            $updatePopup = $('#jabbr-update');
            focus = true;
            $lobbyRoomFilterForm = $('#room-filter-form');
            $roomFilterInput = $('#room-filter');
            $closedRoomFilter = $('#room-filter-closed');
            templates = {
                userlist: $('#new-userlist-template'),
                user: $('#new-user-template'),
                message: $('#new-message-template'),
                notification: $('#new-notification-template'),
                separator: $('#message-separator-template'),
                tab: $('#new-tab-template'),
                gravatarprofile: $('#gravatar-profile-template'),
                commandhelp: $('#command-help-template'),
                multiline: $('#multiline-content-template'),
                lobbyroom: $('#new-lobby-room-template'),
                otherlobbyroom: $('#new-other-lobby-room-template'),
                commandConfirm: $('#command-confirm-template'),
                modalMessage: $('#modal-message-template')
            };
            $reloadMessageNotification = $('#reloadMessageNotification');
            $fileUploadButton = $('.upload-button');
            $hiddenFile = $('#hidden-file');
            $fileRoom = $('#file-room');
            $fileConnectionId = $('#file-connection-id');
            $connectionStatus = $('#connectionStatus');

            $connectionStateChangedPopover = $('#connection-state-changed-popover');
            connectionStateIcon = '#popover-content-icon';
            $connectionInfoPopover = $('#connection-info-popover');
            $connectionInfoContent = $('#connection-info-content');
            connectionInfoStatus = '#connection-status';
            connectionInfoTransport = '#connection-transport';
            $loadingHistoryIndicator = $('#loadingRoomHistory');

            $loadMoreRooms = $('#load-more-rooms-item');
            $lobbyPrivateRooms = $('#lobby-private');
            $lobbyOtherRooms = $('#lobby-other');
            $roomLoadingIndicator = $('#room-loading');
            $splashScreen = $('#splash-screen');

            $unreadNotificationCount = $('#notification-unread-count');

            $createRoomButton = $('#create-room');
            
            if (toast.canToast()) {
                $toast.show();
            }
            else {
                $richness.css({ left: '55px' });
                $downloadIcon.css({ left: '90px' });
                // We need to set the toast setting to false
                preferences.canToast = false;
                $toast.hide();
            }

            // DOM events
            $document.on('click', 'h3.collapsible_title', function () {
                var nearEnd = ui.isNearTheEnd();

                $(this).next().toggle(0, function () {
                    if (nearEnd) {
                        ui.scrollToBottom();
                    }
                });
            });

            var activateOrOpenRoom = function(roomName) {
                var room = getRoomElements(roomName);

                if (room.exists()) {
                    if (room.isInitialized()) {
                        ui.setRoomLoading(false);
                    } else {
                        ui.setRoomLoading(true, roomName);
                    }
                    ui.setActiveRoom(roomName);
                }
                else {
                    $ui.trigger(ui.events.openRoom, [roomName]);
                }
            };
            
            $document.on('click', 'li.room .room-row', function () {
                var roomName = $(this).parent().data('name');
                activateOrOpenRoom(roomName);
            });
            
            $roomFilterInput.keypress(function (ev) {
                var key = ev.keyCode || ev.which,
                    roomName = $(this).val();
                
                switch (key) {
                    case Keys.Enter:
                        // only if it's an exact match
                        if (roomCache[roomName.toUpperCase()]) {
                            activateOrOpenRoom(roomName);
                            return;
                        }
                }
            });
            
            $document.on('click', '#tabs li, #tabs-dropdown li', function () {
                var roomName = $(this).data('name');
                activateOrOpenRoom(roomName);
            });

            $document.on('mousedown', '#tabs li.room, #tabs-dropdown li.room', function (ev) {
                // if middle mouse
                if (ev.which === 2) {
                    $ui.trigger(ui.events.closeRoom, [$(this).data('name')]);
                }
            });

            $document.on('click', '#load-more-rooms-item', function () {
                var spinner = $loadMoreRooms.find('i');
                spinner.addClass('icon-spin');
                spinner.show();
                var loader = $loadMoreRooms.find('.load-more-rooms a');
                loader.html(' ' + utility.getLanguageResource('LoadingMessage'));
                loadMoreLobbyRooms();
                spinner.hide();
                spinner.removeClass('icon-spin');
                loader.html(utility.getLanguageResource('Client_LoadMore'));
                if (lastLoadedRoomIndex < publicRoomList.length) {
                    $loadMoreRooms.show();
                } else {
                    $loadMoreRooms.hide();
                }
            });

            $document.on('click', '#tabs li .close, #tabs-dropdown li .close', function (ev) {
                var roomName = $(this).closest('li').data('name');

                $ui.trigger(ui.events.closeRoom, [roomName]);

                ev.preventDefault();
                return false;
            });

            $('#tabs, #tabs-dropdown').dragsort({
                placeHolderTemplate: '<li class="room placeholder"><a><span class="content"></span></a></li>',
                dragBetween: true,
                dragStart: function () {
                    var roomName = $(this).closest('li').data('name'),
                        closeButton = $(this).find('.close');

                    // if we have a close that we're over, close the window and bail, otherwise activate the tab
                    if (closeButton.length > 0 && closeButton.is(':hover')) {
                        $ui.trigger(ui.events.closeRoom, [roomName]);
                        return false;
                    } else {
                        activateOrOpenRoom(roomName);
                    }
                },
                dragEnd: function () {
                    var roomTabOrder = [],
                        $roomTabs = $('#tabs li, #tabs-dropdown li');
                    
                    for (var i = 0; i < $roomTabs.length; i++) {
                        roomTabOrder[i] = $($roomTabs[i]).data('name');
                    }
                    
                    $ui.trigger(ui.events.tabOrderChanged, [roomTabOrder]);
                    
                    // check for tab overflow for one edge case - sort order hasn't changed but user 
                    // dragged the last item in the main list to be the first item in the dropdown.
                    ui.updateTabOverflow();
                }
            });

            // handle click on notifications
            $document.on('click', '.notification a.info', function () {
                var $notification = $(this).closest('.notification');

                if ($(this).hasClass('collapse')) {
                    ui.collapseNotifications($notification);
                }
                else {
                    ui.expandNotifications($notification);
                }
            });

            $document.on('click', '#reloadMessageNotification a', function () {
                $ui.trigger(ui.events.reloadMessages);
            });

            // handle tab cycling - we skip the lobby when cycling
            // handle shift+/ - display help command
            $document.on('keydown', function (ev) {
                // ctrl + tab event is sent to the page in firefox when the user probably means to change browser tabs
                if (ev.keyCode === Keys.Tab && !ev.ctrlKey && $newMessage.val() === "") {
                    var current = getCurrentRoomElements(),
                        index = current.tab.index(),
                        tabCount = $tabs.children().length - 1;

                    if (!ev.shiftKey) {
                        // Next tab
                        index = index % tabCount + 1;
                    } else {
                        // Prev tab
                        index = (index - 1) || tabCount;
                    }

                    ui.setActiveRoom($tabs.children().eq(index).data('name'));
                    if (!readOnly) {
                        $newMessage.focus();
                    }
                }

                if (!$newMessage.is(':focus') && ev.shiftKey && ev.keyCode === Keys.Question) {
                    ui.showHelp();
                    // Prevent the ? be recorded in the message box
                    ev.preventDefault();
                }
            });

            // hack to get Chrome to scroll back to top of help body
            // when redisplaying it after scrolling down and closing it
            $helpPopup.on('hide', function () {
                $helpBody.scrollTop(0);
            });

            // set the height of the help body when displaying the help dialog
            // so that the scroll bar does not block the rounded corners
            $helpPopup.on('show', function () {
                if (helpHeight === 0) {
                    helpHeight = $helpPopup.height() - $helpBody.position().top - 10;
                }
                $helpBody.css('height', helpHeight);
            });

            // handle click on names in chat / room list
            var prepareMessage = function () {
                if (readOnly) {
                    return false;
                }

                var message = $newMessage.val().trim();

                // If it was a message to another person, replace that
                if (message.indexOf('/msg') === 0) {
                    message = message.replace(/^\/msg \S+/, '');
                }

                // Re-focus because we lost it on the click
                $newMessage.focus();

                // Do not convert this to a message if it is a command
                if (message[0] === '/') {
                    return false;
                }

                // Prepend our target username
                message = '@' + $(this).text().trim() + ' ' + message;
                ui.setMessage(message);
                return false;
            };
            $document.on('click', '.users li.user .name', prepareMessage);
            $document.on('click', '.message .left .name', prepareMessage);

            $document.on('click', '.resend', function () {
                var $msg = $(this).parents('.message'),
                    id = $msg.attr('id').slice(2),
                    msg = ui.processContent($msg.find('.middle').text());

                $msg.removeClass('failed');
                $ui.trigger(ui.events.sendMessage, [msg, id, false]);
            });

            $submitButton.click(function (ev) {
                triggerSend();

                ev.preventDefault();
                return false;
            });

            $sound.click(function () {
                var room = getCurrentRoomElements();

                if (room.isLobby()) {
                    return;
                }

                $(this).toggleClass('off');

                var enabled = !$(this).hasClass('off');

                // Store the preference
                setRoomPreference(room.getName(), 'hasSound', enabled);
            });

            $richness.click(function () {
                var room = getCurrentRoomElements(),
                    $richContentMessages = room.messages.find('h3.collapsible_title');

                if (room.isLobby()) {
                    return;
                }

                $(this).toggleClass('off');

                var enabled = !$(this).hasClass('off');

                // Store the preference
                setRoomPreference(room.getName(), 'blockRichness', !enabled);

                // toggle all rich-content for current room
                $richContentMessages.each(function () {
                    var $this = $(this),
                        isCurrentlyVisible = $this.next().is(":visible");

                    if (enabled) {
                        $this.attr('title', utility.getLanguageResource('Content_DisabledMessage'));
                    } else {
                        $this.removeAttr('title');
                    }

                    if (isCurrentlyVisible ^ enabled) {
                        $this.trigger('click');
                    }
                });
            });

            $toast.click(function () {
                var $this = $(this),
                    enabled = !$this.hasClass('off'),
                    room = getCurrentRoomElements();

                if (room.isLobby()) {
                    return;
                }

                if (enabled) {
                    // If it's enabled toggle the preference
                    setRoomPreference(room.getName(), 'canToast', false);
                    $this.toggleClass('off');
                }
                else {
                    toast.enableToast()
                    .done(function () {
                        setRoomPreference(room.getName(), 'canToast', true);
                        $this.removeClass('off');
                    })
                    .fail(function () {
                        setRoomPreference(room.getName(), 'canToast', false);
                        $this.addClass('off');
                    });
                }
            });

            $(toast).bind('toast.focus', function (ev, room) {
                window.focus();

                // focus on the room
                activateOrOpenRoom(room);
            });

            $downloadIcon.click(function () {
                var room = getCurrentRoomElements();

                if (room.isLobby() || room.isLocked()) {
                    var title = utility.getLanguageResource('Client_DownloadMessages');
                    var message = utility.getLanguageResource('Client_DownloadMessagesNotOpen', room.getName());
                    ui.addModalMessage(title, message, 'icon-cloud-download');
                    return;
                }

                $downloadDialog.modal({ backdrop: true, keyboard: true });
            });

            $downloadDialogButton.click(function () {
                var room = getCurrentRoomElements();

                var url = document.location.href;
                var nav = url.indexOf('#');
                url = nav > 0 ? url.substring(0, nav) : url;
                url = url.replace('default.aspx', '');
                url += 'api/v1/messages/' +
                       encodeURI(room.getName()) +
                       '?download=true&range=' +
                       encodeURIComponent($downloadRange.val());

                $('<iframe style="display:none">').attr('src', url).appendTo(document.body);

                $downloadDialog.modal('hide');
            });

            $createRoomButton.click(function () {              
                var roomName = prompt(utility.getLanguageResource('Create_CommandInfo'), ''),
                    msg = '/create ' + roomName;
                if (roomName === null) {
                    return false;
                }
                else if (roomName === '') {
                    alert(utility.getLanguageResource('RoomNameCannotBeBlank'));
                }
                else if (/\s/.test(roomName)) {
                    alert(utility.getLanguageResource('RoomNameCannotContainSpaces'));
                }
                else {
                    $ui.trigger(ui.events.sendMessage, [msg, null, true]);
                }
            });

            $logout.click(function () {
                $ui.trigger(ui.events.loggedOut);
            });

            $help.click(function () {
                ui.showHelp();
            });
            
            $roomFilterInput.bind('input', function () { $lobbyRoomFilterForm.submit(); })
                .keyup(function () { $lobbyRoomFilterForm.submit(); });

            $closedRoomFilter.click(function() { $lobbyRoomFilterForm.submit(); });

            $lobbyRoomFilterForm.submit(function () {
                var room = getCurrentRoomElements(),
                    $lobbyRoomsLists = $lobbyPrivateRooms.add($lobbyOtherRooms);

                // hide all elements except those that match the input / closed filters
                $lobbyRoomsLists
                    .find('li:not(.empty)')
                    .each(function () { filterIndividualRoom($(this)); });
                
                $lobbyRoomsLists.find('ul').each(function () {
                    room.setListState($(this));
                });
                return false;
            });

            $window.blur(function () {
                focus = false;
                $ui.trigger(ui.events.blurit);
            });

            $window.focus(function () {
                // clear unread count in active room
                var room = getCurrentRoomElements();
                room.makeActive();

                ui.updateTabOverflow();

                triggerFocus();
            });

            $window.resize(function () {
                var room = getCurrentRoomElements();
                room.scrollToBottom();
                ui.updateTabOverflow();
            });

            $newMessage.keydown(function (ev) {
                var key = ev.keyCode || ev.which;
                switch (key) {
                    case Keys.Up:
                        if (cycleMessage(ui.events.prevMessage)) {
                            ev.preventDefault();
                        }
                        break;
                    case Keys.Down:
                        if (cycleMessage(ui.events.nextMessage)) {
                            ev.preventDefault();
                        }
                        break;
                    case Keys.Esc:
                        $(this).val('');
                        break;
                    case Keys.Enter:
                        triggerSend();
                        ev.preventDefault();
                        return false;
                    case Keys.Space:
                        // Check for "/r " to reply to last private message
                        if ($(this).val() === "/r" && lastPrivate) {
                            ui.setMessage("/msg " + lastPrivate);
                        }
                        break;
                }
            });

            // Returns true if a cycle was triggered
            function cycleMessage(messageHistoryDirection) {
                var currentMessage = $newMessage[0].value;
                if (currentMessage.length === 0 || lastCycledMessage === currentMessage) {
                    $ui.trigger(messageHistoryDirection);
                    return true;
                }
                return false;
            }

            // Auto-complete for user names
            $newMessage.autoTabComplete({
                prefixMatch: '[@#/:]',
                get: function (prefix) {
                    switch (prefix) {
                        case '@':
                            var room = getCurrentRoomElements();
                            // exclude current username from autocomplete
                            return room.users.find('li[data-name != "' + ui.getUserName() + '"]')
                                         .not('.room')
                                         .map(function () {
                                             if ($(this).data('name')) {
                                                 return $(this).data('name') + ' ';
                                             }

                                             return '';
                                         })
                                         .sort(function(a, b) {
                                             return a.toString().toUpperCase().localeCompare(b.toString().toUpperCase());
                                         });
                        case '#':
                            return getRooms()
                                .map(function (room) { return room.Name + ' '; });

                        case '/':
                            return ui.getCommands()
                                .map(function (cmd) { return cmd.Name + ' '; });

                        case ':':
                            return emoji.getIcons();
                        default:
                            return [];
                    }
                }
            });

            $newMessage.keypress(function (ev) {
                var key = ev.keyCode || ev.which;
                if ($newMessage.val()[0] === '/' || key === Keys.Slash) {
                    return;
                }
                switch (key) {
                    case Keys.Up:
                    case Keys.Down:
                    case Keys.Esc:
                    case Keys.Enter:
                        break;
                    default:
                        $ui.trigger(ui.events.typing);
                        break;
                }
            });

            if (!readOnly) {
                $newMessage.focus();
            }

            // Make sure we can toast at all
            toast.ensureToast(preferences);

            // Load preferences
            loadPreferences();

            // Configure livestamp to only update every 30s since display granularity is by minute anyway (saves CPU cycles)
            $.livestamp.interval(30 * 1000);

            setInterval(function () {
                ui.trimRoomMessageHistory();
            }, trimRoomHistoryFrequency);
        },
        
        run: function () {
            $.history.init(function (hash) {
                var roomName = getRoomNameFromHash(hash);

                if (roomName) {
                    if (ui.setActiveRoomCore(roomName) === false && roomName !== 'Lobby') {
                        $ui.trigger(ui.events.openRoom, [roomName]);
                    }
                }
            });
        },
        setMessage: function (value) {
            $newMessage.val(value);
            lastCycledMessage = value;
            if (value) {
                $newMessage.selectionEnd = value.length;
            }
        },
        addRoom: addRoom,
        removeRoom: removeRoom,
        setRoomOwner: function (ownerName, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUser(ownerName);
            $user
                .attr('data-owner', true)
                .data('owner', true);
            room.updateUserStatus($user);
        },
        clearRoomOwner: function (ownerName, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUser(ownerName);
            $user
                 .removeAttr('data-owner')
                 .data('owner', false);
            room.updateUserStatus($user);
        },
        setActiveRoom: navigateToRoom,
        setActiveRoomCore: function (roomName) {
            var room = getRoomElements(roomName);

            loadRoomPreferences(roomName);

            if (room.isActive()) {
                // Still trigger the event (just do less overall work)
                $ui.trigger(ui.events.activeRoomChanged, [roomName]);
                return true;
            }

            var currentRoom = getCurrentRoomElements();

            if (room.exists()) {
                if (currentRoom.exists()) {
                    currentRoom.makeInactive();
                    if (currentRoom.isLobby()) {
                        $lobbyRoomFilterForm.hide();
                        $roomActions.show();
                        $createRoomButton.hide();
                    }
                }

                room.makeActive();
                
                ui.updateTabOverflow();

                if (room.isLobby()) {
                    $roomActions.hide();
                    $createRoomButton.show();
                    $lobbyRoomFilterForm.show();

                    room.messages.hide();
                }

                ui.toggleDownloadButton(room.isLocked());

                ui.toggleMessageSection(room.isClosed());

                $ui.trigger(ui.events.activeRoomChanged, [roomName]);
                triggerFocus();
                setRoomLoading(false);
                return true;
            }

            return false;
        },
        setRoomLocked: function (roomName) {
            var room = getRoomElements(roomName);

            room.setLocked();

            ui.toggleDownloadButton(true);
        },
        setRoomClosed: function (roomName) {
            var room = getRoomElements(roomName);

            room.close();
        },
        updateLobbyRoom: updateLobbyRoom,
        updatePrivateLobbyRooms: function (roomName) {
            var lobby = getLobby(),
                $room = lobby.users.find('li[data-name="' + roomName + '"]');

            $room.addClass('locked').appendTo(lobby.owners);
        },
        updateUnread: function (roomName, isMentioned) {
            var room = roomName ? getRoomElements(roomName) : getCurrentRoomElements();

            if (ui.hasFocus() && room.isActive()) {
                return;
            }

            room.updateUnread(isMentioned);
            ui.updateTabOverflow();
        },
        scrollToBottom: function (roomName) {
            var room = roomName ? getRoomElements(roomName) : getCurrentRoomElements();

            if (room.isActive()) {
                room.scrollToBottom();
            }
        },
        watchMessageScroll: function (messageIds, roomName) {
            // Given an array of message ids, if there is any embedded content
            // in it, it may cause the window to scroll off of the bottom, so we
            // can watch for that and correct it.
            messageIds = $.map(messageIds, function (id) { return '#m-' + id; });

            var $messages = $(messageIds.join(',')),
                $content = $messages.expandableContent(),
                room = getRoomElements(roomName),
                nearTheEndBefore = room.messages.isNearTheEnd(),
                scrollTopBefore = room.messages.scrollTop();

            if (nearTheEndBefore && $content.length > 0) {
                // Note that the load event does not bubble, so .on() is not
                // suitable here.
                $content.load(function (event) {
                    // If we used to be at the end and our scrollTop() did not
                    // change, then we can safely call scrollToBottom() without
                    // worrying about interrupting the user. We skip this if the
                    // room is already at the end in the event of multiple
                    // images loading at the same time.
                    if (!room.messages.isNearTheEnd() && scrollTopBefore === room.messages.scrollTop()) {
                        room.scrollToBottom();
                        // Reset our scrollTopBefore so we know we are allowed
                        // to move it again if another image loads and the user
                        // hasn't touched it
                        scrollTopBefore = room.messages.scrollTop();
                    }

                    // unbind the event from this object after it executes
                    $(this).unbind(event);
                });
            }
        },
        isNearTheEnd: function (roomName) {
            var room = roomName ? getRoomElements(roomName) : getCurrentRoomElements();

            return room.isNearTheEnd();
        },
        setRoomLoading: setRoomLoading,
        populateLobbyRooms: function (rooms, privateRooms) {
            var lobby = getLobby(),
                i;
            if (!lobby.isInitialized()) {
                
                // Process the topics
                for (i = 0; i < rooms.length; ++i) {
                    rooms[i].processedTopic = ui.processContent(rooms[i].Topic);
                }
                
                for (i = 0; i < privateRooms.length; ++i) {
                    privateRooms[i].processedTopic = ui.processContent(privateRooms[i].Topic);
                }

                // Populate the room cache
                for (i = 0; i < rooms.length; ++i) {
                    roomCache[rooms[i].Name.toString().toUpperCase()] = true;
                }

                for (i = 0; i < privateRooms.length; ++i) {
                    roomCache[privateRooms[i].Name.toString().toUpperCase()] = true;
                }

                // sort private lobby rooms
                var privateSorted = sortRoomList(privateRooms);
                
                // sort other lobby rooms but filter out private rooms
                publicRoomList = sortRoomList(rooms).filter(function (room) {
                    return !privateSorted.some(function (allowed) {
                        return allowed.Name === room.Name;
                    });
                });

                sortedRoomList = rooms.sort(function(a, b) {
                    return a.Name.toString().toUpperCase().localeCompare(b.Name.toString().toUpperCase());
                });

                lobby.owners.empty();
                lobby.users.empty();

                var listOfPrivateRooms = $('<ul/>');
                if (privateSorted.length > 0) {
                    populateLobbyRoomList(privateSorted, templates.lobbyroom, listOfPrivateRooms);
                    listOfPrivateRooms.children('li').appendTo(lobby.owners);
                    $lobbyPrivateRooms.show();
                    $lobbyOtherRooms.find('.nav-header').html(utility.getLanguageResource('Client_OtherRooms'));
                } else {
                    $lobbyPrivateRooms.hide();
                    $lobbyOtherRooms.find('.nav-header').html(utility.getLanguageResource('Client_Rooms'));
                }

                var listOfRooms = $('<ul/>');
                populateLobbyRoomList(publicRoomList.slice(0, maxRoomsToLoad), templates.lobbyroom, listOfRooms);
                lastLoadedRoomIndex = listOfRooms.children('li').length;
                listOfRooms.children('li').appendTo(lobby.users);
                if (lastLoadedRoomIndex < publicRoomList.length) {
                    $loadMoreRooms.show();
                }
                $lobbyOtherRooms.show();
            }

            if (lobby.isActive()) {
                // update cache of room names
                $lobbyRoomFilterForm.show();
            }

            // re-filter lists
            $lobbyRoomFilterForm.submit();
        },
        removeLobbyRoom: function (roomName) {
            var roomNameUppercase = roomName.toString().toUpperCase(),
                i = null;
            
            if (roomCache[roomNameUppercase]) {
                delete roomCache[roomNameUppercase];
            }
            
            // find the element in the sorted room list and remove it
            for (i = 0; i < sortedRoomList.length; i++) {
                if (sortedRoomList[i].Name.toString().toUpperCase().localeCompare(roomNameUppercase) === 0) {
                    sortedRoomList.splice(i, 1);
                    break;
                }
            }
            
            // find the element in the lobby public room list and remove it
            for (i = 0; i < publicRoomList.length; i++) {
                if (publicRoomList[i].Name.toString().toUpperCase().localeCompare(roomNameUppercase) === 0) {
                    publicRoomList.splice(i, 1);
                    break;
                }
            }
            
            // remove the items from the lobby screen
            var lobby = getLobby(),
                $room = lobby.users.add(lobby.owners).find('[data-room="' + roomName + '"]');
            $room.remove();
            
            // if we have no private rooms, hide the private rooms section and change the text on the rooms header
            if (lobby.owners.find('li:not(.empty)').length === 0) {
                $lobbyPrivateRooms.hide();
                $lobbyOtherRooms.find('.nav-header').html(utility.getLanguageResource('Client_Rooms'));
            }
        },
        addUser: function (userViewModel, roomName) {
            var room = getRoomElements(roomName),
                $user = null,
                $userMessages = room.messages.find('.message-user' + getUserClassName(userViewModel.name));

            // Remove all users that are being removed
            room.users.find('.removing').remove();

            // Get the user element
            $user = room.getUser(userViewModel.name);

            if ($user.length) {
                return false;
            }

            $user = templates.user.tmpl(userViewModel);
            $user.data('inroom', roomName);
            $user.data('owner', userViewModel.owner);
            $user.data('admin', userViewModel.admin);

            $userMessages.removeClass('offline active inactive absent present').addClass('active present');

            room.addUser(userViewModel, $user);
            updateNote(userViewModel, $user);
            updateFlag(userViewModel, $user);

            return true;
        },
        setUserActivity: function (userViewModel) {
            var $user = $('.users .user' + getUserClassName(userViewModel.name)),
                $inactiveSince = $user.find('.inactive-since');

            if (userViewModel.active === true && userViewModel.afk === false) {
                if ($user.hasClass('inactive')) {
                    $user.removeClass('inactive');
                    $inactiveSince.livestamp('destroy');
                }

                $('.message-user' + getUserClassName(userViewModel.name))
                    .removeClass('offline inactive')
                    .addClass('active');
            } else {
                if (!$user.hasClass('inactive')) {
                    $user.addClass('inactive');
                    
                    $('.message-user' + getUserClassName(userViewModel.name))
                        .removeClass('offline active')
                        .addClass('inactive');
                }

                if (!$inactiveSince.html()) {
                    $inactiveSince.livestamp(userViewModel.lastActive);
                }
            }

            updateNote(userViewModel, $user);
        },
        setUserActive: function ($user) {
            var $inactiveSince = $user.find('.inactive-since'),
                $userMessages = $('.message-user' + getUserClassName($user.data('name')));
            
            if ($user.data('active') === true) {
                return false;
            }
            $user.attr('data-active', true);
            $user.data('active', true);
            $user.removeClass('inactive');
            if ($inactiveSince.livestamp('isLiveStamp')) {
                $inactiveSince.livestamp('destroy');
            }
            
            $userMessages.removeClass('offline active inactive').addClass('active');

            return true;
        },
        setUserInActive: function ($user) {
            var $userMessages = $('.message-user' + getUserClassName($user.data('name'))),
                $inactiveSince = $user.find('.inactive-since');
            
            if ($user.data('active') === false) {
                return false;
            }
            $user.attr('data-active', false);
            $user.data('active', false);
            $user.addClass('inactive');
            
            if (!$inactiveSince.html()) {
                $inactiveSince.livestamp(new Date());
            }
            
            $userMessages.removeClass('offline active inactive').addClass('inactive');
            
            return true;
        },
        changeUserName: function (oldName, user, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUserReferences(oldName),
                $userListUser = room.getUser(oldName);

            // Update the user's name
            $user.find('.name').fadeOut('normal', function () {
                $(this).html(user.Name);
                $(this).fadeIn('normal');
            });
            $user.data('name', user.Name);
            $user.attr('data-name', user.Name);
            room.sortLists($userListUser);
        },
        changeGravatar: function (user, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUserReferences(user.Name),
                src = 'https://secure.gravatar.com/avatar/' + user.Hash + '?s=16&d=mm',
                lrgSrc = 'https://secure.gravatar.com/avatar/' + user.Hash + '?s=96&d=mm';

            $user.find('.gravatar-wrapper .gravatar')
                 .attr('src', src);

            $user.find('.gravatar-wrapper .jabbr-user-card .gravatar-large')
                 .attr('src', lrgSrc);
        },
        showGravatarProfile: function (profile) {
            var room = getCurrentRoomElements(),
                nearEnd = ui.isNearTheEnd();

            this.appendMessage(templates.gravatarprofile.tmpl(profile), room);
            if (nearEnd) {
                ui.scrollToBottom();
            }
        },
        removeUser: function (user, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUser(user.Name),
                $userMessages = room.messages.find(getUserClassName(user.Name));

            $user.addClass('removing')
                .fadeOut('slow', function () {
                    var owner = $user.data('owner') || false;
                    $(this).remove();

                    if (owner === true) {
                        room.setListState(room.owners);
                    } else {
                        room.setListState(room.activeUsers);
                    }
                });
            
            $userMessages.find('.user').removeClass('absent present').addClass('absent');
        },
        setUserTyping: function (userViewModel, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUser(userViewModel.name),
                timeout = null;

            // if the user is somehow missing from room, add them
            if ($user.length === 0) {
                ui.addUser(userViewModel, roomName);
            }

            // Do not show typing indicator for current user
            if (userViewModel.name === ui.getUserName()) {
                return;
            }

            // Mark the user as typing
            $user.addClass('typing');
            var oldTimeout = $user.data('typing');

            if (oldTimeout) {
                clearTimeout(oldTimeout);
            }

            timeout = window.setTimeout(function () {
                $user.removeClass('typing');
            },
            3000);

            $user.data('typing', timeout);
        },
        setLoadingHistory: function (loadingHistory) {
            if (loadingHistory) {
                var room = getCurrentRoomElements();
                $loadingHistoryIndicator.appendTo(room.messages);
                $loadingHistoryIndicator.fadeIn('slow');
            } else {
                $loadingHistoryIndicator.hide();
            }
        },
        setRoomTrimmable: function (roomName, canTrimMessages) {
            var room = getRoomElements(roomName);
            room.setTrimmable(canTrimMessages);
        },
        prependChatMessages: function (messages, roomName) {
            var room = getRoomElements(roomName),
                $messages = room.messages,
                $target = $messages.children().first(),
                $previousMessage = null,
                previousUser = null,
                previousTimestamp = new Date().addDays(1); // Tomorrow so we always see a date line

            if (messages.length === 0) {
                // Mark this list as full
                $messages.data('full', true);
                return;
            }

            // If our top message is a date header, it might be incorrect, so we
            // check to see if we should remove it so that it can be inserted
            // again at a more appropriate time.
            if ($target.is('.list-header.date-header')) {
                var postedDate = new Date($target.text()).toDate();
                var lastPrependDate = messages[messages.length - 1].date.toDate();

                if (!lastPrependDate.diffDays(postedDate)) {
                    $target.remove();
                    $target = $messages.children().first();
                }
            }

            // Populate the old messages
            $.each(messages, function () {
                processMessage(this, roomName);

                if ($previousMessage) {
                    previousUser = $previousMessage.data('name');
                    previousTimestamp = new Date($previousMessage.data('timestamp') || new Date());
                }

                if (this.date.toDate().diffDays(previousTimestamp.toDate())) {
                    ui.addMessageBeforeTarget(this.date.toLocaleDateString(), 'list-header', $target)
                      .addClass('date-header')
                      .find('.right').remove(); // remove timestamp on date indicator

                    // Force a user name to show after the header
                    previousUser = null;
                }

                // Determine if we need to show the user
                this.showUser = !previousUser || previousUser !== this.name;

                // Render the new message
                $target.before(templates.message.tmpl(this));

                if (this.showUser === false) {
                    $previousMessage.addClass('continue');
                }

                $previousMessage = $('#m-' + this.id);
            });

            // If our old top message is a message from the same user as the
            // last message in our prepended history, we can remove information
            // and continue
            if ($target.is('.message') && $target.data('name') === $previousMessage.data('name')) {
                $target.find('.left').children().not('.state').remove();
                $previousMessage.addClass('continue');
            }

            // Scroll to the bottom element so the user sees there's more messages
            $target[0].scrollIntoView();
        },
        addChatMessage: function (message, roomName) {
            var room = getRoomElements(roomName),
                $previousMessage = room.messages.children().last(),
                previousUser = null,
                previousTimestamp = new Date().addDays(1), // Tomorrow so we always see a date line
                showUserName = true,
                isMention = message.highlight,
                isNotification = message.messageType === 1;

            // bounce out of here if the room is closed
            if (room.isClosed()) {
                return;
            }

            if ($previousMessage.length > 0) {
                previousUser = $previousMessage.data('name');
                previousTimestamp = new Date($previousMessage.data('timestamp') || new Date());
            }

            // Force a user name to show if a header will be displayed
            if (message.date.toDate().diffDays(previousTimestamp.toDate())) {
                previousUser = null;
            }

            // Determine if we need to show the user name next to the message
            showUserName = previousUser !== message.name && !isNotification;
            message.showUser = showUserName;

            processMessage(message, roomName);

            if (showUserName === false) {
                $previousMessage.addClass('continue');
            }

            // check to see if room needs a separator
            if (room.needsSeparator()) {
                // if there's an existing separator, remove it
                if (room.hasSeparator()) {
                    room.removeSeparator();
                }
                room.addSeparator();
            }

            if (isNotification === true) {
                var model = {
                    id: message.id,
                    content: message.message,
                    img: message.imageUrl,
                    source: message.source,
                    encoded: true
                };

                ui.addMessage(model, 'postedNotification', roomName);
            }
            else {
                if (showUserName === true) {
                    var $user = room.getUser(message.name),
                        $flag = $user.find('.flag');
                    message.flagClass = $flag.attr('class');
                    message.flagTitle = $flag.attr('title');
                }

                this.appendMessage(templates.message.tmpl(message), room);
            }

            if (message.htmlContent) {
                ui.addChatMessageContent(message.id, message.htmlContent, room.getName());
            }

            if (room.isInitialized()) {
                if (isMention) {
                    // Always do sound notification for mentions if any room as sound enabled
                    if (anyRoomPreference('hasSound', true) === true) {
                        ui.notify(true);
                    }

                    if (focus === false && anyRoomPreference('canToast', true) === true) {
                        // Only toast if there's no focus (even on mentions)
                        ui.toast(message, true, roomName);
                    }
                }
                else {
                    // Only toast if chat isn't focused
                    if (focus === false) {
                        ui.notifyRoom(roomName);
                        ui.toastRoom(roomName, message);
                    }
                }
            }
        },
        overwriteMessage: function (id, message) {
            var $message = $('#m-' + id);
            processMessage(message);

            $message.find('.middle').html(message.message);
            $message.find('.right .time').attr('title', message.fulldate).text(message.when);
            $message.attr('id', 'm-' + message.id);

        },
        replaceMessage: function (message) {
            processMessage(message);

            $('#m-' + message.id).find('.middle')
                                 .html(message.message);
        },
        messageExists: function (id) {
            return $('#m-' + id).length > 0;
        },
        addChatMessageContent: function (id, content, roomName) {
            var $message = $('#m-' + id),
                $middle = $message.find('.middle'),
                $body = $message.find('.content');

            if (shouldCollapseContent(content, roomName)) {
                content = collapseRichContent(content);
            }

            if ($middle.length === 0) {
                $body.append('<p>' + content + '</p>');
            }
            else {
                $middle.append(content);
            }
        },
        prepareNotificationMessage: function (options, type) {
            if (typeof options === 'string') {
                options = { content: options, encoded: false };
            }

            var now = new Date(),
            message = {
                message: options.encoded ? options.content : ui.processContent(options.content),
                type: type,
                date: now,
                when: now.formatTime(true),
                fulldate: now.toLocaleString(),
                img: options.img,
                source: options.source,
                id: options.id
            };

            return templates.notification.tmpl(message);
        },
        addMessageBeforeTarget: function (content, type, $target) {
            var $element = ui.prepareNotificationMessage(content, type);

            $target.before($element);

            return $element;
        },
        //TODO swap around type and roomName parameters for consistency
        addMessage: function (content, type, roomName) {
            var room = roomName ? getRoomElements(roomName) : getCurrentRoomElements(),
                nearEnd = room.isNearTheEnd(),
                $element = ui.prepareNotificationMessage(content, type);

            this.appendMessage($element, room);

            if (type === 'notification' && room.isLobby() === false) {
                ui.collapseNotifications($element);
            }

            if (nearEnd) {
                ui.scrollToBottom(roomName);
            }

            return $element;
        },
        appendMessage: function (newMessage, room) {
            // Determine if we need to show a new date header: Two conditions
            // for instantly skipping are if this message is a date header, or
            // if the room only contains non-chat messages and we're adding a
            // non-chat message.
            var isMessage = $(newMessage).is('.message');
            if (!$(newMessage).is('.date-header') && (isMessage || room.hasMessages())) {
                var lastMessage = room.messages.find('li[data-timestamp]').last(),
                    lastDate = new Date(lastMessage.data('timestamp')),
                    thisDate = new Date($(newMessage).data('timestamp'));

                if (!lastMessage.length || thisDate.toDate().diffDays(lastDate.toDate())) {
                    var dateDisplay = moment(thisDate);
                    ui.addMessage(dateDisplay.format('dddd, MMMM Do YYYY'), 'date-header list-header', room.getName())
                      .find('.right').remove(); // remove timestamp on date indicator
                }
            }

            if (isMessage) {
                room.updateMessages(true);
            }

            $(newMessage).appendTo(room.messages);
        },
        addNotification: function (message, roomName) {
            this.addMessage(message, 'notification', roomName);
        },
        addNotificationToActiveRoom: function (message) {
            this.addNotification(message, getActiveRoomName());
        },
        addError: function (message, roomName) {
            this.addMessage(message, 'error', roomName);
        },
        addErrorToActiveRoom: function (message) {
            this.addError(message, getActiveRoomName());
        },
        addWelcome: function (message, roomName) {
            this.addMessage(message, 'welcome', roomName);
        },
        addWelcomeToActiveRoom: function(message) {
            this.addWelcome(message, getActiveRoomName());
        },
        addList: function(header, messages, roomName) {
            this.addMessage(header, 'list-header', roomName);
            
            var _this = this;
            $.each(messages, function () {
                _this.addMessage(this, 'list-item', roomName);
            });
        },
        addListToActiveRoom: function(header, messages) {
            this.addList(header, messages, getActiveRoomName());
        },
        addBroadcast: function(message, roomName) {
            this.addMessage(message, 'broadcast', roomName);
        },
        addAction: function(message, roomName) {
            this.addMessage(message, 'action', roomName);
        },
        addPrivateMessage: function (content) {
            var rooms = getAllRoomElements();
            for (var r in rooms) {
                if (rooms[r].getName() !== undefined && rooms[r].isClosed() === false) {
                    this.addMessage(content, 'pm', rooms[r].getName());
                }
            }
        },
        addModalMessage: function (title, message, icon) {
            var deferred = $.Deferred();
            var $dialog = templates.modalMessage.tmpl({ Title: title, Body: message, Icon: icon }).appendTo('#dialog-container').modal()
                .on('hidden.bs.modal', function () {
                    $dialog.remove();
                    deferred.resolve();
                })
                .on('click', 'a.btn', function () {
                    $dialog.modal('hide');
                });
            return deferred.promise();
        },
        hasFocus: function () {
            return focus;
        },
        setShortcuts: function (shortcuts) {
            $shortCutHelp.empty();

            $.each(shortcuts, function () {
                $shortCutHelp.append(templates.commandhelp.tmpl(this));
            });
        },
        getCommands: function () {
            return ui.commands || [];
        },
        getCommand: function (name) {
            return !ui.commandsLookup ? null : ui.commandsLookup[name];
        },
        setCommands: function (commands) {
            ui.commands = commands.sort(function(a, b) {
                return a.Name.toString().toUpperCase().localeCompare(b.Name.toString().toUpperCase());
            });

            ui.commandsLookup = {};
            for (var i = 0; i < commands.length; ++i) {
                var cmd = commands[i];
                ui.commandsLookup[cmd.Name] = cmd;
            }

            $globalCmdHelp.empty();
            $roomCmdHelp.empty();
            $userCmdHelp.empty();
            
            $.each(ui.getCommands(), function () {
                switch (this.Group) {
                    case ui.help.shortcut:
                        $shortCutHelp.append(templates.commandhelp.tmpl(this));
                        break;
                    case ui.help.global:
                        $globalCmdHelp.append(templates.commandhelp.tmpl(this));
                        break;
                    case ui.help.room:
                        $roomCmdHelp.append(templates.commandhelp.tmpl(this));
                        break;
                    case ui.help.user:
                        $userCmdHelp.append(templates.commandhelp.tmpl(this));
                        break;
                }
            });
        },
        isCommand: function (msg) {
            if (msg[0] === '/') {
                var parts = msg.substr(1).split(' ');
                if (parts.length > 0) {
                    var cmd = ui.getCommand(parts[0].toLowerCase());
                    if (cmd) {
                        return cmd.Name;
                    }
                }
            }
            return null;
        },
        confirmCommand: function (msg) {
            var commandName = ui.isCommand(msg),
                command = ui.getCommand(commandName);

            if (command && command.ConfirmMessage !== null) {
                var $dialog = templates.commandConfirm.tmpl(command).appendTo('#dialog-container').modal()
                        .on('hidden.bs.modal', function () {
                            $dialog.remove();
                        })
                        .on('click', 'a.btn', function () {
                            if ($(this).is('.btn-danger')) {
                                $ui.trigger(ui.events.sendMessage, [msg, null, true]);
                            }

                            $dialog.modal('hide');
                        });
                return true;
            } else {
                return false;
            }
        },
        setInitialized: function (roomName) {
            var room = roomName ? getRoomElements(roomName) : getCurrentRoomElements();
            room.setInitialized();
        },
        collapseNotifications: function ($notification) {
            // collapse multiple notifications
            var $notifications = $notification.prevUntil(':not(.notification)');
            if ($notifications.length > 3) {
                $notifications
                    .hide()
                    .find('.info').text('');    // clear any prior text
                $notification.find('.info')
                    .text(' ' + utility.getLanguageResource('Chat_ExpandHiddenMessages', $notifications.length))
                    .removeClass('collapse');
            }
        },
        expandNotifications: function ($notification) {
            // expand collapsed notifications
            var $notifications = $notification.prevUntil(':not(.notification)'),
                topBefore = $notification.position().top;

            $notification.find('.info')
                .text(' ' + utility.getLanguageResource('Chat_CollapseHiddenMessages'))
                .addClass('collapse');
            $notifications.show();

            var room = getCurrentRoomElements(),
                topAfter = $notification.position().top,
                scrollTop = room.messages.scrollTop();

            // make sure last notification is visible
            room.messages.scrollTop(scrollTop + topAfter - topBefore + $notification.height());
        },
        getState: function () {
            return preferences;
        },
        notifyRoom: function (roomName) {
            if (getRoomPreference(roomName, 'hasSound') === true) {
                $('#notificationSound')[0].play();
            }
        },
        toastRoom: function (roomName, message) {
            if (getRoomPreference(roomName, 'canToast') === true) {
                toast.toastMessage(message, roomName);
            }
        },
        notify: function (force) {
            if (getActiveRoomPreference('hasSound') === true || force) {
                $('#notificationSound')[0].play();
            }
        },
        toast: function (message, force, roomName) {
            if (getActiveRoomPreference('canToast') === true || force) {
                toast.toastMessage(message, roomName);
            }
        },
        nudge: function (message) {
            if (anyRoomPreference('hasSound', true) === true) {
                ui.notify(true);
            }
            
            if (focus === false && anyRoomPreference('canToast', true) === true) {
                // Only toast if there's no focus
                ui.toast(message, true);
            }
        },
        setUserName: function (name) {
            ui.name = name;
        },
        setUnreadNotifications: function (unreadCount) {
            if (unreadCount > 0) {
                $unreadNotificationCount.text(unreadCount);
                $unreadNotificationCount.show();
            } else {
                $unreadNotificationCount.text('');
                $unreadNotificationCount.hide();
            }
        },
        getUserName: function () {
            return ui.name;
        },
        getUserHash: function () {
            return ui.userHash;
        },
        setUserHash: function (hash) {
            ui.userHash = hash;
        },
        showDisconnectUI: function () {
            $disconnectDialog.modal();
        },
        showHelp: function () {
            $helpPopup.modal();
        },
        showUpdateUI: function () {
            $updatePopup.modal();

            window.setTimeout(function () {
                // Reload the page
                document.location = document.location.pathname;
            },
            updateTimeout);
        },
        showReloadMessageNotification: function () {
            $reloadMessageNotification.appendTo($chatArea);
            $reloadMessageNotification.show();
        },
        showStatus: function (status, transport) {
            // Change the status indicator here
            if (connectionState !== status) {
                if (popoverTimer) {
                    clearTimeout(popoverTimer);
                }
                connectionState = status;
                $connectionStatus.popover('destroy');
                switch (status) {
                    case 0: // Connected
                        $connectionStatus.removeClass('reconnecting disconnected');
                        $connectionStatus.popover(getConnectionStateChangedPopoverOptions(utility.getLanguageResource('Client_Connected')));
                        $connectionStateChangedPopover.find(connectionStateIcon).addClass('icon-ok-sign');
                        $connectionStatus.popover('show');
                        popoverTimer = setTimeout(function () {
                            $connectionStatus.popover('destroy');
                            ui.initializeConnectionStatus(transport);
                            popoverTimer = null;
                        }, 2000);
                        break;
                    case 1: // Reconnecting
                        $connectionStatus.removeClass('disconnected').addClass('reconnecting');
                        $connectionStatus.popover(getConnectionStateChangedPopoverOptions(utility.getLanguageResource('Client_Reconnecting')));
                        $connectionStateChangedPopover.find(connectionStateIcon).addClass('icon-question-sign');
                        $connectionStatus.popover('show');
                        popoverTimer = setTimeout(function () {
                            $connectionStatus.popover('hide');
                            popoverTimer = null;
                        }, 5000);
                        break;
                    case 2: // Disconnected
                        $connectionStatus.removeClass('reconnecting').addClass('disconnected');
                        $connectionStatus.popover(getConnectionStateChangedPopoverOptions(utility.getLanguageResource('Client_Disconnected')));
                        $connectionStateChangedPopover.find(connectionStateIcon).addClass('icon-exclamation-sign');
                        $connectionStatus.popover('show');
                        popoverTimer = setTimeout(function () {
                            $connectionStatus.popover('hide');
                            popoverTimer = null;
                        }, 5000);
                        break;
                }
            }
        },
        setReadOnly: function (isReadOnly) {
            readOnly = isReadOnly;

            if (readOnly === true) {
                $hiddenFile.attr('disabled', 'disabled');
                $submitButton.attr('disabled', 'disabled');
                $newMessage.attr('disabled', 'disabled');
                $fileUploadButton.attr('disabled', 'disabled');
                $('.message.failed .resend').addClass('disabled');
            }
            else {
                $hiddenFile.removeAttr('disabled');
                $submitButton.removeAttr('disabled');
                $newMessage.removeAttr('disabled');
                $fileUploadButton.removeAttr('disabled');
                $('.message.failed .resend').removeClass('disabled');
            }
        },
        initializeConnectionStatus: function (transport) {
            $connectionStatus.popover(getConnectionInfoPopoverOptions(transport));
        },
        changeNote: function (userViewModel, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUser(userViewModel.name);

            updateNote(userViewModel, $user);
        },
        changeFlag: function (userViewModel, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUser(userViewModel.name);

            updateFlag(userViewModel, $user);
        },
        changeRoomTopic: function (roomName, topic) {
            updateRoomTopic(roomName, topic);
        },
        confirmMessage: function (id) {
            $('#m-' + id).removeClass('failed')
                         .removeClass('loading');
        },
        failMessage: function (id, isCommand) {
            var $message = $('#m-' + id);
            $message.removeClass('loading');
            if ($message.hasClass('failed') === false &&
                $message.hasClass('failed-command') === false) {
                if (isCommand) {
                    $message.addClass('failed-command');
                } else {
                    $message.addClass('failed');
                }
            }
        },
        markMessagePending: function (id) {
            var $message = $('#m-' + id);

            if ($message.hasClass('failed') === false &&
                $message.hasClass('failed-command') === false) {
                $message.addClass('loading');
            }
        },
        setRoomAdmin: function (adminName, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUser(adminName);
            $user
                .attr('data-admin', true)
                .data('admin', true)
                .find('.admin')
                .text('(' + utility.getLanguageResource('Client_AdminTag') + ')');
            room.updateUserStatus($user);
        },
        clearRoomAdmin: function (adminName, roomName) {
            var room = getRoomElements(roomName),
                $user = room.getUser(adminName);
            $user
                 .removeAttr('data-admin')
                 .data('admin', false)
                 .find('.admin')
                 .text('');
            room.updateUserStatus($user);
        },
        setLastPrivate: function (userName) {
            lastPrivate = userName;
        },
        shouldCollapseContent: shouldCollapseContent,
        collapseRichContent: collapseRichContent,
        toggleMessageSection: function (disabledIt) {
            if (disabledIt) {
                // disable send button, textarea and file upload
                $newMessage.attr('disabled', 'disabled');
                $submitButton.attr('disabled', 'disabled');
                $fileUploadButton.attr('disabled', 'disabled');
                $hiddenFile.attr('disabled', 'disabled');
                $('.message.failed .resend').addClass('disabled');
            } else if (!readOnly) {
                // re-enable textarea button
                $newMessage.attr('disabled', '');
                $newMessage.removeAttr('disabled');

                // re-enable submit button
                $submitButton.attr('disabled', '');
                $submitButton.removeAttr('disabled');

                // re-enable file upload button
                $fileUploadButton.attr('disabled', '');
                $fileUploadButton.removeAttr('disabled');
                $hiddenFile.attr('disabled', '');
                $hiddenFile.removeAttr('disabled');

                // re-enable send failed message button
                $('.message.failed .resend').removeClass('disabled');
            }
        },
        toggleDownloadButton: function(disabled) {
            if (disabled) {
                $downloadIcon.addClass("off");
                $downloadIcon.attr("title", "download messages disabled for private rooms");
            } else {
                $downloadIcon.removeClass("off");
                $downloadIcon.attr("title", "download messages");
            }
        },
        closeRoom: function (roomName) {
            var room = getRoomElements(roomName);

            room.close();
        },
        unCloseRoom: function (roomName) {
            var room = getRoomElements(roomName);

            room.unClose();
        },
        setRoomListStatuses: function (roomName) {
            var room = roomName ? getRoomElements(roomName) : getCurrentRoomElements();
            room.setListState(room.owners);
        },
        processContent: function (content) {
            return utility.processContent(content, templates, roomCache);
        },
        trimRoomMessageHistory: function (roomName) {
            var rooms = roomName ? [getRoomElements(roomName)] : getAllRoomElements();

            for (var i = 0; i < rooms.length; i++) {
                rooms[i].trimHistory();
            }
        },
        updateTabOrder: function (tabOrder) {
            $.each(tabOrder.reverse(), function(el, name) {
                $tabs.find('li[data-name="' + name + '"]').prependTo($tabs.first());
            });

            ui.updateTabOverflow();
            setAccessKeys();
        },
        updateTabOverflow: function () {
            var lastOffsetLeft = 0,
                sliceIndex = -1,
                $roomTabs = null,
                $tabsList = $tabs.first(),
                $tabsDropdown = $tabs.last(),
                overflowedRoomTabs = null,
                $tabsDropdownButton = $('#tabs-dropdown-rooms');
            
            // move all (non-dragsort) tabs to the first list
            $tabs.last().find('li:not(.placeholder)').each(function () { $(this).css('visibility', 'hidden').detach().appendTo($tabsList); });
            
            $roomTabs = $tabsList.find('li:not(.placeholder)');
            
            // if width of first tab is greater than the tab area, move them all to the list
            if ($roomTabs.length > 0 && $roomTabs.width() > $tabsList.width()) {
                sliceIndex = 0;
            } else {
                // find overflow and move it all to the dropdown list ul
                $roomTabs.each(function(idx) {
                    if (sliceIndex !== -1) {
                        return;
                    }

                    var thisOffsetLeft = $(this).offset().left;
                    if (thisOffsetLeft <= lastOffsetLeft) {
                        sliceIndex = idx;
                        return;
                    }

                    lastOffsetLeft = thisOffsetLeft;
                });
            }

            // move all elements from here to the dropdown list
            if (sliceIndex !== -1) {
                $tabsDropdownButton.fadeIn('slow');
                overflowedRoomTabs = $roomTabs.slice(sliceIndex);
                for (var i = overflowedRoomTabs.length - 1; i >= 0; i--) {
                    $(overflowedRoomTabs[i]).prependTo($tabsDropdown);
                }
            } else {
                $tabsDropdownButton.fadeOut('slow').parent().removeClass('open');
            }

            $roomTabs.each(function () { $(this).css('visibility', 'visible'); });

            return;
        },
        showSplashScreen: function () {
            $splashScreen.fadeIn('slow');
        },
        hideSplashScreen: function () {
            $splashScreen.fadeOut('slow');
        }
    };

    if (!window.chat) {
        window.chat = {};
    }
    window.chat.ui = ui;
})(window.jQuery, window, window.document, window.chat, window.chat.utility, window.Emoji, window.moment);
