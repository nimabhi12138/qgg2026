
var g_AllClient = null;
var g_strClientId_SelectedList = "";
var g_bUpdateOrInsert = true;

var g_nRecordCount_Client = 0;
var g_nPageCount_Client = 1;
var g_nRecordCountEachPage_Client = 400;
var g_nCurrentPageIndex_Client = 0;

var g_strOrderBy = "";
var g_nEscDesc = 0;

jQuery(document).ready(function() {
	func_Get();
	DebugRule_Module_Init();
	EasyUI_DialogInit("divEditClientDialog");
	EasyUI_DialogInit("divEditIp_InternetBarNameDialog");
	EasyUI_DialogInit("divShowClientLogDialog");
	$(".sort-esc-img").hide();
	$('#divClientList').css('height', $(window).height() - 140);
	
	EasyUI_DialogInit("divEditDebugRuleDialog");
	EasyUI_DialogInit("divGenerateStaticRuleDialog");
	EasyUI_DialogInit("divRecentAgentClientCountChartDialog");
	
	$('#search_keyword').on('input', function(){
		InputSearchKeyword();
	});
	
});
var func_Get = function Get()
{
	if (g_ip.length > 0)
	{
		$('#search_field').val('PublicIP');
		$('#search_keyword').val(g_ip);
	}
	else if (g_mac.length > 0)
	{
		$('#search_field').val('LocalMac');
		$('#search_keyword').val(g_mac);
	}
	
	GetAllClient(1);
	GetRecentStatt();
	if (g_AgentID != 0)
		ShowRecentAgentClientCountChart(true);
}
function GetAllClient(nPageIndex_1Add)
{
	var strMsg = "";
	var nItemCount = 0;
	var i = 0;
	g_strClientId_SelectedList = "";
	var strQuery = "";
	
 	if (! Valid_Int(nPageIndex_1Add) || nPageIndex_1Add <= 0 || nPageIndex_1Add > g_nPageCount_Client)
  {
  	$.messager.alert('错误','页序号必须为1到'+g_nPageCount_Client+'之间的数字，请重新输入！');
    return;
 	}
 	var nPageIndex = nPageIndex_1Add - 1;
 	
 	if (g_strOrderBy.length == 0)
 		g_strOrderBy = "0";
 	strQuery += "page="+String(nPageIndex)+'&pagecount='+String(g_nRecordCountEachPage_Client)+"&order="+g_strOrderBy+"&orderesc="+String(g_nEscDesc);
 	strQuery += "&search_field=" + $('#search_field').val() + "&search_keyword=" + $.trim($('#search_keyword').val());
 	strQuery += "&search_condition=" + $('#search_condition').val();
 	if (g_AgentID_ToDisplay.length > 0)
 		strQuery += "&AgentID_ToDisplay=" + g_AgentID_ToDisplay;
 		
 	//var begin_date = $.trim($('#begin_date').datebox('getValue'));
 	//var end_date = $.trim($('#begin_date').datebox('getValue'));
 	//if (begin_date.length > 0 && end_date.length > 0)
 	//	strQuery += "&begin_date=" + begin_date + "&end_date=" + end_date;
 		
 	if (g_AgentID_ToDisplay.length > 0)
 		$('#divSearch').hide();
 	else
 		$('#divSearch').show();
 	
	$.ajax({
	    type: "GET",
	    url: "client_mng/get_all_client",
	    data: strQuery,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取客户端信息失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取客户端信息失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取客户端信息失败！详细：数据错误');
	          return;
	     	}
	     	g_AllClient = jsonResult.szData.tAllClient;
	     	g_nRecordCount_Client = MyJsonDecode(jsonResult.szData.nTotalCount);
	     	var strHtml = "";
	     	
	     	g_nPageCount_Client = Math.ceil(g_nRecordCount_Client / g_nRecordCountEachPage_Client);
	     	if (g_nPageCount_Client == 0)
	     		g_nPageCount_Client = 1;
	     		
	     	ShowAllClient();
  
			  g_nCurrentPageIndex_Client = nPageIndex;
			  SetCommonPager('GetAllClient', g_nRecordCount_Client, g_nRecordCountEachPage_Client, g_nCurrentPageIndex_Client);
	    }
	});
}
function ShowAllClient()
{
	var i = 0;
 	var strHtml = "";
 	
 	var nPageIndex = 0;
 	
 	if (g_AllClient == null)
 		return;
 	for (i = 0; i < g_AllClient.length; i ++)
 	{
 		var strClientId = MyJsonDecode(g_AllClient[i].Id);
 		var strPublicIP = MyJsonDecode(g_AllClient[i].PublicIP);
 		var strInternetBarName = MyJsonDecode(g_AllClient[i].InternetBarName);
 		var strAgentName = MyJsonDecode(g_AllClient[i].AgentName);
 		var strAgentId = MyJsonDecode(g_AllClient[i].AgentID);
 		var strMac = MyJsonDecode(g_AllClient[i].LocalMac);
 		var strComputerName = MyJsonDecode(g_AllClient[i].PcName);
 		
    strHtml += '<tr id="trClient_'+strClientId+'" onclick="Select_Client('+strClientId+')">';
    strHtml += '<td>';
    
    if (g_AgentID == 0)
		if (g_LevelType == 0)
		strHtml += 		'<a href="#" id="ahAgentNameLinkPanel_'+strClientId+'" onclick="ClickAgentName(\''+MyJsonDecode(g_AllClient[i].AgentName)+'\');" onmouseenter="Show_AgentNameLinkPanel_Common('+strClientId+','+strAgentId+',\''+strAgentName+'\');">';
		strHtml += 				strAgentName;
    if (g_AgentID == 0)
		if (g_LevelType == 0)
		strHtml += 		'</a>';
    strHtml += '</td>';
    strHtml += '<td onmouseover="Show_IpMac_Panel_Common('+strClientId+',\''+strPublicIP+'\',\'\',\'\');">';
    strHtml += 		'<a id="ahIpLinkPanel_'+strClientId+'" href="#" onclick="Show_EditIp_InternetBarNameDialog('+strClientId+',\''+strPublicIP+'\',\''+strInternetBarName+'\');">'+strPublicIP+'</a>';
    strHtml += '</td>';
    strHtml += '<td onmouseover="Show_IpMac_Panel_Common('+strClientId+',\'\',\''+strMac+'\',\'\');">';
    if (g_AgentID == 0)
		strHtml += '<a id="ahMacLinkPanel_'+strClientId+'" href="zclog://'+strAgentName+'/'+strPublicIP+'/'+strComputerName+'_'+strMac+'.zip">';
    strHtml += strMac;
    if (g_AgentID == 0)
		strHtml += '</a>';
    strHtml += '</td>';
    strHtml += '<td>'+MyJsonDecode(g_AllClient[i].client_group_name).replace('default_client_group','默认分组')+'</td>';
    strHtml += '<td onclick="Show_EditIp_InternetBarNameDialog('+strClientId+',\''+strPublicIP+'\',\''+strInternetBarName+'\');"><a href="#"><span>'+strInternetBarName+'</span></a><input type="text" value="'+strInternetBarName+'" style="width:120px;display:none;" onblur="Submit_EditIp_InternetBarName(this,\''+strPublicIP+'\');" /></td>';
    strHtml += '<td>'+strComputerName+'</td>';
    strHtml += '<td>'+MyJsonDecode(g_AllClient[i].FirstLogin).replace(".000","")+'</td>';
    strHtml += '<td>'+MyJsonDecode(g_AllClient[i].LoginDate).replace(".000","")+'</td>';
    strHtml += '<td>'+MyJsonDecode(g_AllClient[i].OsVersion)+'</td>';
    strHtml += '<td>'+MyJsonDecode(g_AllClient[i].ClientVersion)+'</td>';
    if (g_AgentID == 0)
    strHtml += '<td>'+MyJsonDecode(g_AllClient[i].client_online_count)+'</td>';
    
//    strHtml += '<td>'+(MyJsonDecode(g_AllClient[i].EnableRule)==1?'是':'否')+'</td>';
//    if (g_AgentID == 0)
//    strHtml += '<td>'+(MyJsonDecode(g_AllClient[i].EnableAd)==1?'是':'否')+'</td>';
//    if (g_AgentID == 0)
//    strHtml += '<td>'+(MyJsonDecode(g_AllClient[i].EnableInherit)==1?'是':'否')+'</td>';
//    if (g_AgentID == 0)
//    strHtml += '<td>'+MyJsonDecode(g_AllClient[i].LogType)+'</td>';
//    if (g_AgentID == 0)
//    strHtml += '<td>'+MyJsonDecode(g_AllClient[i].LogLevel)+'</td>';
//    if (g_AgentID == 0)
//    strHtml += '<td>'+MyJsonDecode(g_AllClient[i].LogPath)+'</td>';
    
    strHtml += '</tr>';
	}
	$('#tbdClientList').html(strHtml);
}
function GetAll_OrderBy(strOrderBy)
{
	if (g_strOrderBy == strOrderBy)
	{
		if (g_nEscDesc == 0)
			g_nEscDesc = 1;
		else
			g_nEscDesc = 0;
	}
	else
		g_nEscDesc = 1;
	g_strOrderBy = strOrderBy;
	var strImgSrc = '../web/Public/images/up.png';
	if (g_nEscDesc == 0)
		strImgSrc = '../web/Public/images/down.png';
	$(".sort-esc-img").hide();
	$("#spnOrderBy" + strOrderBy).prop('src', strImgSrc);
	$("#spnOrderBy" + strOrderBy).show();
	GetAllClient(1);  // 重新排序后显示第一页
}
function Select_Client(strClientId)
{
	var i = 0;
	var bIsSelected = IsInCommonList(g_strClientId_SelectedList, "_", strClientId);
	
	// 选中的再点一次就是取消
	if (bIsSelected)
	{
		// 替换一个就够了，所以不用正则
		if (g_strClientId_SelectedList.indexOf(strClientId+"_") == 0)
			g_strClientId_SelectedList = g_strClientId_SelectedList.replace(strClientId+"_", "");
		else
			g_strClientId_SelectedList = g_strClientId_SelectedList.replace("_"+strClientId+"_", "_");
	}
	else
			g_strClientId_SelectedList += strClientId + "_";
 	for (i = 0; i < g_AllClient.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllClient[i].Id);
 		if (strId == strClientId)
 		{
 			if (! bIsSelected)
				$('#trClient_'+strId).addClass('danger');
			else
				$('#trClient_'+strId).removeClass('danger');
		}
 	}
}
function DeleteClient()
{
	if (g_strClientId_SelectedList == null || g_strClientId_SelectedList == undefined || g_strClientId_SelectedList == 0)
	{
		$.messager.alert('错误','请先选中所要删除的客户端！');
		return;
	}
	$.messager.confirm('确认操作','您确定要删除所选客户端吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "POST",
			    url: "client_mng/delete_client/",
			    data: "client_id_list=" + g_strClientId_SelectedList,
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除客户端失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除客户端失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除客户端成功！");
			      GetAllClient(g_nCurrentPageIndex_Client + 1);
			    }
			});
		}
	});
}
function DeleteClient_3MonthNotOnline()
{
	$.messager.confirm('确认操作','您确定删除3个月未上线客户端吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "POST",
			    url: "client_mng/delete_client_3month_not_online/",
			    data: "",
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除3个月未上线客户端失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除3个月未上线客户端失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除3个月未上线客户端成功！");
			      GetAllClient(g_nCurrentPageIndex_Client + 1);
			    }
			});
		}
	});
}
function DeleteBar_20Client5Day()
{
	$.messager.confirm('确认操作','您确定删除动态IP网吧(3天内上线数为0)的旧数据吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "POST",
			    url: "client_mng/delete_bar_20client_5day/",
			    data: "",
			    timeout : 360*1000,
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除动态IP网吧旧数据失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除3个月未上线客户端失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除动态IP网吧旧数据成功！" + MyJsonDecode(jsonResult.szMsg));
			      GetAllClient(g_nCurrentPageIndex_Client + 1);
			    }
			});
		}
	});
}
function UpdateClient()
{
	g_bUpdateOrInsert = true;
	ShowEditClientDialog();
}
function InsertClient()
{
	g_bUpdateOrInsert = false;
	ShowEditClientDialog();
}
function ShowEditClientDialog()
{
	var strOp = "insert_client";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client";
		strOpName = "修改";
	}
	if (! g_bUpdateOrInsert)
		$('#client_id').val('');  // 新增要清空Id
	else
	{
		if (g_strClientId_SelectedList == null || g_strClientId_SelectedList == undefined || g_strClientId_SelectedList == 0)
		{
			$.messager.alert('错误','请先选中所要修改的客户端！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllClient.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllClient[i].Id);
	 		if (strId == g_strClientId_SelectedList)
	 			break;
	 	}
	 	if (i >= g_AllClient.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#client_id').val(g_strClientId_SelectedList);
		$('#client_name').val(MyJsonDecode(g_AllClient[i].client_name));
		$('#course_hour_unit').val(MyJsonDecode(g_AllClient[i].course_hour_unit));
		$('#course_date_segment').val(MyJsonDecode(g_AllClient[i].course_date_segment));
		$('#failed_refund_rate').val(MyJsonDecode(g_AllClient[i].failed_refund_rate));
		$('#quit_1_leasson_price').val(MyJsonDecode(g_AllClient[i].quit_1_leasson_price));
		$('#remark').val(MyJsonDecode(g_AllClient[i].remark));
	}
		
	$("#divEditClientDialog").dialog({title: strOpName + '客户端'});
	$('#divEditClientDialog').dialog('center');
	$('#divEditClientDialog').dialog('open');
}
function func_Submit_EditClient()
{
	var strOp = "insert_client";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client";
		strOpName = "修改";
	}
	if (! checkinput_EditClient())
		return;
	$.ajax({
	    type: "POST",
	    url: "client_mng/" + strOp,
	    data: $("#frmEditClient").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'客户端失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'客户端失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"客户端成功！");
				$('#divEditClientDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      func_GetAllClient();
	    }
	});
}
function checkinput_EditClient()
{
	var client_name = $("#client_name").val();
	if (client_name.length < 2 || client_name.length > 40)
	{
    $.messager.alert('错误','客户端名称长度必须为2到40个字符，请重新输入！');
		return false;
	}
	var course_hour_unit = $("#course_hour_unit").val();
	if (course_hour_unit.length < 1 || course_hour_unit.length > 10)
	{
    $.messager.alert('错误','课程单位长度必须为1到10个字符，请重新输入！');
		return false;
	}
	var failed_refund_rate = $("#failed_refund_rate").val();
	if (failed_refund_rate.length > 0 && ! Valid_Int(failed_refund_rate))
	{
    $.messager.alert('错误','未达标退款百分比必须为数字，请重新输入！');
		return false;
	}
	var quit_1_leasson_price = $("#quit_1_leasson_price").val();
	if (quit_1_leasson_price.length > 0 && ! Valid_Int(quit_1_leasson_price))
	{
    $.messager.alert('错误','退学单课计价长度必须为数字，请重新输入！');
		return false;
	}
	return true;
}
function GetRecentStatt()
{
	var strQuery = "";
 	strQuery += "search_field=" + $('#search_field').val() + "&search_keyword=" + $.trim($('#search_keyword').val());
 	if (g_AgentID_ToDisplay.length > 0)
 		strQuery += "&AgentID_ToDisplay=" + g_AgentID_ToDisplay;
 	
	$.ajax({
	    type: "GET",
	    url: "client_mng/get_recent_statt",
	    data: strQuery,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取最近客户端连接统计失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取最近客户端连接统计失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
	      
	      $('#spnRecent1Day').html(MyJsonDecode(jsonResult.szData.nCount_Recent1Day));
	      $('#spnYesterday').html(MyJsonDecode(jsonResult.szData.nCount_Yesterday));
	      $('#spnDayBeforeYesterday').html(MyJsonDecode(jsonResult.szData.nCount_DayBeforeYesterday));
	      $('#spnRecent3Day').html(MyJsonDecode(jsonResult.szData.nCount_Recent3Day));
	      $('#spnRecent7Day').html(MyJsonDecode(jsonResult.szData.nCount_Recent7Day));
	      $('#spnRecent30Day').html(MyJsonDecode(jsonResult.szData.nCount_Recent30Day));
	      $('#spnInternetBarCount').html(MyJsonDecode(jsonResult.szData.nCount_InternetBar));
	    }
	});
}
// 移到common__.html.js中
//var g_bShowIpLocation_Working = false;
//function ShowIpLocation(nId, strIp)
//{
//	if (g_bShowIpLocation_Working)
//		return;
//	g_bShowIpLocation_Working = true;
//	$.ajax({
//	    type: "GET",
//	    url: "client_mng/get_ip_location/ip/" + strIp,
//	    data: '',
//	    success: function (result) {
//				g_bShowIpLocation_Working = false;
//				
//	    	var strHtml = "";
//	    	result = RemoveDebugInfoInJsonResult(result);
//	    	if (result.length == 0)
//	      {
//	      	$.messager.alert('错误','获取IP所在地失败！详细：数据错误');
//	        return;
//	   		}
//	    	var jsonResult = jQuery.parseJSON(result);
//	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
//	      {
//					$.messager.show({
//							title:'错误',
//							msg:'获取IP所在地失败！详细：' + MyJsonDecode(jsonResult.szMsg),
//							timeout:3000,
//							showType:'slide'
//					});
//	        return;
//	   		}
//	   		var strLocation = $.trim(MyJsonDecode(jsonResult.szData));
//	   		
//	   		if (strLocation.length == 0)
//	   			strLocation = "无法找到IP所在地";
//	      
//	      $('#ahIpLocation_' + String(nId)).tooltip({
//	      	content: '<span class="green_font">'+strLocation+'</span>',
//	      }); 	
//	    }
//	});
//}
function Show_EditIp_InternetBarNameDialog(strClientId, strIp, strInternetBarName)
{
	$("tr[id^='trClient_']").find("td:eq(4) a span").show();
	$("tr[id^='trClient_']").find("td:eq(4) input").hide();
	
	$('#trClient_'+strClientId+' td:eq(4) a span').hide();
	$('#trClient_'+strClientId+' td:eq(4) input').show();
	
	//<<<
//	$('#EditIp_InternetBarName__PublicIP').val(strIp);
//	$('#InternetBarName').val(strInternetBarName);
//		
//	$('#divEditIp_InternetBarNameDialog').dialog('center');
//	$('#divEditIp_InternetBarNameDialog').dialog('open');
	//>>>
}
function Submit_EditIp_InternetBarName(sender, strPublicIP)
{
	if (! checkinput_EditIp_InternetBarName(sender))
		return;
	$.ajax({
	    type: "POST",
	    url: "client_mng/set_ip_internet_bar_name",
	    data: "PublicIP=" + strPublicIP + "&InternetBarName="+$.trim($(sender).val()),
	    //data: $("#frmEditIp_InternetBarName").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','设置网吧名称失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '设置网吧名称失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', "设置网吧名称成功！");
				$('#divEditIp_InternetBarNameDialog').dialog('close');
	      
	      GetAllClient(g_nCurrentPageIndex_Client + 1);
	    }
	});
}
function checkinput_EditIp_InternetBarName(sender)
{
	var InternetBarName = $.trim($(sender).val());
//	if (InternetBarName.length < 2 || InternetBarName.length > 40)
//	{
//    $.messager.alert('错误','网吧名称长度必须为2到40个字符，请重新输入！');
//		return false;
//	}
	if (InternetBarName.length > 40)
	{
    $.messager.alert('错误','网吧名称长度须小于40个字符，请重新输入！');
		return false;
	}
	return true;
}
function Search()
{
	GetAllClient(1);
	GetRecentStatt();
}
function ClickAgentName(strAgentName)
{
	$("#search_field option[value='AgentName']").prop('selected', true);
	$('#search_keyword').val(strAgentName);
	Search();
}
$('#dd').datebox({
    onSelect: function(date){
        alert(date.getFullYear()+":"+(date.getMonth()+1)+":"+date.getDate());
    }
});

