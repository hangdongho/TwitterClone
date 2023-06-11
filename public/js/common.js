var cropper;
var timer;
var selectedUsers=[]; 

$(document).ready(() =>{
    refreshMessageBadge();
    refreshNotificationBadge();
})
$("#postTextarea, #replyTextarea").keyup((event) =>{
    var textbox = $(event.target);
    var value = textbox.val().trim();

    var isModal = textbox.parents(".modal").length == 1;

    var submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if(submitButton.length == 0) return alert('No submit button found');

    if(value == ""){
        submitButton.prop("disabled",true);
        return;
    }
    submitButton.prop("disabled",false);
})

$("#submitPostButton, #submitReplyButton").click(() =>{
    var button = $(event.target);
    var isModal = button.parents(".modal").length == 1;
    var textbox = isModal ? $("#replyTextarea") : $("#postTextarea");
    var data = {
        content:textbox.val()
    }
    if(isModal){
        var id = button.data().id;
        if(id == null) return alert("Button id is null");
        data.replyTo =id;

    }
    $.post("/api/posts",data,postData => {

        if(postData.replyTo){
            emitNotification(postData.replyTo.postedBy);
            location.reload();
        }
        else{
            var html = createPostHtml(postData);
            $(".postsContainer").prepend(html);
            textbox.val("");
            button.prop("disabled",true);
        }
    })
})

$("#replyModal").on("show.bs.modal", (event) =>{
    var button = $(event.relatedTarget);
    var postId= getPostIdFromElement(button);
    $("#submitReplyButton").data("id",postId);
    $.get("/api/posts/" + postId,results => {
        outputPost(results.postData, $("#originalPostContainer"));
    })
})
$("#replyModal").on("hidden.bs.modal", (event) =>{
    $("#originalPostContainer").html("");
})

$("#deletePostModal").on("show.bs.modal", (event) =>{
    var button = $(event.relatedTarget);
    var postId= getPostIdFromElement(button);
    $("#deletePostButton").data("id",postId);

})
$("#pinModal").on("show.bs.modal", (event) =>{
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#pinButton").data("id",postId);
})
$("#upinModal").on("show.bs.modal", (event) =>{
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#unpinButton").data("id",postId);
})
$("#deletePostButton").click((event) => {
    var postId = $(event.target).data("id");
    $.ajax({
        url: `/api/posts/${postId}`,
        type: "DELETE",
        success: () =>{
            location.reload();
        }
    })
})
$("#pinButton").click((event) => {
    var postId = $(event.target).data("id");
    $.ajax({
        url: `/api/posts/${postId}`,
        type: "PUT",
        data:{pinned: true},
        success: (data,status, xhr) =>{
            if(xhr.status != 204){
                alert("could pin post");
                return;
            }
            location.reload();
        }
    })
})
$("#unpinButton").click((event) => {
    var postId = $(event.target).data("id");
    $.ajax({
        url: `/api/posts/${postId}`,
        type: "PUT",
        data:{pinned: false},
        success: (data,status, xhr) =>{
            if(xhr.status != 204){
                alert("could unpin post");
                return;
            }
            location.reload();
        }
    })
})
$('#filePhoto').change(function(){
    if(this.files && this.files[0]){
        var reader = new FileReader();
        reader.onload = (e) =>{
            console.log("loaded");
            var image = document.getElementById("imagePreview");
            image.src = e.target.result;
            if(cropper !== undefined){
                cropper.destroy();
            }
            cropper = new Cropper(image,{
                aspectRatio:1/1,
                background:false,

            });
        };
        reader.readAsDataURL(this.files[0]);
    }
});
$("#imageUploadButton").click(() =>{
    var canvas = cropper.getCroppedCanvas();
    if(canvas == null){
        alert("check image");
        return;
    }
    canvas.toBlob((blob) => {
        var formData = new FormData();
        formData.append("croppedImage",blob);
        $.ajax({
            url:"/api/users/profilePicture",
            type:"POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => location.reload(),
        })
    })
})
$('#coverPhoto').change(function(){
    if(this.files && this.files[0]){
        var reader = new FileReader();
        reader.onload = (e) =>{
            console.log("loaded");
            var image = document.getElementById("coverPreview");
            image.src = e.target.result;
            if(cropper !== undefined){
                cropper.destroy();
            }
            cropper = new Cropper(image,{
                aspectRatio:16/9,
                background:false,

            });
        };
        reader.readAsDataURL(this.files[0]);
    }
});
$("#coverPhotoUploadButton").click(() =>{
    var canvas = cropper.getCroppedCanvas();
    if(canvas == null){
        alert("check image");
        return;
    }
    canvas.toBlob((blob) => {
        var formData = new FormData();
        formData.append("croppedImage",blob);
        $.ajax({
            url:"/api/users/coverPhoto",
            type:"POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => location.reload(),
        })
    })
})

