const kalingModule = require('kaling').Kakao();
const Kakao = new kalingModule;

const Jsoup = org.jsoup.Jsoup;
const Document = org.jsoup.nodes.Document;
const Element = org.jsoup.nodes.Element;
const Elements = org.jsoup.select.Elements;

const key = '';
const email = ''; // email or phone number
const pw = '';
const id = 0;

const sdcard = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();
const file = sdcard+"/퀴즈.txt";
const cardClass = {"NEUTRAL" : "중립", "WARRIOR" : "전사", "SHAMAN" : "주술사", "ROGUE" : "도적", "PALADIN" : "성기사", "HUNTER" : "사냥꾼", "DRUID" : "드루이드", "WARLOCK" : "흑마법사", "MAGE" : "마법사", "PRIEST" : "사제", "DEMONHUNTER" : "악마사냥꾼"};
const cardRarity = {"FREE" : "기본", "COMMON" : "일반", "RARE" : "희귀", "EPIC" : "특급", "LEGENDARY" : "전설"};
let cards;

var txt;
var player = new Array();
var message = [null,null];





init();
function init(){
	Kakao.init(key);
	Kakao.login(email, pw);
	cards = JSON.parse(Jsoup.connect("https://api.hearthstonejson.com/v1/62331/koKR/cards.collectible.json").ignoreContentType(true).execute().body());
	//https://api.hearthstonejson.com/v1/62331/koKR/cards.collectible.json
	//https://hearthstonejson.com/docs/cards.html 에서 하스스톤 카드 api 찾음.
	//https://art.hearthstonejson.com/v1/512x/EX1_001.jpg
	txt = readFile(file);

	if(txt != null) {
		var list = txt.split("\n");
		for (var i in list){
			player.push(list[i].split(","));
			player[player.length-1][1] = parseInt(player[player.length-1][1]);
			player[player.length-1][2] = parseInt(player[player.length-1][2]);
			player[player.length-1][3] = parseInt(player[player.length-1][3]);
		}
		Log.i("[퀴즈] ["+getTime("G yyyy년 MM월 dd일 aa hh:mm:ss(E)")+"] LOG : 불러오기 완료\n");
		saveFile(file+".backup",txt,false);
	} else Log.i("[퀴즈] ["+getTime("G yyyy년 MM월 dd일 aa hh:mm:ss(E)")+"] LOG : 처음부터 기록\n");

}

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
	if(message[0] == room && message[1] == msg){
		Log.e("중복되는 메세지, "+message.join(","));
		return;
	}
	message[0] = room;
	message[1] = msg;
	if(isGroupChat) {
		if(msg == "/help") {
			replier.reply(room, "자음퀴즈 ver 1.0\n\"/하스카드퀴즈\"\n버그개많음");
		}
		var s = indexOf(sender, 0);
		if((msg == "/하스카드퀴즈") && s == -1) {
			replier.reply(room, "새로운 플레이어가 인식되었습니다.\n환영합니다, "+sender+"님.");
			var arr = [sender, -1, 0, 0];
			player.push(arr);
		} else {
			if(s == -1) return;
			if(player[s][1] != -1) {
				if(msg == cards[player[s][1]].name) {
					player[s][1] = -1;
					player[s][2] = 0;
					player[s][3] ++;
					replier.reply(room, "정답!! 현재 점수 : "+player[s][3]+"점");
					makeTXT(); //데이터 절약을 위해
				} else {
					player[s][2] --;
					if(player[s][2] != 0) {
						//replier.reply(room, "오답!\n"+sender+"님의 문제입니다.\n이름 : "+cho_hangul(cards[player[s][1]].name)+"\n"+cards[player[s][1]].cost+"코스트 "+getCardClass(cards[player[s][1]].cardClass)+" "+cardRarity[cards[player[s][1]].rarity]+"카드\n남은기회 : "+player[s][2]+"번");
						sendImage(room, sender+" 오답!", "남은기회 : "+player[s][2]+"번", "https://art.hearthstonejson.com/v1/512x/"+cards[player[s][1]].id+".jpg");
						
					} else {
						if(player[s][3] > 0)player[s][3]--;
						replier.reply(room, "오답!\n정답은 "+cards[player[s][1]].name+"이었습니다!\n현재 하스퀴즈 점수 :  "+player[s][3]);
						player[s][1] = -1;
					}
				}
			} else {
				if(msg == "/하스카드퀴즈") {
					var s2 = Math.floor(Math.random() * cards.length);
					//replier.reply(room, sender+"님의 문제입니다.\n이름 : "+cho_hangul(cards[s2].name)+"\n"+cards[s2].cost+"코스트 "+getCardClass(cards[s2].cardClass)+" "+cardRarity[cards[s2].rarity]+"카드\n남은기회 : 3번");
					sendImage(room, sender+"님의 문제입니다.", "남은기회 : 3번", "https://art.hearthstonejson.com/v1/512x/"+cards[s2].id+".jpg");
					player[s][1] = s2;
					player[s][2] = 3;
				} else {
				}
			}
		}
		if(msg == "/랭킹" || msg == "/순위") {
			var rank = mergeSort(player);
			var str = "";
			for (var i=0; i<player.length; i++) {
				str += ((i+1)+"위 : "+rank[i][0]+" : +"+rank[i][3]);
				if(i != player.length - 1) str += "\n";
			}
			replier.reply(room, str);
		}
	}
}

