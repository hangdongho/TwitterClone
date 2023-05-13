$(document).ready(() =>{
    loadFollow();
    //alert("hello");
});
function loadFollow(){
    $.get(`/api/users/${profileUserId}/${selectedTab}`,(results) =>{
        outputUsers(results[selectedTab],$(".resultsContainer"));
    });
}