$("#userSearchText").keydown((event) =>{
    clearTimeout(timer);
    var textbox = $(event.target);
    var value = textbox.val();
    
    if(value == "" && event.keydown ==8 || event.which == 8){
        //remove user from selection
        selectedUsers.pop();
        updateSelectedUsersHtml();
        $(".resultsContainer").html("");
        if(selectedUsers.length ==0){
            $("#createChatButton").prop("disabled",true);
        }
        return;
    }
    timer=setTimeout(()=>{
        value= textbox.val().trim();
        if(value == ""){
            $(".resultsContainer").html("");
        }
        else{
            searchUsers(value);
        }
    },1000)
})

$("#createChatButton").click(() =>{
    var data = JSON.stringify(selectedUsers);
    $.post("/api/chats",{users:data},chat =>{
        if(!chat || !chat._id) return alert("invalid respone from server");
        window.location.href=`/messages/${chat._id}`;
    })
})

$(document).on("click", ".likeButton", (event) =>{
    var button = $(event.target);
    var postId= getPostIdFromElement(button);
    
    if(postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) =>{
            button.find("span").text(postData.likes.length || "")
            
            if(postData.likes.includes(userLoggedIn._id)){
                button.addClass("active");
                emitNotification(postData.postedBy);
            }
            else{
                button.removeClass("active");
            }
        }
    })
})
$(document).on("click", ".retweetButton", (event) =>{
    var button = $(event.target);
    var postId= getPostIdFromElement(button);
    
    if(postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST",
        success: (postData) =>{
            button.find("span").text(postData.retweetUsers.length || "")
            
            if(postData.retweetUsers.includes(userLoggedIn._id)){
                button.addClass("active");
                emitNotification(postData.postedBy);
            }
            else{
                button.removeClass("active");
            }
        }
    })
})

$(document).on("click", ".post", (event) =>{
    var element = $(event.target);
    var postId= getPostIdFromElement(element);

    if(postId !== undefined && !element.is("button")){
        window.location.href = '/posts/'+postId;
    }

});