function ShowClientLog()
{
	if (g_strClientId_SelectedList == null || g_strClientId_SelectedList == undefined || g_strClientId_SelectedList == 0)
	{
		$.messager.alert('错误','请先选中客户端！只允许单选');
		return;
	}
 	if (g_strClientId_SelectedList.split("_").length > 2)
  {
    	$.messager.alert('错误','查看客户端日志只允许单选！');
      return;
 	}
	var strAgentName = "";
	var strMac = "";
	var i = 0;
 	for (i = 0; i < g_AllClient.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllClient[i].Id);
 		if (IsInCommonList(g_strClientId_SelectedList, "_", strId))
 		{
 			strMac = MyJsonDecode(g_AllClient[i].LocalMac);
 			strAgentName = MyJsonDecode(g_AllClient[i].AgentName);
 			break;
 		}
 	}
	
	$.ajax({
	    type: "GET",
	    url: "client_upload/get_last_client_log_url/agent_name/" + strAgentName + "/mac/" + strMac,
	    data: '',
	    success: function (result) {
				g_bShowIpLocation_Working = false;
				
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','查看客户端日志失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '查看客户端日志失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
	   		var strClientLogUrl = $.trim(MyJsonDecode(jsonResult.szData));
	   		
	   		if (strClientLogUrl.length == 0)
	      {
	      	strMsg = '查看客户端日志失败！详细：获取日志路径失败';
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
				$('#divShowClientLogDialog').dialog('center');
				$('#divShowClientLogDialog').dialog('open');
				$('#ifmClientLog').prop('src', "../" + strClientLogUrl);
	    }
	});
}
function EditDebugRule()
{
	var i = 0;
	if (g_strClientId_SelectedList == null || g_strClientId_SelectedList == undefined || g_strClientId_SelectedList == 0)
	{
		$.messager.alert('错误','请先选中客户端！');
		return;
	}
	
	var strAgentID_Selected = "";
	var strAgentName_Selected = "";
	var strMacList_Selected = "";
 	for (i = 0; i < g_AllClient.length; i ++)
 	{
 		var strClientId = MyJsonDecode(g_AllClient[i].Id);
 		
 		if (! IsInCommonList(g_strClientId_SelectedList, "_", strClientId))
 			continue;
 		if (strAgentID_Selected == "")
 		{
 			strAgentID_Selected = MyJsonDecode(g_AllClient[i].AgentID);
 			strAgentName_Selected = MyJsonDecode(g_AllClient[i].AgentName);
 		}
 		else if (strAgentID_Selected != MyJsonDecode(g_AllClient[i].AgentID))
 		{
			$.messager.alert('错误','每次只能对同一代理商下的客户端设置调试规则，请修改输入！');
			return;
 		}
 		strMacList_Selected += ";" + MyJsonDecode(g_AllClient[i].LocalMac);
	}
 	strMacList_Selected += ";";
	$("#EditDebugRule__AgentID").val(strAgentID_Selected);
	$("#spnEditDebugRule__AgentID").html(strAgentName_Selected);
	$("#EditDebugRule_client_mac_list").val(strMacList_Selected);
	
	$('#divEditDebugRuleDialog').dialog('center');
	$('#divEditDebugRuleDialog').dialog('open');
}
function SelectAll_Client()
{
	if ($('#ckbSelectAll').prop('checked'))
	{
	 	for (i = 0; i < g_AllClient.length; i ++)
	 	{
	 		var strClientId = MyJsonDecode(g_AllClient[i].Id);
			g_strClientId_SelectedList += strClientId + "_";
	 	}
		$("#tbdClientList tr").addClass('danger');
	}
	else
	{
		g_strClientId_SelectedList = "";
		$("#tbdClientList tr").removeClass('danger');
	}
}

