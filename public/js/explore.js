$(document).ready(() =>{
    $.get("/api/posts",results => {
        outputPost(results,$(".postsContainer"));
        //alert("hi");
    })
    $.get(`/api/users`,(results) =>{
        outputUsers(results,$(".resultsContainer"));
    });
})