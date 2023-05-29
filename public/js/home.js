$(document).ready(() =>{
    $.get("/api/posts",{followingOnly:true},results => {
        outputPost(results,$(".postsContainer"));
    })
    $.get(`/api/users`,(results) =>{
        outputUsers(results,$(".resultsContainer"));
    });
})