function Show_GenerateStaticRuleDialog()
{
	$('#divGenerateStaticRuleDialog').dialog('open');
}
function Submit_GenerateStaticRule()
{
	var strOp = "generate_static_rule";
	var strOpName = "生成静态规则";
	
	if (! checkinput_GenerateStaticRule())
		return;
	$.ajax({
	    type: "POST",
	    url: "debug_rule_mng/" + strOp,
	    data: $("#frmGenerateStaticRule").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','生成静态规则失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '生成静态规则失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
	   		
				$('#GenerateStaticRule__static_rule').val(MyJsonDecode(jsonResult.szData));
				
	      $.messager.alert('提示', strOpName+"成功！");
	    }
	});
}
function checkinput_GenerateStaticRule()
{
	var client_mac = $.trim($('#GenerateStaticRule__client_mac').val());
	if (client_mac.length == 0)
	{
	  $.messager.alert('错误', '客户端MAC不能为空！请重新输入');
		return false;
	}
	var rule = $.trim($('#GenerateStaticRule__rule').val());
	if (rule.length == 0)
	{
	  $.messager.alert('错误', '规则JSON不能为空！请重新输入');
		return false;
	}
	return true;
}
function RestoreInternetBarName()
{
	var strOp = "restore_internet_bar_name";
	var strOpName = "恢复网吧名";
	
	$.messager.confirm('确认操作','您确定要恢复所有网吧名称吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "POST",
			    url: "client_mng/" + strOp,
			    timeout : 120*1000,
			    data: "",
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误',strOpName+'失败！详细：数据错误');
			        return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = strOpName+'失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        return;
			   		}
			      $.messager.alert('提示', strOpName+"成功！");
			      GetAllClient(g_nCurrentPageIndex_Client + 1);
			    }
			});
		}
	});
}

