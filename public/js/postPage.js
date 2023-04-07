$(document).ready(() =>{
    $.get("/api/posts/" + postId,results => {
        outputPostWithReply(results,$(".postsContainer"));
    })
})

