var express = require('express');
var app = express();
const fs = require('fs');

app.use(express.json())
app.get('/', (req, res) => {
    /*let category = req.body.category;
    let people = req.body.pnum;
    let time = req.body.time;
    let mylist = [];
    let prefer = req.body.prefer;
    let hate = req.body.hate;
    let lon = req.body.lon;
    let lat = req.body.lat;*/
    var mylist;
    let category = ["양식", "중식", "일식", "PC방", "볼링장", "노래방", "코인 노래방", "공원", "당구장", "방탈출", "박물관", "보드 게임 카페", "카페", "주점", "미술관", "연극극장", "백화점", "마사지", "아쿠아리움", "사진관", "만화카페"];
    console.log(category);
    let hate = ["양식", "중식", "일식"];
    let map = new Object();
    let lon = 37.615719;
    let lat = 126.847321;
    map.Re = 6371.00877;
    map.grid = 5.0;
    map.slat1 = 30.0;
    map.slat2 = 60.0;
    map.olon = 126.0;
    map.olat = 38.0;
    map.xo = 210/map.grid;
    map.y0 = 675/map.grid;
    let XY = getXY(lon, lat, map);
    //getLocation(res);
    try{
        fs.readFile('time.json', 'utf8', function(err, data){
            if(err){
                console.log(err);
                res.status(404).send(err);
                res.end();
            }
            console.log(data);
            let contents = JSON.parse(data);
            console.log(contents);
            mylist = findFromContents(category, contents);
            console.log(mylist);
            mylist = findHate(mylist, hate);
            console.log(mylist);
        });
    }
    catch(err){
        console.log(err);
        res.status(404).send(err);
        res.end();
    }
    
    console.log(mylist);
    res.json(mylist);
})

function findHate(from, condition){
    let newlist = [];
    for(let i in from){
        let donothate = true;
        for(let j in condition){
            if(from[i].type == condition[j]){
                donothate = false;
                break;
            }
        }
        if(donothate){
            newlist.push(from[i]);
        }
    }
    return newlist;
}

function findPref(from, condition){
    let newlist = [];
    for(let i in from){
        for(let j in condition){
            if(from[i].type == condition[j]){
                list.push(from[i]);
                break;
            }
        }
    }
    return newlist;
}

function findFromContents(from, content){
    let newlist = [];
    for(let i in from){
        for(let j in content){
            if(from[i] == content[j].type){
                newlist.push(content[j]);
                break;
            }
        }
    }
    
    return newlist;
}

function getLocation(res) {
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(showPosition);
    }
    else{
        console.log("can't get location");
        res.status(404).send("Can't find location");
        res.end();
    }
}

function getXY(lon, lat, map){
    let PI = Math.asin(1.0)*2.0;
    let DEGRAD = PI / 180.0;
    let RADDEG = 180.0 / PI;
    let re = map.Re / map.grid;
    let slat1 = map.slat1 * DEGRAD;
    let slat2 = map.slat2 * DEGRAD;
    let olon = map.olon * DEGRAD;
    let olat = map.olat * DEGRAD;
    let sn = Math.tan(PI * 0.25 + slat2 * 0.5) / Math.tan(PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(PI*0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    let ra = Math.tan(PI * 0.25 + lat * DEGRAD * 0.5);
    return 0;
}

var port = process.env.port || 3000;
app.listen(port, function(){
    console.log("server on, port: " + port);
})