function ShowRecentAgentClientCountChart(bClose)
{
	var strMsg = "";
	var i = 0;

	$.ajax({
	    type: "GET",
	    url: "agent_mng/get_recent_agent_client_count",
	    data: "",
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取近一月客户端上线信息失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取近一月客户端上线信息失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取近一月客户端上线信息失败！详细：数据错误');
	          	return;
	     	}
	     	var t_RecentAgentClientCountArray = jsonResult.szData;
	     		
				var option = {
				    title: {
				        text: '近一月客户端上线数曲线'
				    },
				    tooltip: {
				        trigger: 'axis'
				    },
				    legend: {
				        data:['客户端上线数']
				    },
				    grid: {
				        left: '0%',
				        right: '2%',
				        bottom: '1%',
				        containLabel: true
				    },
				    toolbox: {
				        feature: {
				            saveAsImage: {}
				        }
				    },
				    xAxis: {
				        type: 'category',
				        boundaryGap: false,
				        data: ['1.1','1.2']
				    },
				    yAxis: {
				        type: 'value'
				    },
				    series: [
				        {
				            name:'客户端上线数',
				            type:'line',
				            stack: '总量',
				            data:[120, 132]
				        }]
				};
				
				option.series[0].data = new Array;
				option.xAxis.data = new Array;
				for (i = 0; i < t_RecentAgentClientCountArray.length; i ++)
				{
					option.series[0].data.push(MyJsonDecode(t_RecentAgentClientCountArray[i].client_count));
			 		var strNfDate = MyJsonDecode(t_RecentAgentClientCountArray[i].date_date);
			 		strNfDate = strNfDate.replace(/-/g, ".");
			 		strNfDate = strNfDate.replace(/\.0/g, ".");
					option.xAxis.data.push(strNfDate.substr(5));
				}
	     	
	     	$('#divRecentAgentClientCountChartDialog').dialog('center');
	     	$('#divRecentAgentClientCountChartDialog').dialog('open');
				if (bClose)
					setTimeout("$('#divRecentAgentClientCountChartDialog').dialog('close');", 5*1000);
				
				var myChart = echarts.init(document.getElementById("divRecentAgentClientCountChart"));
			  myChart.setOption(option, true);
	    }
	});
}