$(document).on("click",".followButton",(event) =>{
    var button =$(event.target);
    var UserID = button.data().user;
    console.log(UserID);
    $.ajax({
        url:`/api/users/${UserID}/follow`,
        type:"PUT",
        success:(data,status,xhr) =>{
            if(xhr.status === 404){
                alert("User is not found");
                return;
            }
            var diff =1;
            if(data.following && data.following.includes(UserID)){
                button.addClass("following");
                button.text("Following");
                emitNotification(userId);
            }
            else{
                button.removeClass("following");
                button.text("Follow");
                diff=-1;
            }
            var followersLabel = $("#followersValue");
            if(followersLabel.length !== 0){
                var followersText = followersLabel.text();
                followersText = parseInt(followersText);
                followersLabel.text(followersText +diff);
            }
        },
    });
});
$(document).on("click",".notification.active",(event)=>{
    var container =$(event.target);
    var notificationId = container.data().id;
    var href = container.attr("href");
    event.preventDefault();
    var callback =() => window.location = href;
    markNotificationAsOpened(notificationId,callback);
})
function getPostIdFromElement(element){
    var isRoot = element.hasClass("post");
    var rootElement = isRoot ? element : element.closest(".post");
    var postId = rootElement.data().id;
    if(postId === undefined) return alert("Post id undefined");
    return postId;
}
function createPostHtml(postData,largeFont = false){

    if(postData == null) return alert("post object is null");
    var isRetweet = postData.retweetData !== undefined;
    var retweetBy= isRetweet ? postData.postedBy.username : null;
    postData = isRetweet ? postData.retweetData :postData;
    //console.log(isRetweet);

    var postedBy = postData.postedBy;
    if(postedBy._id === undefined){
        return console.log("User object not populated");
    }
    var displayName = postedBy.firstName +" "+ postedBy.lastName;
    var timestamp=timeDifference(new Date(),new Date(postData.createdAt));
    var likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" :"";
    var retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" :"";

    var largeFontClass= largeFont ? "largeFont":"" ;

    var retweetText = '';
    if(isRetweet){
        retweetText = `<span>
                        <i class="fa-sharp fa-solid fa-retweet"></i>
                        Retweeted by <a href='/profile/${retweetBy}'>@${retweetBy}</a>
                        </span>`
    }
    var replyFlag="";
    if(postData.replyTo && postData.replyTo._id){
        if(!postData.replyTo._id){
            return alert("reply to is not populated");
        }
        else  if(!postData.postedBy._id){
            return alert("posted by is not populated");
        }
        var replyTousername = postData.replyTo.postedBy.username;
        replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyTousername}'>${replyTousername}</a>
                    </div>`;
    }
    var pinnedText="";
    var buttons ="";
    if(postData.postedBy._id == userLoggedIn._id){
        var pinnedClass ="";
        var datatarget='#pinModal';
        if(postData.pinned ===  true){
            pinnedClass = "active";
            datatarget ="#upinModal";
            pinnedText="<i class='fa-solid fa-thumbtack'></i> <span>Pinned post</span>";
        }
        buttons = `<button class='pinButton ${pinnedClass}' data-id='${postData._id}' data-toggle="modal" data-target="${datatarget}"><i class="fa-solid fa-thumbtack"></i></button>
                    <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class="fa-solid fa-xmark"></i></button>`;
    }

    return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
                <div class='postActionContainer'>
                    ${retweetText}
                </div>
                <div class='mainContentContainer'>
                    <div class='userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>
                    <div class='postContentContainer'>
                        <div class='header'>
                            <a href='/profile/${postedBy.username}' class='displayName'>${displayName}</a>
                            <span class='username'>@${postedBy.username}</span>
                            <span class='date'>${timestamp}</span>
                            ${buttons}
                        </div>
                        ${replyFlag}
                        <div class='postBody'>
                            <span>${postData.content}</span>
                        </div>
                        <div class='postFooter'>
                            <div class='postButtonContainer'>
                                <button data-toggle='modal' data-target='#replyModal'>
                                    <i class="fa-regular fa-comment"></i>
                                </button>
                            </div>
                            <div class='postButtonContainer green'>
                                <button class='retweetButton ${retweetButtonActiveClass}' >
                                    <i class="fa-sharp fa-solid fa-retweet"></i>
                                    <span>${postData.retweetUsers.length || ""}</span>
                                </button>
                            </div>
                            <div class='postButtonContainer red'>
                                <button class='likeButton ${likeButtonActiveClass}'>
                                    <i class="fa-regular fa-heart"></i>
                                    <span>${postData.likes.length || ""}</span>
                                    </button>
                            </div>
                        </div>
                    </div>
                </div> 
            </div>`;
}
function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if(elapsed/1000 <30) return "Just now"; 
         return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }

}

function outputPost(result, container){
    container.html("");
    if(!Array.isArray(result)){
        result = [result];
    }
    result.forEach(res => {
        var html = createPostHtml(res)
        container.append(html);
    });

    if(result.length == 0){
        container.append("<span class='noResult'>Nothing to show.</span>")
    }
}

