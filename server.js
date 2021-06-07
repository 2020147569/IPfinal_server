var express = require('express');
var app = express();
const fs = require('fs');
const request = require('request');
const cors = require('cors');

var headers = {'Authorization': 'KakaoAK 1e92017a6f706280b10c46c94dfebd78'};

app.use(express.json());
app.use(cors());

app.post('/', (req, res) => {
    res.send(req.body);
})
//app.get('/', async(req, res) => {
    /*let category = req.body.category;
    let people = req.body.pnum;
    let time = req.body.time;
    let mylist = [];
    let prefer = req.body.prefer;
    let hate = req.body.hate;
    let lon = req.body.lon;
    let lat = req.body.lat;*/
    /*let date = new Date();
    let predate = new Date();
    let latdate = new Date();
    latdate.setHours(latdate.getHours() + 3);
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
    var mylist;
    let category = ["양식", "중식", "일식", "PC방", "볼링장", "노래방", "코인 노래방", "공원", "당구장", "방탈출", "박물관", "보드 게임 카페", "카페", "주점", "미술관", "연극극장", "백화점", "마사지", "아쿠아리움", "사진관", "만화카페"];
    let map = new Object();
    let lon = 126.929810;
    let lat = 37.488201;
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
            mylist = findPref(category, contents);
            if(raining){
                mylist = deleteOut(mylist);
            }
            var options = {
                url: 'https://dapi.kakao.com/v2/local/search/keyword.json?y=37.514322572335935&x=127.06283102249932&radius=20000',
                headers: headers
            };
            request(options, function(err, res, body) {
                console.log(body);
            })

            console.log("final list");
            console.log(mylist);
            res.status(200);
            res.json([{
                "place_name": "카카오프렌즈 코엑스점",
                "distance": "418",
                "place_url": "http://place.map.kakao.com/26338954",
                "category_name": "가정,생활 > 문구,사무용품 > 디자인문구 > 카카오프렌즈",
                "address_name": "서울 강남구 삼성동 159",
                "road_address_name": "서울 강남구 영동대로 513",
                "id": "26338954",
                "phone": "02-6002-1880",
                "category_group_code": "",
                "category_group_name": "",
                "x": "127.05902969025047",
                "y": "37.51207412593136"
            }]);
            //res.json(mylist);
        });
    })
    
})

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
}*/

var port = process.env.PORT || 5000;
app.listen(port, function(){
    console.log("server on, port: " + port);
})