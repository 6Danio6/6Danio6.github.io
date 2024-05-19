let ffmpeg = null;

fileupload.onchange = readfile;
audioupload.onchange = readaudio;
save_osu_file_button.onclick = savefile;
save_audio_file_button.onclick = saveaudio;

// Add input functionality
const ins = document.querySelectorAll("input[id*='in']");
const ins2 = document.querySelectorAll("input[id='randomi'],input[id='ratei']");
const sls = document.querySelectorAll("input[id*='sl']");
for (let inp of ins) {
    inp.setAttribute("min", 0);
    inp.setAttribute("max", 10);
    inp.setAttribute("step", 0.1);
    inp.setAttribute("value", 0);
    inp.setAttribute("onclick", "select()");
    // inp.setAttribute("oninput", inp.getAttribute("oninput") + "\nif ( this.value>10 ) this.value=10; else if ( this.value<0 ) this.value=0; else if ( this.value=='' ) this.value='';");
    inp.setAttribute("oninput", `sync(this, ${inp.id.slice(0,2) + 'sl'}) \nif ( this.value>10 ) this.value=10; else if ( this.value<0 ) this.value=0; else if ( this.value=='' ) this.value='';`);
}
for (let inp of ins2) {
    inp.setAttribute("onclick", "select()");
    inp.setAttribute("oninput", `sync(this, ${inp.id.slice(0,-1) + 's'})`);
}
for (let sl of sls) {
    sl.setAttribute("min", 0)
    sl.setAttribute("max", 10)
    sl.setAttribute("step", 0.1)
    sl.setAttribute("value", 0)
    sl.setAttribute("list", "datalist1")
}
ratei.setAttribute("onblur", ratei.getAttribute("onblur") + "\nratei.value = Number(ratei.value).toFixed(2);")
rates.setAttribute("oninput", rates.getAttribute("oninput") + "\nratei.value = Number(ratei.value).toFixed(2);")
ratereset.setAttribute("onclick", ratereset.getAttribute("onclick") + "\nratei.value = Number(ratei.value).toFixed(2);")


// Create datalists
for (let i=0; i<=10; i+=1) {
    let opt = document.createElement("option");
    opt.setAttribute("value", i)
    datalist1.appendChild(opt)
}
for (let i=0.5; i<=2; i+=0.25) {
    let opt = document.createElement("option");
    opt.setAttribute("value", i)
    datalist2.appendChild(opt)
}for (let i=0; i<=50; i+=10) {
    let opt = document.createElement("option");
    opt.setAttribute("value", i)
    datalist3.appendChild(opt)
}

// Filereader
let filereader = new FileReader();
let content, hp=-1, cs=-1, od=-1, ar=-1, hp_pos = 0, cs_pos = 0, od_pos = 0, ar_pos = 0;
filereader.addEventListener("loadend", () => {
    try {
        content = filereader.result.split("\n")
        console.log("Contents of your file:")
        console.log(filereader.result)

        // Remove \r from the end of every row
        let i = 0;
        while (i < content.length - 1) {
            content[i] = content[i].slice(0,-1);
            i++;
        }

        // Set input values
        i = 0;
        while (content[i].search(/\[Difficulty\]/) == -1){ 
            i = i + 1;
        }
        i+=7;
        for (j = i-6; j < i; j++) {
            if (content[j].search("HPDrainRate:") != -1) { hp = Number(content[j].slice(12)); hp_pos = j; }
            if (content[j].search("CircleSize:") != -1) { cs = Number(content[j].slice(11)); cs_pos = j; }
            if (content[j].search("OverallDifficulty:") != -1) { od = Number(content[j].slice(18)); od_pos = j; }
            if (content[j].search("ApproachRate:") != -1) { ar = Number(content[j].slice(13)); ar_pos = j; }
        }
        hpin.value = hp;
        csin.value = cs;
        odin.value = od;
        arin.value = ar;
        hpsl.value = hp;
        cssl.value = cs;
        odsl.value = od;
        arsl.value = ar;
        // HPDrainRate:12
        // CircleSize:11
        // OverallDifficulty:18
        // ApproachRate:13
    } catch(err) { log("error", "Error reading file: ", err.message) }
})

// FUNCTIONS

function readfile()
{   
    try {
        if (fileupload.files[0].size > 10485760) {
            this.value = "";
            throw new Error("File size limit exceeded (10MB)!")
        }
        log("log", `File uploaded: $${fileupload.files[0].name}`)
        filereader.readAsText(fileupload.files[0])
    } catch(err) { log("error", "Error reading file: ", err.message) }
}

function readaudio()
{   
    try {
        if (audioupload.files[0].size > 10485760) {
            this.value = "";
            throw new Error("File size limit exceeded (10MB)!")
        }
        log("log", `Audio uploaded: <b  >${audioupload.files[0].name}</b>`)
    } catch(err) { log("error", "Error reading file: ", err.message) }
}

