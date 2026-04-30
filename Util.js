
function RemoveDebugInfoInJsonResult(strJsonResult)
{
	var nResultHeaderPos_1 = strJsonResult.indexOf("{\"bResult\":");
	var nResultHeaderPos_2 = strJsonResult.indexOf("{\'bResult\':");
	var nResultHeaderPos = -1;
	if (nResultHeaderPos_1 >= 0)
		nResultHeaderPos = nResultHeaderPos_1;
	if (nResultHeaderPos_2 >= 0)
		nResultHeaderPos = nResultHeaderPos_2;
	if (nResultHeaderPos < 0)
		return "";
	if (nResultHeaderPos > 0)
		return strJsonResult.substr(nResultHeaderPos);
	return strJsonResult;
}
  
function HexToString(str)
{
	if (str == undefined || str == null)
		return "";
	if (str.length % 2 != 0)
		return "";
	var strResult = "";
	for (var i = 0; i < str.length; i += 2)
	{
		var n = NaN;
		n = parseInt(str.substring(i, i+2), 16);
		if (n == NaN)
			return "";
		strResult += String.fromCharCode(n);
	}
	return strResult;
}
function StringToHex(str)
{
	var hex="";
	if (str == undefined || str == null)
		return "";
	for(var i = 0; i < str.length; i++)
		hex += str.charCodeAt(i).toString(16);
	return hex;
}

function Base64Encode(str)
{	
		var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    var out, i, len;
    var c1, c2, c3;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += base64EncodeChars.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}
function Base64Decode(str)
{
		var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

    var c1, c2, c3, c4;
    var i, len, out;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        /* c1 */
        do {
            c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        }
        while (i < len && c1 == -1);
        if (c1 == -1) 
            break;
        /* c2 */
        do {
            c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        }
        while (i < len && c2 == -1);
        if (c2 == -1) 
            break;
        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
        /* c3 */
        do {
            c3 = str.charCodeAt(i++) & 0xff;
            if (c3 == 61) 
                return out;
            c3 = base64DecodeChars[c3];
        }
        while (i < len && c3 == -1);
        if (c3 == -1) 
            break;
        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
        /* c4 */
        do {
            c4 = str.charCodeAt(i++) & 0xff;
            if (c4 == 61) 
                return out;
            c4 = base64DecodeChars[c4];
        }
        while (i < len && c4 == -1);
        if (c4 == -1) 
            break;
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
}

