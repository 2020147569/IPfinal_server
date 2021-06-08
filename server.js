var express = require('express');
var app = express();
const fs = require('fs');
const request = require('request');
const cors = require('cors');

var headers = {'Authorization': 'KakaoAK 1e92017a6f706280b10c46c94dfebd78'};

app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

app.post('/', (req, res) => {
    if(req.body.preference.length == 0){
        res.status(404).send("prefer nothing?");
        res.end();
    }
    let Pref = decodeURI(req.body.preference).split("&preference=");
    if(Pref.length == 0){
        res.status(404).send("prefer nothing?");
        res.end();
    }
    Pref[0] = Pref[0].slice(11);
    let people = parseInt(req.body.personnel);
    let pretime = req.body.from.split(":");
    let lattime = req.body.to.split(":");
    let mylist = [];
    let lon = parseInt(req.body.longitude);
    let lat = parseInt(req.body.latitude);
    let date = new Date();
    let newtime = date.getTime();
    console.log(newtime);
    newtime += 9 * 60 * 60 * 1000;
    console.log(newtime);
    date.setTime(newtime);
    console.log(date);
    let predate = new Date();
    predate.setTime(date.getTime() + 9 * 60 * 60 * 1000);
    predate.setHours(parseInt(pretime[0]), parseInt(pretime[1]));
    let latdate = new Date();
    latdate.setTime(date.getTime() + 9 * 60 * 60 * 1000);
    latdate.setHours(parseInt(lattime[0]), parseInt(lattime[1]));
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
    let wdate = new Date();
    wdate.setHours(newhour, newminute);
    let map = new Object();
    let time = latdate.getTime() - predate.getTime();
    time /= (1000 * 60 * 60);
    map.Re = 6371.00877;
    map.grid = 5.0;
    map.slat1 = 30.0;
    map.slat2 = 60.0;
    map.olon = 126.0;
    map.olat = 38.0;
    map.xo = 210/map.grid;
    map.yo = 675/map.grid;
    let XY = getXY(lon, lat, map);
    let wurl = getWURL(wdate, XY);
    let raining;
    new Promise(function(resolve, reject){
        
        request(wurl, function(err, res, body){
            if(err){
                reject(new Error("no weather file"));
            }
            resolve(body);
        })
    })
    .then(res => JSON.parse(res))
    .then(function(data) {
        if(data.response.header.resultCode != '00'){
            //날씨정보 업데이트가 안 되면 비가 오지 않는 것으로 간주
            raining = false;
        }
        else{
            raining = checkWeather(data.response.body.items, predate, latdate);
        }
    })
    .catch(function(err){
        raining = false;
    })
    .finally(function(){
        fs.readFile('time.json', 'utf8', function (err, data) {
            if (err) {
                console.log(err);
                res.status(404).send(err);
                res.end();
            }
            let contents = JSON.parse(data);
            mylist = findPref(Pref, contents);
            mylist = deleteByTime(mylist, time);
            mylist = deleteByPeople(mylist, people);
            if(raining){
                mylist = deleteOut(mylist);
            }
            if(mylist.length == 0){
                res.status(404);
                res.json([]);
            }
            let resultarray = [];
            let surl = "https://dapi.kakao.com/v2/local/search/keyword.json?size=5&y=" + lat + "&x=" + lon + "&query="
            var mypro = [];
            mypro[0] = new Promise(function(resolve, reject){
                var options = {
                    url: surl + encodeURI(mylist[0].type),
                    headers: headers
                };
                request(options, function(err, res, body) {
                    body = JSON.parse(body);
                    if(body.documents != undefined && body.documents.length != 0){
                        let tmp = body.documents;
                        for (index in tmp){
                            tmp[index].priority = calcPrior(time, Math.max(mylist[0].min, 1), parseInt(tmp[index].distance));
                        }
                        resultarray = tmp;
                    }
                    resolve(resultarray);
                })
            })
            for(let i = 1; i < mylist.length; i++){
                mypro[i] = new Promise(function(resolve, reject){
                    mypro[i - 1].then(function(ra){
                        var options = {
                            url: surl + encodeURI(mylist[i].type),
                            headers: headers
                        };
                        request(options, function(err, res, body) {
                            body = JSON.parse(body);
                            if(body.documents != undefined && body.documents.length != 0){
                                let tmp = body.documents;
                                for (index in tmp){
                                    tmp[index].priority = calcPrior(time, Math.max(mylist[i].min, 1), parseInt(tmp[index].distance));
                                }
                                ra = ra.concat(tmp);
                            }
                            resolve(ra);
                        })
                    })
                })
            }
            mypro[mylist.length - 1].then(function(ra){
                ra = ra.sort((a, b) => a.priority - b.priority);
                res.json(ra);
            })
        });
    })
})