function sendImage(room, title, context, img){
	Kakao.send(room, {
	"link_ver": "4.0",
	"template_id": id ,
	"template_args": {
		"img" : img,
		"data1": title,
		"data2": context
	}}, "custom");
}

function getCardClass(c){
	var arr;
	if(Array.isArray(c)) arr = c;
	else arr = [c];
	for(var i in arr){
		arr[i] = cardClass[arr[i]];
	}
	return arr.join("/");
}



const mergeSort = function(array) {
  if (array.length < 2) return array; 
  let pivot = Math.floor(array.length / 2); //쪼개기
  let left = array.slice(0, pivot); 
  let right = array.slice(pivot, array.length); 
  return merge(mergeSort(left), mergeSort(right)); // 재귀
}
function merge(left, right) {
  let result = [];
  while (left.length && right.length) { // ___.length가 true일 때 === 배열 안에 값이 남아있을 때
    if (left[0][3] >= right[0][3]) { 
      result.push(left.shift()); // shift() 메서드는 배열에서 첫 번째 요소를 제거하고, 제거된 요소를 반환합니다.
    } else {
      result.push(right.shift()); 
    }
  }
  while (left.length) result.push(left.shift()); 
  while (right.length) result.push(right.shift());
  return result;
};


function cho_hangul(str) {
	var cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
	var result = "";
	for (i=0;i<str.length;i++) {
		code = str.charCodeAt(i)-44032;
		if(code>-1 && code<11172) result += cho[Math.floor(code/588)]; else result += str[i];
	}
	return result;
}


function indexOf(str, num) {
	for (var i in player) {
		if(player[i][num]+"" == str+"") return i;
	}
	return -1;
}


function makeTXT() {
	txt = "";
	for (var i in player) {
		txt += player[i].join(",");
		if(i < player.length - 1) txt += "\n";
	}
	saveFile(file,txt,false);
	Log.i("[퀴즈] ["+getTime("G yyyy년 MM월 dd일 aa hh:mm:ss(E)")+"] LOG : 저장완료\n");
	
}

function readFile(path) {
	try {
		var file = new java.io.File(path);
		if(!(file.exists())) return null;
		var fis = new java.io.FileInputStream(file);
		var isr = new java.io.InputStreamReader(fis);
		var br = new java.io.BufferedReader(isr);
		var s = br.readLine();
		var read = "";
		while((read = br.readLine()) != null) s += "\n" + read;
		fis.close();
		isr.close();
		br.close();
		return s;
	}
	catch(e) {
		Log.e(e);
	}
}
function saveFile(path,content,bool) {
	try {
		var file = new java.io.File(path);
		if(!file.exists()) {
			makeFile(path);
			file = new java.io.File(path);
		}
		var fw = new java.io.FileWriter(file,bool);
		var bw = new java.io.BufferedWriter(fw);
		var str = new java.lang.String(content);
		bw.write(str);
		bw.close();
		fw.close();
	}
	catch(e) {
		Log.e(e);
	}
}
function makeFile(path) {
	try {
		var file = new java.io.File(path);
		if(file.createNewFile()) {
		} else {
		}
	}
	catch(e) {
		Log.e(e);
	}
}
function makeFolder(path) {
	try {
		var file = new java.io.File(path);
		if(!file.exists()) {
			file.mkdir();
		} else {
		}
	}
	catch(e) {
		Log.e(e);
	}
}


function getTime(format) {
	format=new java.text.SimpleDateFormat(format);
	var cal=java.util.Calendar.getInstance();
	return format.format(cal.getTime());
}




function onCreate(savedInstanceState, activity) {
  var textView = new android.widget.TextView(activity);
  textView.setText("Hello, World!");
  textView.setTextColor(android.graphics.Color.DKGRAY);
  activity.setContentView(textView);
}

function onStart(activity) {}

function onResume(activity) {}

function onPause(activity) {}

function onStop(activity) {}
