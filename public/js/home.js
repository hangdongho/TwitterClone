$(document).ready(() =>{
    $.get("/api/posts",results => {
        outputPost(results,$(".postsContainer"));
    })
})

function outputPost(result, container){
    container.html("");
    result.forEach(res => {
        var html = createPostHtml(res)
        container.append(html);
    });

    if(result.length == 0){
        container.append("<span class='noResult'>Nothing to show</span>")
    }
}