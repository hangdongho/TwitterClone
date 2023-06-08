$(document).ready(() =>{
    $.get("/api/chats",(data, status, xhr) =>{
        if(xhr.status == 400){
            alert("Could not get chat list");
        }
        else{
            outputChatList(data,$(".resultsContainer"));
        }
    })
})

function outputChatList(chatList, container){
    chatList.forEach(chat =>{
        var html = createChatHtml(chat);
        container.append(html);
    })
    if(chatList.length == 0){
        container.append("<span class='noResult'>Nothing to show</span>");
    }
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