function outputPostWithReply(result, container){
    container.html("");

    if(result.replyTo !== undefined && result.replyTo._id !== undefined){
        var html = createPostHtml(result.replyTo)
        container.append(html);
    }
    var mainPosthtml = createPostHtml(result.postData,true)
    container.append(mainPosthtml);
    result.replies.forEach(res => {
        var html = createPostHtml(res)
        container.append(html);
    });

}
function searchUsers(searchTerm){
    $.get("/api/users",{search: searchTerm},results => {
        outputSelectedUsers(results,$(".resultsContainer"));
    })
}
function outputSelectedUsers(results,container){
    container.html("");
    results.forEach(result => {
        if(result._id == userLoggedIn._id || selectedUsers.some(x=>x._id == result._id)){
            return;
        }
        var html = createUserHtml(result,false);
        var element =$(html);
        element.click(()=>userSelected(result))
        container.append(element);
    });
    if(results.length ==0){
        container.append("<span class='noResults'>No result found</span>")
    }
}
function userSelected(user){
    selectedUsers.push(user);
    updateSelectedUsersHtml()
    $("#userSearchText").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled",false);
}
function outputUsers(results,container){
    container.html("");
    results.forEach((result) =>{
        var html = createUserHtml(result,true);
        container.append(html);
    });
    if(results.length == 0){
        container.append("<span class='noResults'>User not found</span>")
    }
}
function updateSelectedUsersHtml(){
    var element = [];
    selectedUsers.forEach(user => {
        var name = user.firstName+" "+user.lastName;
        var userElement = $(`<span class='selectedUser'>${name}</span>`);
        element.push(userElement);
    })
    $(".selectedUser").remove();
    $("#selectedUsers").prepend(element);
}

function getChatName(chatData){
    var chatName = chatData.chatName;
    if(!chatName){
        var otherChat = getOtherChat(chatData.users);
        var nameArray = otherChat.map(user => user.firstName+" "+user.lastName);
        chatName = nameArray.join(", ")
    }
    return chatName;
}

function getOtherChat(users){
    if(users.length == 1) return users;
    return users.filter(user => user._id != userLoggedIn._id);
}
function messageReceived(newMessage){
    if($(`[data-room="${newMessage.chat._id}"]`).length == 0){
        showMessagePopup(newMessage);
    }
    else {
        addChatMessageHtml(newMessage);
    }
    refreshMessageBadge();
}
function createUserHtml(userData,showFollowButton){
    let name = `${userData.firstName} ${userData.lastName}`;
    var followButton ="";
    var isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
    var text = isFollowing ? "Following":"Follow";
    var buttonClass = isFollowing ? "followButton following" :"followButton";

    if(showFollowButton && userLoggedIn._id != userData._id){
        followButton = `<div class="followButtonContainer">
                            <button class="${buttonClass}" data-user="${userData._id}">${text}</button>
                        </div>`;
    }
    return `<div class='user'>
                <div class='userImageContainer'>
                    <img src='${userData.profilePic}'>
                </div>
                <div class='userDetailsContainer'>
                    <div class='header'>
                        <a href='/profile/${userData.username}'>${name}</a>
                        <span class='username'>@${userData.username}</span>
                        <span class='description'>${userData.description}</span>
                    </div>
                    ${followButton}
                </div>`;
}
function createChatHtml(chatData){
    var chatName = getChatName(chatData);
    var image = getChatImageElement(chatData);
    var latestMessage = getLatestMessage(chatData.latestMessage);
    var activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" : "active";
    return `<a href='/messages/${chatData._id}' class='resultList ${activeClass}'>
            ${image}
            <div class='resultDetailContainer ellipsis'>
                <span class='heading ellipsis'>${chatName}</span>
                <span class='subText ellipsis'>${latestMessage} </span>
            </div>
            </a>`;
            
}