function Utf8to16(str)
{
    var out, i, len, c;
    var char2, char3;
    
		if (str == undefined || str == null)
			return "";
		
    out = "";
    len = str.length;
    i = 0;
    while(i < len) {
 c = str.charCodeAt(i++);
 switch(c >> 4)
 {
   case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
     // 0xxxxxxx
     out += str.charAt(i-1);
     break;
   case 12: case 13:
     // 110x xxxx   10xx xxxx
     char2 = str.charCodeAt(i++);
     out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
     break;
   case 14:
     // 1110 xxxx  10xx xxxx  10xx xxxx
     char2 = str.charCodeAt(i++);
     char3 = str.charCodeAt(i++);
     out += String.fromCharCode(((c & 0x0F) << 12) |
        ((char2 & 0x3F) << 6) |
        ((char3 & 0x3F) << 0));
     break;
 }
    }
    return out;
}
function Utf16to8(str)
{ 
    var out, i, len, c;  
    out = "";  
    len = str.length;  
    for (i = 0; i < len; i++) {  
        c = str.charCodeAt(i);  
        if ((c >= 0x0001) && (c <= 0x007F)) {  
            out += str.charAt(i);  
        }  
        else   
            if (c > 0x07FF) {  
                out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));  
                out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));  
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));  
            }  
            else {  
                out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));  
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));  
            }  
    }  
    return out;  
}
function MyJsonDecode(str)
{
	return Utf8to16(HexToString(str));
}
function CalcOccupancy(nUsed, nTotal)
{
	var nOccupancy = 0;

	if (nTotal == 0)
		nOccupancy = 0;
	else
		nOccupancy = 100 * nUsed / nTotal;
	// 错误的数据视作0
	if (nOccupancy > 100)
		nOccupancy = 0;
	return nOccupancy;
}
function SubParttName(strParttNameSnmpData)
{
	var nPos_Splitor = -1;
	nPos_Splitor = strParttNameSnmpData.indexOf(":\\");
	if (nPos_Splitor <= 0)
		return strParttNameSnmpData;
	return strParttNameSnmpData.substr(nPos_Splitor - 1, 3);
}
function TimeDiff(datestr1, datestr2)
{
    var date1 = new Date(Date.parse(datestr1.replace(/-/g, "/")));
    var date2 = new Date(Date.parse(datestr2.replace(/-/g, "/")));

    if (date1.getTime() < date2.getTime())
    	return "";

    var difference = date1.getTime() - date2.getTime();
    var thisdays = Math.floor(difference / (1000 * 60 * 60 * 24));

    difference = difference - thisdays * (1000 * 60 * 60 * 24);
    var thishours = Math.floor(difference / (1000 * 60 * 60));
    
    difference = difference - thishours * (1000 * 60 * 60);
    var thisminutes = Math.floor(difference / (1000 * 60));
    
    difference = difference - thisminutes * (1000 * 60);
    var thisseconds = Math.floor(difference / (1000));

    var strRet = "";
    if (thisdays > 0)
    	strRet += thisdays + '天';
    strRet += thishours + '小时';
    strRet += thisminutes + "分";
    strRet += thisseconds + "秒";
    return strRet;
}
function TimeDiff_Second(datestr1, datestr2)
{
    var date1 = new Date(Date.parse(datestr1.replace(/-/g, "/")));
    var date2 = new Date(Date.parse(datestr2.replace(/-/g, "/")));

    var difference = date1.getTime() - date2.getTime();
    var thisseconds = Math.floor(difference / (1000));
    return thisseconds;
}
function StringOmitDisplay_Pure(str, nMaxCount)
{
	if (str.length <= nMaxCount)
		return str;
	return str.substr(0, nMaxCount) + "...";
}
function StringOmitDisplay(str, nMaxCount)
{
	var strOmitted = "";
	
	if (str.length <= nMaxCount)
		return str;
	strOmitted = 
		'<a title="' +
		str +
		'" class="easyui-tooltip">' +
		str.substr(0, nMaxCount) + "...</a>";
	return strOmitted;
}

function GetTimeDisplayString(nTotalSecond)
{
	var nHour = 0;
	var nMinute = 0;
	var nSecond = 0;
	var strHour = "";
	var strMinute = "";
	var strSecond = "";
	var nTotalSecond_Left = nTotalSecond;
	var strTime = "";

	nHour = Math.floor(nTotalSecond_Left / 3600);
	nTotalSecond_Left = nTotalSecond_Left % 3600;
	
	nMinute = Math.floor(nTotalSecond_Left / 60);
	nTotalSecond_Left = nTotalSecond_Left % 60;
	
	nSecond = nTotalSecond_Left;

	if (nHour != 0)
		strHour = String(nHour) + "小时";
	if (nMinute != 0)
		strMinute = String(nMinute) + "分钟";
	if (nSecond != 0)
		strSecond = String(nSecond) + "秒";
	if (strHour == "" && strMinute == "" && strSecond == "")
		strSecond = "0秒";
	return strHour + strMinute + strSecond;
}