function savefile()
{
    try {
        if (fileupload.files.length == 0) throw new Error("No file uploaded.")
        if (content == undefined) throw new Error("No file data available.")
        log("log", "Writing changes...")
        output = [...content]
        let i = 0;

        // Create the diffname appendix
        let appendix = "";
        if (ratei.value != 1) appendix += ` ${ratei.value}x`;
        if (randomi.value != 0) appendix += " RANDOM" + randomi.value;
        if (hpin.value != hp) appendix += " HP" + hpin.value;
        if (csin.value != cs) appendix += " CS" + csin.value;
        if (odin.value != od) appendix += " OD" + odin.value;
        if (arin.value != ar) appendix += " AR" + arin.value;
        if (pitchin.checked) appendix += " pitch";

        // Find and change the map's audio filename
        if (ratei.value != 1) {
            while (output[i].search("AudioFilename:") == -1){
                i++;
            }
            if (pitchin.checked) {
                output[i] = output[i].slice(0,-4) + `_${ratei.value}x_pitch.mp3`;
            } else {
                output[i] = output[i].slice(0,-4) + `_${ratei.value}x.mp3`;
            }
        }

        // Find and change the map's diffname
        while (output[i].search("Version:") == -1){
            i++;
        }
        output[i] += appendix;
        
        // Find and change the map's BeatmapID
        while (output[i].search("BeatmapID:") == -1){
            i++;
        }
        output[i] = output[i].slice(0,10) + "0"

        // Find and change the map's difficulty values
        if (hp != -1) output[hp_pos] = output[hp_pos].slice(0,12) + hpin.value;
        if (cs != -1) output[cs_pos] = output[cs_pos].slice(0,11) + csin.value;
        if (od != -1) output[od_pos] = output[od_pos].slice(0,18) + odin.value;
        if (ar != -1) output[ar_pos] = output[ar_pos].slice(0,13) + arin.value;

        // Find and change the map's timing points
        while (output[i].search(/\[TimingPoints\]/) == -1){
            i = i + 1;
        }
        i++;
        while (output[i].search(',') != -1) {
            let j = 0;
            while (output[i][j] != ','){
                j++;
            }
            let comma1 = j;
            j++;
            while (output[i][j] != ','){
                j++;
            }
            let comma2 = j;

            let time = output[i].slice(0, comma1)
            let speed = output[i].slice(comma1+1, comma2)
            time /= ratei.value;
            if (speed > 0) {
                speed /= ratei.value;
                output[i] = time.toString() + "," + speed.toString() + output[i].slice(comma2);
            } else {
                output[i] = time.toString() + output[i].slice(comma1);
            }
            i++;
        }

        // Find the hit objects for the next part
        while (output[i].search(/\[HitObjects\]/) == -1){
            i = i + 1;
        }
        i++;

        // Speed up AND randomize the circles
        if (ratei.value != 1 && randomi.value != 0) {
            while (output[i].search(",") != -1) {
                let j = 0;
                while (output[i][j] != ','){
                    j++;
                }
                let comma1 = j;
                j++;
                while (output[i][j] != ','){
                    j++;
                }
                let comma2 = j;
                j++;    
                while (output[i][j] != ','){
                    j++;
                }
                let comma3 = j;
                j++;    
                while (output[i][j] != ','){
                    j++;
                }
                let comma4 = j;

                let x = Number(output[i].slice(0, comma1));
                let y = Number(output[i].slice(comma1+1, comma2));
                let n = Number(output[i].slice(comma2+1, comma3));
                let type = Number(output[i].slice(comma3+1, comma4)).toString(2).slice(-4,-3)
                n /= ratei.value;
                x += Math.floor(Math.random() * (randomi.value * 2 + 1)) - randomi.value;
                y += Math.floor(Math.random() * (randomi.value * 2 + 1)) - randomi.value;
                if (type == 1) {
                    j++;    
                    while (output[i][j] != ','){
                        j++;
                    }
                    let comma5 = j;
                    j++;    
                    while (output[i][j] != ','){
                        j++;
                    }
                    let comma6 = j;

                    let spin = content[i].slice(comma5+1, comma6);
                    spin /= ratei.value;
                    output[i] = x.toString() + "," + y.toString() + "," + n.toString() + output[i].slice(comma3, comma5+1) + spin.toString() + output[i].slice(comma6)
                } else {
                    output[i] = x.toString() + "," + y.toString() + "," + n.toString() + output[i].slice(comma3);
                }
                i++;
            }
        }

        // Speed up the circles
        if (ratei.value != 1) {
            while (output[i].search(",") != -1) {
                let j = 0;
                while (output[i][j] != ','){
                    j++;
                }
                j++;
                while (output[i][j] != ','){
                    j++;
                }
                let comma2 = j;
                j++;
                while (output[i][j] != ','){
                    j++;
                }
                let comma3 = j;
                j++;    
                while (output[i][j] != ','){
                    j++;
                }
                let comma4 = j;

                let n = Number(output[i].slice(comma2+1, comma3));
                let type = Number(output[i].slice(comma3+1, comma4)).toString(2).slice(-4,-3);
                n /= ratei.value;
                if (type == 1) {
                    j++;    
                    while (output[i][j] != ','){
                        j++;
                    }
                    let comma5 = j;
                    j++;    
                    while (output[i][j] != ','){
                        j++;
                    }
                    let comma6 = j;

                    let spin = content[i].slice(comma5+1, comma6)
                    spin /= ratei.value;
                    output[i] = output[i].slice(0, comma2+1) + n.toString() + output[i].slice(comma3, comma5+1) + spin.toString() + output[i].slice(comma6);
                } else {
                    output[i] = output[i].slice(0, comma2+1) + n.toString() + output[i].slice(comma3)
                }
                i++;
            }
        }

        // Randomize the circles
        if (randomi.value != 0) {
            while (output[i].search(",") != -1) {
                let j = 0;
                while (output[i][j] != ','){
                    j++;
                }
                let comma1 = j;
                j++;
                while (output[i][j] != ','){
                    j++;
                }
                let comma2 = j;
                let x = Number(output[i].slice(0, comma1));
                let y = Number(output[i].slice(comma1+1, comma2));
                x += Math.floor(Math.random() * (randomi.value * 2 + 1)) - randomi.value;
                y += Math.floor(Math.random() * (randomi.value * 2 + 1)) - randomi.value;
                output[i] = x.toString() + "," + y.toString() + output[i].slice(comma2);
                i++;
            }
        }

        
        // Prepare the download
        let link = document.createElement("a");
        let filename = fileupload.files[0].name.slice(0,-5) + `${appendix}].osu`;
        let result = output.join("\n");
        link.download = filename;
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(result);
        link.click();
        log("log", "File saved.")
    } catch(err) { log("error", "Error saving .osu file: ", err.message) }
}