function calcPrior(set, spend, move){
    let numToReturn = set*60*60 - spend*60*60;
    numToReturn += 5 * move / 1.1;
    numToReturn += 10 * move / 1.1 / set;
    return numToReturn;
}

function deleteByPeople(list, people){
    let newlist = [];
    for(i in list){
        if(list[i].limit >= people){
            newlist.push(list[i]);
        }
    }
    return newlist;
}

function deleteByTime(list, time){
    let newlist = [];
    for(i in list){
        if(list[i].min < time && list[i].max > time){
            newlist.push(list[i]);
        }
    }
    return newlist;
}

function findPref(from, content){
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
    let PI = Math.PI;
    let DEGRAD = PI / 180.0;
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
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if(theta > PI){
        theta -= 2 * PI;
    }
    if(theta < -PI){
        theta += 2 * PI;
    }
    theta *= sn;
    let x = ra * Math.sin(theta) + map.xo;
    let y = ro - ra * Math.cos(theta) + map.yo;
    x = parseInt(x + 1.5);
    y = parseInt(y + 1.5);
    return [x, y];
}

function getWURL(wdate, loc){
    newhour = wdate.getHours();
    newminute = wdate.getMinutes();
    let url = "http://apis.data.go.kr/1360000/VilageFcstInfoService/getVilageFcst?serviceKey=mg9I4VBCmTi1FupAyPU4QJUjbv98AeUk7CUsce7asBAeDDKgPzQWd3PzXukCX2w2wObVx85vt2KkVqWbzXWfVQ%3D%3D";
    url += "&numOfRows=100";
    url += "&dataType=JSON";
    url += "&pageNo=1";
    url += "&base_date=" + wdate.getFullYear();
    if(wdate.getMonth() + 1 < 10){
        url += 0;
    }
    url += (wdate.getMonth() + 1);
    if(wdate.getDate() < 10){
        url += 0;
    }
    url += wdate.getDate();
    url += "&base_time=";
    if(newhour < 10){
        url += 0;
    }
    url += newhour;
    if(newminute == 0){
        url += "00";
    }
    else{
        url += "30";
    }
    url += "&nx=" + loc[0];
    url += "&ny=" + loc[1];
    return url;
}

function checkWeather(weatherinfo, start, end){
    let raininfo = [];
    for(let i in weatherinfo){
        if (weatherinfo[i].category == "POP"){
            raininfo.push(watherinfo[i]);
        }
    }
    let i = 0;
    starttime = start.getHours() * 100;
    try{
        while(i < 100 && parseInt(raininfo[i].fcstTime) < starttime){
            i++;
        }
        i--;
        while(i < 100 && parseInt(raininfo[i].fcstTime) < starttime){
            if (raininfo[i].fcstValue >= 50){
                return true;
            }
        }
        return false;
    }
    catch{
        return false;
    }
}

function deleteOut(list){
    let newlist = [];
    for(i in list){
        if(list[i].out == false){
            newlist.push(list[i]);
        }
    }
    return newlist;
}

var port = process.env.PORT || 5000;
app.listen(port, function(){
    console.log("server on, port: " + port);
})