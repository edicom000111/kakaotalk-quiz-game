const Jsoup = org.jsoup.Jsoup;
const Document = org.jsoup.nodes.Document;
const Element = org.jsoup.nodes.Element;
const Elements = org.jsoup.select.Elements;

var txt;
var sdcard = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();
var file = sdcard+"/퀴즈.txt";

var name2 = new Array();
var player = new Array();
var s1 = null, s2 = null;

//https://api.hearthstonejson.com/v1/62331/koKR/cards.collectible.json
//https://hearthstonejson.com/docs/cards.html 에서 하스스톤 카드 api 찾음.

init();

var before = [null,null];

function init(){
	parse("https://namu.wiki/w/%ED%95%98%EC%8A%A4%EC%8A%A4%ED%86%A4/%EC%A7%81%EC%97%85%20%EC%A0%84%EC%9A%A9%20%EC%B9%B4%EB%93%9C");
	parse("https://namu.wiki/w/%ED%95%98%EC%8A%A4%EC%8A%A4%ED%86%A4/%EA%B3%B5%EC%9A%A9%20%EC%B9%B4%EB%93%9C");

	txt = readFile(file);

	if(txt != null) {
		var list = txt.split("\n");
		for (var i in list) player.push(list[i].split(","));
		Log.i("[퀴즈] ["+getTime("G yyyy년 MM월 dd일 aa hh:mm:ss(E)")+"] LOG : 불러오기 완료\n");
		saveFile(file+".backup",txt,false);
	} else Log.i("[퀴즈] ["+getTime("G yyyy년 MM월 dd일 aa hh:mm:ss(E)")+"] LOG : 처음부터 기록\n");

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

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
	if(before[0] == room && before[1] == msg){
		Log.e("중복되는 메세지, "+before.join(","));
		return;
	}
	before[0] = room;
	before[1] = msg;
	if(isGroupChat) {
		if(msg == "/help") {
			replier.reply(room, "자음퀴즈 ver 1.0\n\"/하스카드퀴즈\" or \"애니제목퀴즈\"\n버그개많음");
		}
		var s = indexOf(sender, 0);
		if((msg == "/하스카드퀴즈") && s == -1) {
			replier.reply(room, "새로운 플레이어가 인식되었습니다.\n환영합니다, "+sender+"님.");
			var arr = [sender, -1, 0, 0];
			player.push(arr);
		} else {
			if(player.length == 0) return;
			if(player[s][1] != -1) {
				if(msg == name2[player[s][1]][0]) {
					player[s][1] = -1;
					player[s][2] = 0;
					player[s][3] ++;
					replier.reply(room, "정답!! 현재 점수 : "+player[s][3]+"점");
					makeTXT(); //데이터 절약을 위해
				} else {
					player[s][2] --;
					if(player[s][2] != 0) {
						replier.reply(room, "오답!\n"+sender+"님의 문제입니다.\n이름 : "+cho_hangul(name2[player[s][1]][0])+"\n"+name2[player[s][1]][1]+"코스트 "+name2[player[s][1]][2]+" "+name2[player[s][1]][3]+"카드\n남은기회 : "+player[s][2]+"번");
					} else {
						if(player[s][3] > 0)player[s][3]--;
						replier.reply(room, "오답!\n정답은 "+name2[player[s][1]][0]+"이었습니다!\n현재 하스뒷면퀴즈 점수 :  "+player[s][3]);
						player[s][1] = -1;
					}
				}
			} else {
				if(msg == "/하스카드퀴즈") {
					var s2 = Math.floor(Math.random() * name2.length);
					replier.reply(room, sender+"님의 문제입니다.\n이름 : "+cho_hangul(name2[s2][0])+"\n"+name2[s2][1]+"코스트 "+name2[s2][2]+" "+name2[s2][3]+"카드\n남은기회 : 3번");
					player[s][1] = s2;
					player[s][2] = 3;
				} else {
				}
			}
		}
		if(msg == "/랭킹" || msg == "/순위") {
			player = mergeSort(player);
			var str = "";
			for (var i=0; i<player.length; i++) {
				str += (i+"위 : "+player[i][0]+" : +"+player[i][3]);
				if(i != player.length - 1) str += "\n";
			}
			replier.reply(room, str);
		}
	}
}

function parse(url) {
	var table = Jsoup.connect(url).execute().parse().body().getElementsByClass("wiki-heading-content");
	for (var i = 2; i < table.size(); i ++) {
		if(table.get(i).getElementsByClass("wiki-table-wrap").size() > 0) {
			var cards = table.get(i).getElementsByClass("wiki-table-wrap").get(0).child(0).child(0).children();
			for (var ii = 1; ii < cards.size(); ii ++) {
				var card = cards.get(ii);
				if(card.children().size() != 4) continue;
				if(isNaN(card.child(1).child(0).ownText())) continue;
				var arr = new Array();
				arr.push(card.child(0).child(0).child(0).ownText());
				arr.push(card.child(1).child(0).ownText());
				arr.push(card.child(2).child(0).ownText());
				arr.push(card.child(3).child(0).ownText());
				name2.push(arr);
			}
		}
	}
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
    if (left[0][3] <= right[0][3]) { 
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