async function saveaudio()
{
    try {
        if (audioupload.files.length == 0) throw new Error("No file uploaded.")
        if (ratei.value == 1) throw new Error("Rate is set to 1. No need.")
        let pitch = pitchin.checked; 
        let rate = ratei.value;
        let filename = audioupload.files[0].name;
        let outputname;
        
        // FFmpeg
        if (ffmpeg === null) {
            ffmpeg = new FFmpegWASM.FFmpeg();

            ffmpeg.on("log", ({ message }) => {
                console.log(message);
            })

            ffmpeg.on("progress", ({ progress }) => {
                log("log", `${progress * 100} %`);
            });

            await ffmpeg.load({coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js"});
        }

        await ffmpeg.writeFile(filename, await FFmpegUtil.fetchFile(audioupload.files[0]));
        log('log', 'Start audio conversion.');
        if ( pitch )
        {
            outputname = filename.slice(0,-4) + `_${ratei.value}x_pitch.mp3`;
            await ffmpeg.exec(['-i', filename, '-af', `asetrate=${44100 * rate}`, outputname]);
        }
        else
        {
            outputname = filename.slice(0,-4) + `_${ratei.value}x.mp3`;
            await ffmpeg.exec(['-i', filename, '-af', `atempo=${rate}`, outputname]);
        }
        log('log', 'Complete audio conversion.');
        let data = await ffmpeg.readFile(outputname);
        let link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mpeg' }));
        link.download = outputname;
        link.innerHTML = "Click to download";
        main.appendChild(link);
        link.click();
        main.removeChild(link);
        log("log","Audio saved.");
    } catch(err) { log("error", "Error saving audio file: ", err.message) }
}

function sync(inp1,inp2)
{
    if (inp1.value != "") inp2.value = inp1.value;
    if (content != undefined) {
        if (hpin.value == hp) { hplabel.style.color = "green"; hpin.style.color = "green"; } else { hplabel.style.color = "orange"; hpin.style.color = "orange" };
        if (csin.value == cs) { cslabel.style.color = "green"; csin.style.color = "green"; } else { cslabel.style.color = "orange"; csin.style.color = "orange" };
        if (odin.value == od) { odlabel.style.color = "green"; odin.style.color = "green"; } else { odlabel.style.color = "orange"; odin.style.color = "orange" };
        if (arin.value == ar) { arlabel.style.color = "green"; arin.style.color = "green"; } else { arlabel.style.color = "orange"; arin.style.color = "orange" };
    }
    if (ratei.value == 1) { ratelabel.style.color = "green"; ratei.style.color = "green"; } else { ratelabel.style.color = "orange"; ratei.style.color = "orange" };
    if (randomi.value == 0) { randomlabel.style.color = "green"; randomi.style.color = "green"; } else { randomlabel.style.color = "orange"; randomi.style.color = "orange" };
}

function reset(inp1, inp2, stat)
{
    inp1.value = stat;
    sync(inp1, inp2)
}

function resetall()
{
    hpin.value = hp;
    csin.value = cs;
    odin.value = od;
    arin.value = ar;
    hpsl.value = hp;
    cssl.value = cs;
    odsl.value = od;
    arsl.value = ar;
    randomi.value = 0;
    randoms.value = 0;
    ratei.value = Number(1).toFixed(2);
    rates.value = 1;
    elems = document.querySelectorAll("[id*='label'],.numbers");
    for (elem of elems){
        elem.removeAttribute("style")
    }
}

function log(type, message, err=""){
    let e = document.createElement("p")
    e.classList.add(type)
    e.innerHTML = message + err;
    logs.appendChild(e)
}