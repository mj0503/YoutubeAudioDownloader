var queue;
var currentURL;
var currentURLThumb;
var currentURLTitle;
var MAX_TITLE_LENGTH = 34;

// Calls callback function after getting value from cache
function getItem(name, callback) {
    chrome.extension.sendMessage({command: 'getItem', name: name}, function(response) {
        if (typeof(callback) === "function")
            callback(response);
    });
}

// Calls callback function after setting value in cache 
function setItem(name,  data, callback) {
    chrome.extension.sendMessage({command: 'setItem', name: name, data: data}, function(response) {
        if (typeof(callback) === "function")
            callback(response);
    });
}


// Starts downloading mp3 file
function downloadMp3(url, callback) {
    chrome.extension.sendMessage({command: 'download', url: url}, function(response) {
        if (typeof(callback) === "function")
            callback(response);
    });
}

// Updates download queue UI 
function updateQueue(oldQueue) {	
	if (currentURLTitle.length >= MAX_TITLE_LENGTH){
		currentURLTitle = currentURLTitle.slice(0, MAX_TITLE_LENGTH-4) + "...";
		$("#wrap").css("width", "690px");
	}
	
	var newVid = "";
	if (currentURL != ""){
		var starti = currentURL.indexOf("v=") + 2;
		var endi = currentURL.indexOf("&", starti);
		if(endi == -1) endi = currentURL.length;
        newVid = "<li class=\"spinner\">" + currentURLThumb + "<a href=" + 
            "http://18.217.196.117/getAudio/" + currentURL.substring(starti, endi) + ">" + currentURLTitle + "</a></li>";
    }
    // Initialize with current video if queue is empty
	if(oldQueue === null || oldQueue === "null") {
		queue = newVid;
		setItem("queue", queue, null)
	}
    
    // Video does not exists in queue
 	else if (!oldQueue.includes(newVid)) {
	 	queue = newVid + oldQueue;
		setItem("queue", queue, null);
	}
    
    // Video already in queue
	else
		queue = oldQueue;

    // Display the updated queue
    if(queue === "") {
    	$(".instructions").removeClass("hidden");
    	$("#wrap").css("width", "200px");
    	$(".downloadQueue").addClass("hidden");
        $("#clearQueue").addClass("hidden");        
    }
	else {
        $("#clearQueue").removeClass("hidden");
		$(".instructions").addClass("hidden");
        $("#wrap").css("width", "370px");
		$(".downloadQueue").html(queue);
	}
}

// Generates small thumbnail <img>
function getImageURL(url) {
	var starti = url.indexOf("v=") + 2;
	var endi = url.indexOf("&", starti);
	if(endi == -1) endi = url.length;
	var img = "<img height=35 width=63 src='http://i3.ytimg.com/vi/" + 
        url.substring(starti, endi) + "/maxresdefault.jpg'>";
	return img;
}

// Generates image title
function getVideoImageAndTitle(url) {
	//Send Request
	$.ajax({
		contentType: "application/json",
        dataType: "json",
        url: "https://www.youtube.com/oembed?url="+url+"&format=json",
		type: "GET",
		async: false,
		success: function(data,textStatus, jqXHR) {
			currentURLTitle = data.title;
			currentURLThumb = "<img height=35 width=63 src='" + data.thumbnail_url + "'>";
		},
		error:function(response) {
			alert("An error occurred while communicating with the Youtube API");
		}
	});
}

// Extension icon finishes loading
$(document).ready(function(){

    // Clear Queue
    $("#clearQueue").click(function(){
    	currentURL = "";
    	currentURLThumb = "";
        setItem("queue", null, updateQueue);    
    });
    
    // Acquire the current tab 
	chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        var url = tabs[0].url;
        
        // Check if url is Youtube video 
		if(url.includes("youtube.com/watch")){
			var starti = url.indexOf("v=") + 2;
			var endi = url.indexOf("&", starti);
			if(endi == -1) endi = url.length;
			downloadMp3("http://18.217.196.117/getAudio/" + url.substring(starti, endi));

			getVideoImageAndTitle(url);

			//Send Request
			$.ajax({
				dataType: "text",
				url: "http://18.217.196.117/audio/"+url.substring(url.indexOf("?") + 1, url.length),
				type: "GET",
				success: function(data,textStatus, jqXHR) {
  					response = data
				},
				error:function(response) {
				}
			});


			currentURL = url;
			getItem("queue", updateQueue);
		}
        
        // Still display current queue on non-Youtube sites
		else{
			currentURL = "";
			currentURLThumb = "";
            currentURLTitle = "";
			getItem("queue", updateQueue);			
		}
	});

});