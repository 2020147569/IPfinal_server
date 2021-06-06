const { ENOENT } = require('constants');
var express = require('express');
var app = express();
const fs = require('fs');
const fetch = require('node-fetch');

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
    let date = new Date();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let newhour = hour;
    let newminute;
    if(minute > 30){
        newminute = 30;
    }
    else{
        newminute = 0;
    }
    var mylist;
    let category = ["양식", "중식", "일식", "PC방", "볼링장", "노래방", "코인 노래방", "공원", "당구장", "방탈출", "박물관", "보드 게임 카페", "카페", "주점", "미술관", "연극극장", "백화점", "마사지", "아쿠아리움", "사진관", "만화카페"];
    console.log(category);
    let hate = ["양식", "중식", "일식"];
    let map = new Object();
    let lon = 126.847321;
    let lat = 37.615719;
    map.Re = 6371.00877;
    map.grid = 5.0;
    map.slat1 = 30.0;
    map.slat2 = 60.0;
    map.olon = 126.0;
    map.olat = 38.0;
    map.xo = 210/map.grid;
    map.yo = 675/map.grid;
    let XY = getXY(lon, lat, map);
    console.log(XY);
    let url = "http://apis.data.go.kr/1360000/VilageFcstInfoService/getUltraSrtFcst?serviceKey=mg9I4VBCmTi1FupAyPU4QJUjbv98AeUk7CUsce7asBAeDDKgPzQWd3PzXukCX2w2wObVx85vt2KkVqWbzXWfVQ%3D%3D";
    url += "&numOfRows=100";
    url += "&pageNo=1";
    url += "&base_date=" + 30;
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
        console.log("final list");
        console.log(mylist);
        //let textlist = JSON.stringify(mylist);
        //console.log("text version list");
        //console.log(textlist);
        //res.send(JSON.stringify(textlist));
        res.json(mylist);
    });
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

function getXY(lon, lat, map){
    console.log("lon: " + lon + ", lat: " + lat);
    console.log(map);
    let PI = Math.PI;
    console.log(PI);
    let DEGRAD = PI / 180.0;
    console.log(DEGRAD);
    let re = map.Re / map.grid;
    console.log(re);
    let slat1 = map.slat1 * DEGRAD;
    console.log(slat1);
    let slat2 = map.slat2 * DEGRAD;
    console.log(slat2);
    let olon = map.olon * DEGRAD;
    console.log(olon);
    let olat = map.olat * DEGRAD;
    console.log(olat);
    let sn = Math.tan(PI * 0.25 + slat2 * 0.5) / Math.tan(PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    console.log(sn);
    let sf = Math.tan(PI*0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    console.log(sf);
    let ro = Math.tan(PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    console.log(ro);
    let ra = Math.tan(PI * 0.25 + lat * DEGRAD * 0.5);
    console.log(ra);
    ra = re * sf / Math.pow(ra, sn);
    console.log(ra);
    let theta = lon * DEGRAD - olon;
    if(theta > PI){
        theta -= 2 * PI;
    }
    if(theta < -PI){
        theta += 2 * PI;
    }
    theta *= sn;
    console.log(theta);
    let x = ra * Math.sin(theta) + map.xo;
    let y = ro - ra * Math.cos(theta) + map.yo;
    console.log("x: " + x);
    console.log("y: " + y);
    x = parseInt(x + 1.5);
    y = parseInt(y + 1.5);
    return [x, y];
}

var port = process.env.PORT || 5000;
app.listen(port, function(){
    console.log("server on, port: " + port);
})