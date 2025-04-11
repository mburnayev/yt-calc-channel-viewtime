require("dotenv").config();
const fs = require("fs");

function parseDuration(duration) {
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(matches[1] || 0);
    const minutes = parseInt(matches[2] || 0);
    const seconds = parseInt(matches[3] || 0);

    return hours + minutes / 60 + seconds / 3600;
}

async function getChannelVideos(channelId) {
    // const channelResponse = await fetch(
    //     `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&key=${process.env.YOUTUBE_API_KEY}&part=contentDetails`
    // );
    // const channelData = await channelResponse.json();
    // const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // console.log(uploadsPlaylistId == channelId)

        // // Continue with existing video duration fetching code
        // const videoResponse = await fetch(
        //     `https://www.googleapis.com/youtube/v3/videos?id=${allVideoIds.join(",")}&key=${process.env.YOUTUBE_API_KEY}&part=contentDetails`
        // );
        // const videoData = await videoResponse.json();
    
        // const timeData = videoData.items.map(item => (
        //     parseDuration(item.contentDetails.duration)
        // ));
    

    // GET playlist with video ids for channel
    var numResults = 0;
    var totalTimeData = [];
    var nextPageToken = "";  // Used to move through page results

    fs.writeFileSync("video_durations.txt", "Video ID,Duration (hours)\n");

    // Manual inspection shows Annoying Orange currently has just under 2300 videos (2298)
    while (numResults < 2300) {
        const playlistResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${channelId}&key=${process.env.YOUTUBE_API_KEY}&part=contentDetails&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`
        );
        const playlistData = await playlistResponse.json();
        
        if (!playlistData.items || playlistData.items.length === 0) {
            break;
        }
        
        const videoIds = playlistData.items.map(item => item.contentDetails.videoId);

        const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?id=${videoIds.join(",")}&key=${process.env.YOUTUBE_API_KEY}&part=contentDetails`
        );
        const videoData = await videoResponse.json();

        // Parse and extract json time data, append the video id and duration in hours as well
        const timeData = videoData.items.map(item => {
            const duration = parseDuration(item.contentDetails.duration);
            fs.appendFileSync("video_durations.txt", `${item.id},${duration}\n`);
            return duration;
        });

        // Concatenate existing time records and records from new batch
        totalTimeData = [...totalTimeData, ...timeData];
        numResults += playlistData.items.length;
        
        // Update next page of results
        nextPageToken = playlistData.nextPageToken;
        if (!nextPageToken) {
            break;
        }

        console.log(`Processed ${numResults}/3000 queries`);
    }

    return totalTimeData;
}

// Manual calculation based on information found on https://muppet.fandom.com/wiki/Sesame_Street_seasons
function calcSesameHours() {
    var s2 = 145
    var s1_s3s29 = 130 * 28
    var s30s32 = 65 * 3
    var s33 = 50
    var s34s40 = 26 * 7
    var s41s42 = 44 * 2
    var s43s45 = 27 * 3
    var s46s55 = 35 * 10 * 0.5
    return s2 + s1_s3s29 + s30s32 + s33 + s34s40 + s41s42 + s43s45 + s46s55;
}

// Helper function to aggregate times
function calcOrangeHours(timeData) {
    var timeSum = 0
    for (const num of timeData) {
        timeSum = timeSum + num
    }
    return timeSum
}

// Print results of calculations
function printData(firstHours, secondHours) {
    const divider = "----------------------------------------------------------------------------------------------------";
    const header = "                         Sesame Street vs Annoying Orange viewing breakdown";

    const formatNumber = (num) => num.toString().padStart(6);
    const formatDecimal = (num) => num.toFixed(2).padStart(8);

    console.log(`\n${header}`);
    console.log(divider);
    console.log("                  |      # of episodes     |    # of episode hours    |    Days wasted watching");
    console.log(divider);
    console.log(`Sesame Street     |         ${formatNumber(4731)}         |         ${formatDecimal(firstHours)}         |         ${formatDecimal(firstHours / 24)}`);
    console.log(`Annoying Orange   |         ${formatNumber(2298)}         |         ${formatDecimal(secondHours)}         |         ${formatDecimal(secondHours / 24)}`);
    console.log();
}

// Execution point
async function main() {
    const orangeTimeData = await getChannelVideos("UUi-5OZ2tYuwMLIcEyOsbdRA"); // Had to change channel id prefix from UCi to UUi for some reason, probably (U)ser vs (C)hannel
    printData(calcSesameHours(), calcOrangeHours(orangeTimeData));
}

main().catch();