function Valid_DateCommon(str)
{
	//var strRegx = /^(?:19|20)[0-9][0-9]-(?:(?:0[1-9])|(?:1[0-2]))-(?:(?:[0-2][1-9])|(?:[1-3][0-1])) (?:(?:[0-2][0-3])|(?:[0-1][0-9])):[0-5][0-9]:[0-5][0-9]$/;
	var strRegx = /^(?:19|20)[0-9][0-9]-(?:(?:0[1-9])|(?:1[0-2]))-(?:(?:[0-2][1-9])|(?:[1-3][0-1]))$/;
	return strRegx.test(str);
}
function Valid_Time(str)
{
	if (str.length != 8)
		return false;
	if (str.charAt(2) != ':')
		return false;
	if (str.charAt(5) != ':')
		return false;
		
	var hh = str.substring(0,2);
	if (isNaN(hh))
		return false;
	hh = parseInt(hh);
	if (hh > 23 || hh < 0)
		return false;
		
	var mm = str.substring(3,5);
	if (isNaN(mm))
		return false;
	mm = parseInt(mm);
	if (mm > 59 || mm < 0)
		return false;
		
	var ss = str.substring(6,8);
	if (isNaN(ss))
		return false;
	ss = parseInt(ss);
	if (ss > 59 || ss < 0)
		return false;
	return true;
}
// 0或者正整数
function Valid_Int(str)
{
	if (str == undefined || str == null)
		return false;
	var strRegx = /^[1-9]\d*$|^0$/;
	return strRegx.test(str);
}
function Valid_Float(str)
{
	if (str == undefined || str == null)
		return false;
	if (str.length == 0)
		return false;
	var strRegx = /^-?[0-9]*(\.\d*)?$|^-?d^(\.\d*)?$/;
	return strRegx.test(str);
}
function Valid_IP(str)   
{
	if (str == undefined || str == null)
		return false;
	if (str.length == 0)
		return false;
	var strRegx = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
	return strRegx.test(str);
} 
function FormatDateToCommon(date)
{
  var y = date.getFullYear();
  var m = date.getMonth()+1;
  var d = date.getDate();
  return y+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d);
}
function GetCurrentDateString()
{
	return FormatDateToCommon(new Date());
}
Date.prototype.Format = function(formatStr)   
{
    var str = formatStr;   
    var Week = ['日','一','二','三','四','五','六'];  
  
    str=str.replace(/yyyy|YYYY/,this.getFullYear());   
    str=str.replace(/yy|YY/,(this.getYear() % 100)>9?(this.getYear() % 100).toString():'0' + (this.getYear() % 100));   
  
    str=str.replace(/MM/,(this.getMonth()+1)>9?(this.getMonth()+1).toString():'0' + (this.getMonth()+1));
    str=str.replace(/M/g,(this.getMonth()+1));   
  
    str=str.replace(/w|W/g,Week[this.getDay()]);   
  
    str=str.replace(/dd|DD/,this.getDate()>9?this.getDate().toString():'0' + this.getDate());   
    str=str.replace(/d|D/g,this.getDate());   
  
    str=str.replace(/hh|HH/,this.getHours()>9?this.getHours().toString():'0' + this.getHours());   
    str=str.replace(/h|H/g,this.getHours());   
    str=str.replace(/mm/,this.getMinutes()>9?this.getMinutes().toString():'0' + this.getMinutes());   
    str=str.replace(/m/g,this.getMinutes());   
  
    str=str.replace(/ss|SS/,this.getSeconds()>9?this.getSeconds().toString():'0' + this.getSeconds());   
    str=str.replace(/s|S/g,this.getSeconds());   
  
    return str;   
}
function DateStringAdd(strDate, nAdd)
{
		var tDate = new Date(strDate);
 		tDate.setDate(tDate.getDate() + nAdd);
 		return tDate.Format('yyyy-MM-dd');  // 用到自实现的格式化函数
}
// 获得指定日期在本年内地周号
function GetDateWeekIndexInYear(strDate)
{
	// 算法：指定日期减去该年1月1号所在周的周一的时间，除以7天
	var dateDate = null;
	if (strDate == "")
		dateDate = new Date();
	else
		dateDate = new Date(strDate);
	var strTheYearFeb1 = String(dateDate.getFullYear()) + "-01-01";
	var dateTheYearFeb1 = new Date(strTheYearFeb1);
	var date1stWeekMonday = dateTheYearFeb1;
	date1stWeekMonday.setDate(dateTheYearFeb1.getDate() + (1 - (dateTheYearFeb1.getDay()==0?7:dateTheYearFeb1.getDay()))) // 周日是0，周一是1
	
  var difference = dateDate.getTime() - date1stWeekMonday.getTime();
  var nDiffDaysCount = Math.floor(difference / (1000 * 60 * 60 * 24));
	
	return 1 + Math.floor(nDiffDaysCount / 7);
}
// 获得指定周的周一的日期
function GetWeekIndexInYear_MondayDate(strYear, nWeekIndex)
{
	// 算法：该年1月1号所在周的周一的时间，加上7乘于周序号的天数
	if (strYear == "")
	{
		var dateDate = new Date();
		strYear = String(dateDate.getFullYear());
	}
	var strTheYearFeb1 = strYear + "-01-01";
	var dateTheYearFeb1 = new Date(strTheYearFeb1);
	var date1stWeekMonday = dateTheYearFeb1;
	date1stWeekMonday.setDate(dateTheYearFeb1.getDate() + (1 - (dateTheYearFeb1.getDay()==0?7:dateTheYearFeb1.getDay()))) // 周日是0，周一是1
	
	date1stWeekMonday.setDate(date1stWeekMonday.getDate() + (nWeekIndex-1) * 7);
	return date1stWeekMonday.Format("YYYY-MM-DD");
}
function GetMondayDate(strDate)
{
	var dateDate = null;
	if (strDate == "")
		dateDate = new Date();
	else
		dateDate = new Date(strDate);
		
	dateDate.setDate(dateDate.getDate() + (1 - (dateDate.getDay()==0?7:dateDate.getDay()))) // 周日是0，周一是1
	return dateDate.Format('yyyy-MM-dd');
}
// 函数未完成
function GetFileSizeCommonDisplayString(nFileSize)
{
	return "";
}
// 获取指定日期的周1到周日（1到7）的序号
function GetWeekDayIndex_1To7(strDate)
{
	var nDayIndex_Origin = (new Date(strDate)).getDay(); // 周日是0，周一是1
	if (nDayIndex_Origin == 0)
		nDayIndex_Origin = 7;
	return nDayIndex_Origin;
}
function GetMonthEndDate(nYear, nMonth)  // 获取指定年月的最后一天日期
{
	var nNextMonth_Year = nYear;
	var nNextMonth_Month = nMonth + 1;
	if (nNextMonth_Month == 13)
	{
		nNextMonth_Year ++;
		nNextMonth_Month = 1;
	}
	var dateMonthEndDate = new Date(String(nNextMonth_Year) + "-" + String(nNextMonth_Month) + "-1");
	dateMonthEndDate.setDate(dateMonthEndDate.getDate() - 1);  // 减一天
	return dateMonthEndDate.Format('yyyy-MM-dd');
}
function IsInCommonList(strList, strSplitor, strItem)
{
	var nIndex = -1;
	if (   strList.indexOf(strItem + strSplitor) == 0
			|| strList.indexOf(strSplitor + strItem + strSplitor) >= 0
			|| (  ((nIndex = strList.indexOf(strSplitor + strItem)) >= 0) && nIndex == strList.length - (strSplitor + strItem).length  )
			)
		return true;
	return false;
}

//// 此函数极限情况下存在BUG
//function stringify_ForIe8(object)
//{
//    var string = JSON.stringify(object)
//    return string.replace(/\\u([0-9a-fA-F]{2,4})/g,function(string,matched){
//        return String.fromCharCode(parseInt(matched,16))
//    })
//}
function EasyUI_DialogInit(strDialogId)
{
	$("#" + strDialogId).show();
	$("#" + strDialogId).dialog();
	$("#" + strDialogId).dialog('center');
	$("#" + strDialogId).dialog('close');
}

// IE8不支持Object.keys(
function Object__keys(obj)
{
	var arKeys = new Array;
	for (var strKey in obj)
		arKeys.push(strKey);
	return arKeys;
}