function getLatestMessage(latestMessage){
    if(latestMessage != null){
        var sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
    }
    return "New Chat";

}

function getChatImageElement(chatData){
    var otherUser = getOtherChat(chatData.users);

    var groupChatClass="";
    var chatImage = getUserChatImageElement(otherUser[0]);

    if(otherUser.length > 1){
        groupChatClass = "groupChatImage";
        chatImage += getUserChatImageElement(otherUser[1]);
    }
    return `<div class='resultImageContainer ${groupChatClass}'>${chatImage}</div>`;
}

function getUserChatImageElement(user){
    if(!user || !user.profilePic){
        return alert("User passed into function is invalid");
    }
    return `<img src=${user.profilePic} alt='Profile Pic'>`;
}
function markNotificationAsOpened(notificationId = null, callback=null){
    if(callback == null) callback =()=>location.reload();
    var url= notificationId != null ? `/api/notifications/${notificationId}/markAsOpened` : `/api/notifications/markAsOpened`;
    $.ajax({
        url: url,
        type: "PUT",
        success: () => callback()
    })
}
function refreshMessageBadge(){
    $.get("/api/chats",{unreadOnly: true},(data) =>{
        var numberRes = data.length;
        if(numberRes > 0){
            $("#messageBadge").text(numberRes).addClass("active");
    
        }else{
            $("#messageBadge").text("").removeClass("active");
        }
    })
}
function refreshNotificationBadge(){
    $.get("/api/notifications",{unreadOnly: true},(data) =>{
        var numberRes = data.length;
        if(numberRes>0){
            $("#notificationBadge").text(numberRes).addClass("active");

        }
        else{
            $("#notificationBadge").text("").removeClass("active");

        }
    })
}
function showMessagePopup(data){
    if(!data.chat.latestMessage._id){
        data.chat.latestMessage = data;
    }
    var html = createChatHtml(data.chat);
    var element = $(html);
    element.hide().prependTo("#notificationList").slideDown("fats");
    setTimeout(() => element.fadeOut(400),3000);
}
function outputNotificationList(notifications, container){
    notifications.forEach(notification =>{
        var html = createNotificationHtml(notification);
        container.append(html);
    })
    if(notifications.length == 0){
        container.append("<span class='noResults'>Nothing new.</span>");
    }
}
function createNotificationHtml(notification){
    var userFrom = notification.userFrom;
    var text = getNotificationText(notification);
    var href = getNotificationUrl(notification);
    var className= notification.opened ? "": "active";

    return `<a href='${href}' class='resultList notification ${className}' data-id='${notification._id}'>
            <div class='resultImageContainer'>
            <img src='${userFrom.profilePic}'>
            </div>
            <div class='resultDetailContainer ellipsis'>
                <span class='ellipsis'>${text}</span>
            </div>
        </a>`
}
function getNotificationText(notification){
    var userFrom = notification.userFrom;
    if(!userFrom.firstName || !userFrom.lastName){
        return alert("user from data is not populated");
    }
    var userFromName = `${userFrom.firstName} ${userFrom.lastName}`;
    //var userFormName = "hi";
    var text;
    if(notification.notificationType == "retweet"){
        text =`${userFromName} just retweeted your posts`;
    } 
    else if(notification.notificationType == "postLike"){
        text =`${userFromName} just liked your posts`;
    }
    else if(notification.notificationType == "reply"){
        text =`${userFromName} just replied your posts`;
    }
    else if(notification.notificationType == "follow"){
        text =`${userFromName} just followed you`;
    }
    return `<span class='ellipsis'>${text}</span>`;
}
function getNotificationUrl(notification){
    var url="#";
    if(notification.notificationType == "retweet" ||
    notification.notificationType == "postLike" || 
    notification.notificationType == "reply"){
        url=`/posts/${notification.entityId}`;
    }  
    else if(notification.notificationType == "follow"){
        url=`/profile/${notification.entityId}`;
    }
    return url;
}