function SetClientRemoteControl()
{
	if (g_strClientId_SelectedList == null || g_strClientId_SelectedList == undefined || g_strClientId_SelectedList == 0)
	{
		$.messager.alert('错误','请先选中客户端！只允许单选');
		return;
	}
 	if (g_strClientId_SelectedList.split("_").length > 2)
	{
    	$.messager.alert('错误','下发远程连接只允许单选！');
      return;
 	}
	var strAgentId = "";
	var strMac = "";
	var i = 0;
 	for (i = 0; i < g_AllClient.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllClient[i].Id);
 		if (IsInCommonList(g_strClientId_SelectedList, "_", strId))
 		{
 			strMac = MyJsonDecode(g_AllClient[i].LocalMac);
 			strAgentId = MyJsonDecode(g_AllClient[i].AgentID);
 			break;
 		}
 	}
	
	var strOp = "insert_client_remote_control";
	var strOpName = "设置下发远程连接";
	
	$.messager.confirm('确认操作','您确定要对所选客户端下发远程连接吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "POST",
			    url: "client_remote_control/" + strOp,
			    timeout : 120*1000,
			    data: "AgentID="+strAgentId + "&mac=" + strMac,
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误',strOpName+'失败！详细：数据错误');
			        return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
					{
			      	strMsg = strOpName+'失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        return;
			   		}
			      $.messager.alert('提示', strOpName+"成功！您可在下发远程连接页面中查看相关信息");
			    }
			});
		}
	});
}

function InputSearchKeyword()
{
	var strSearchKeyword = $('#search_keyword').val();
	strSearchKeyword = strSearchKeyword.replace(/-/gi, '');
	if (strSearchKeyword.length != "112233aabbcc".length)
		return;
	if (/[A-Fa-f0-9]{12}/g.test(strSearchKeyword))
		$('#search_field').val('LocalMac');
}