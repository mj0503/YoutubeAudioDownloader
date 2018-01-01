// Imports
var exec = require('child_process').execSync;
var express = require('express');
var fs = require('fs');
var path = require('path');
var sanitize = require('sanitize-filename');

// Helper functions

// Outputs server starting and listening
function server_listening() {
    console.log('Server is starting...');
    console.log('Server listening...');
}

// Execute a command
function command_line(command) {
    var child_proc = exec(command, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('Error executing command');
            console.log(error);
        }
    });
    return child_proc;
}

// Test API
function test(request, response) {
    var data = request.params;
    response.send('You sent ' + data.test_input);
}

// Get status API
function get_status(request, response) {
    var data = request.params;
    
}

// Get YouTube MP3 API
function get_audio(request, response) {
    var data = request.params;
    var output_path = 'website/';
    var yt_id = data.yt_id;
    var yt_link = 'https://www.youtube.com/watch?v=' + yt_id;
    console.log('Got YouTube link: ' + yt_link);
    var child_proc = command_line('youtube-dl -e ' + yt_link);
    var yt_title = sanitize(child_proc.toString());
    console.log('YouTube title is: ' + yt_title);
    //console.log('YouTube encoded title is: ' + encodeURIComponent(yt_title));
    var mp4_path = output_path + yt_id + '.mp4';
    var mp3_path = output_path + yt_id+ '.mp3';
    var child_proc2 = command_line('youtube-dl --format mp4 --output ' + mp4_path + ' ' + yt_link);
    var child_proc3 = command_line('/opt/ffmpeg/ffmpeg -v 0 -y -i ' + mp4_path + ' ' + mp3_path);
    var full_mp3_path = path.join(__dirname, mp3_path);
    var stat = fs.statSync(full_mp3_path);

    // Set header to send data back to client
    response.setHeader('Content-Length', stat.size);
    response.setHeader('Content-Type', 'audio/mpeg; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(yt_title + '.mp3'));

    // Send data
    fs.createReadStream(full_mp3_path).pipe(response);
    console.log('Audio for "' + yt_title + '" downloaded');
    //response.end();
}

// Starting Nodejs server
var app = express();
var server = app.listen(80, server_listening);
app.use(express.static('website'));
app.get('/test/:test_input', test);
app.get('/getStatus/:json', get_status);
app.get('/getAudio/:yt_id', get_audio);

