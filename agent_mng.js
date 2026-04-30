
var g_AllAgent = null;
var g_AllAgentNameInfo = null;
var g_AgentID = null;
var g_AllKuaiFenModuleInfo = null;
var g_nAgent__Id = 0;
var g_strAgentId_Selected = "";
var g_bUpdateOrInsert = true;

var g_nRecordCount_Agent = 0;
var g_nPageCount_Agent = 1;
var g_nRecordCountEachPage_Agent = 400;
var g_nCurrentPageIndex_Agent = 0;
var g_strOrderBy = "0";
var g_nEscDesc = 0;

jQuery(document).ready(function() {
	func_Get();
	EasyUI_DialogInit("divEditAgentDialog");
	EasyUI_DialogInit("divChangePasswordDialog");
	EasyUI_DialogInit("divChangeSubPasswordDialog");
	EasyUI_DialogInit("divDownloadDialog");
	EasyUI_DialogInit("divRegisterProtocolDialog");
	EasyUI_DialogInit("divRecentAgentClientCountChartDialog");
	EasyUI_DialogInit("divGetAgentClientDecreaseDialog");
	$('#divAgentList').css('height', $(window).height() - 100);
});
var func_Get = function Get()
{
//	if ((g_AgentID == 0 || g_AgentID == null) && g_strModuleParam == "")
//		return;
	GetAllAgent(g_nCurrentPageIndex_Agent + 1);
}
function GetAllAgent(nPageIndex_1Add)
{
	var strMsg = "";
	var nItemCount = 0;
	var i = 0;
	var strQuery = "";
	g_strAgentId_Selected = "";
	
 	if (! Valid_Int(nPageIndex_1Add) || nPageIndex_1Add <= 0 || nPageIndex_1Add > g_nPageCount_Agent)
  {
  	$.messager.alert('错误','页序号必须为1到'+g_nPageCount_Agent+'之间的数字，请重新输入！');
    return;
 	}
 	var nPageIndex = nPageIndex_1Add - 1;
	
 	if (g_strOrderBy.length == 0)
 		g_strOrderBy = "0";
 	strQuery += "page="+String(nPageIndex)+'&pagecount='+String(g_nRecordCountEachPage_Agent)+"&order="+g_strOrderBy+"&orderesc="+String(g_nEscDesc);
 	strQuery += "&search_field=" + $('#search_field').val() + "&search_keyword=" + $.trim($('#search_keyword').val());
 	strQuery += "&ModuleParam=" + g_strModuleParam;
 	if (g_AgentID_ToDisplay.length > 0)
 		strQuery += "&AgentID_ToDisplay=" + g_AgentID_ToDisplay;
 		
 	if ($('#is_display_client_count').prop('checked'))
 		strQuery += "&is_display_client_count=1";
 	else
 		strQuery += "&is_display_client_count=0";

	$.ajax({
	    type: "GET",
	    url: "agent_mng/get_all_agent",
	    data: strQuery,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取代理商信息失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取代理商信息失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取代理商信息失败！详细：数据错误');
	          	return;
	     	}
	     	g_AllAgent = jsonResult.szData.tAllAgent;
	     	g_AllAgentNameInfo = jsonResult.szData.tAllAgentNameInfo;
	     	g_AgentID = MyJsonDecode(jsonResult.szData.AgentID);
	     	g_AllKuaiFenModuleInfo = jsonResult.szData.tAllModuleInfo_KuaiFen;
	     	
	     	g_nRecordCount_Agent = MyJsonDecode(jsonResult.szData.nTotalCount);
	     	var strHtml = "";
	     	
	     	strHtml = "";
	     	strHtml += '<option value="0">无</option>';
	     	for (i = 0; i < g_AllAgentNameInfo.length; i ++)
	     		strHtml += '<option value="'+MyJsonDecode(g_AllAgentNameInfo[i].AgentID)+'">'+MyJsonDecode(g_AllAgentNameInfo[i].AgentName)+'</option>'
	     	$('#EditAgent__ParentAgentID').html(strHtml);
	     	$('#EditAgent__PopAgentID').html(strHtml);
	     	
	     	g_nPageCount_Agent = Math.ceil(g_nRecordCount_Agent / g_nRecordCountEachPage_Agent);
	     	if (g_nPageCount_Agent == 0)
	     		g_nPageCount_Agent = 1;
	    	
	    	if (g_strModuleParam != "pop")
	    		ShowAgent(1);
	    	else
	    		ShowAgent_Pop(1);
	    		
			  g_nCurrentPageIndex_Agent = nPageIndex;
			  SetCommonPager('GetAllAgent', g_nRecordCount_Agent, g_nRecordCountEachPage_Agent, g_nCurrentPageIndex_Agent);
	    }
	});
}
function ShowAgent(nPageIndex_1Add)
{
//			 	var nPageIndex = 0;
			 	var strHtml = "";
			 	var i = 0;
			 	
//			 	if (! Valid_Int(nPageIndex_1Add) || nPageIndex_1Add <= 0 || nPageIndex_1Add > g_nPageCount_Agent)
//			  {
//			  	$.messager.alert('错误','页序号必须为1到'+g_nPageCount_Agent+'之间的数字，请重新输入！');
//			    return;
//			 	}
//			 	nPageIndex = nPageIndex_1Add - 1;
 	
				var nLoopCount = 1;
 				if (g_AgentID > 0 && g_AllAgent.length > 1)
 					nLoopCount = 2;
 				for (var nLoop = 0; nLoop < nLoopCount; nLoop ++)
 				{
			 		var nClientCount_Total = 0;
			 		var nInternetBarCount_Total = 0;
			 		var nYestClientCount_Total = 0;
			 		var nYestBefClientCount_Total = 0;
		     	for (i = 0; i < g_AllAgent.length; i ++)
		     	{
//				 		if (i < nPageIndex * g_nRecordCountEachPage_Agent || i >= (nPageIndex + 1) * g_nRecordCountEachPage_Agent)
//				 			continue;
			 			
		     		var strAgentId = MyJsonDecode(g_AllAgent[i].Id);
		     		var AgentID = MyJsonDecode(g_AllAgent[i].AgentID);
		     		var strAgentName = MyJsonDecode(g_AllAgent[i].UserName);
		     		var strRegisterTime = MyJsonDecode(g_AllAgent[i].register_time).substr(0,10);
		     		
		     		if (nLoop == nLoopCount - 1)
		     		{
			     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].AgentClientCount)))
			     			nClientCount_Total += parseInt(MyJsonDecode(g_AllAgent[i].AgentClientCount));
			     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].InternetBarCount)))
			     			nInternetBarCount_Total += parseInt(MyJsonDecode(g_AllAgent[i].InternetBarCount));
			     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].client_count)))
			     			nYestClientCount_Total += parseInt(MyJsonDecode(g_AllAgent[i].client_count));
			     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].YestBef_client_count)))
			     			nYestBefClientCount_Total += parseInt(MyJsonDecode(g_AllAgent[i].YestBef_client_count));
		     		}
		     		
				 		if (nLoopCount == 2)
				 		{
					 		if (nLoop == 0)
					 		{
					 			if (g_AgentID != AgentID)
					 				continue;
					 		}
					 		else if (nLoop == 1)
					 			if (g_AgentID == AgentID)
					 				continue;
				 		}
		    		
		     		if (g_AgentID == AgentID)
		     			g_nAgent__Id = strAgentId;
		     			
		     		if (strRegisterTime.substr(0,1) == "0")
		     			strRegisterTime = "";
		     			
		     		var n__client_count = 0;
		     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].client_count)))
		     			n__client_count = parseInt(MyJsonDecode(g_AllAgent[i].client_count));
		     		var n__YestBef_client_count = 0;
		     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].YestBef_client_count)))
		     			n__YestBef_client_count = parseInt(MyJsonDecode(g_AllAgent[i].YestBef_client_count));
		     		var strClientCountUpDownHtml = "";
		     		if (n__client_count >= n__YestBef_client_count)
		     			strClientCountUpDownHtml = '<span class="red_font"> (+'+String(n__client_count - n__YestBef_client_count)+')</span>';
		     		else
		     			strClientCountUpDownHtml = '<span class="green_font"> (-'+String(n__YestBef_client_count - n__client_count)+')</span>';
					
					if (g_AgentID == 0)
					{
						var n__client_data_count = MyJsonDecode(g_AllAgent[i].ClientDataCount);
		     			strClientCountUpDownHtml += '<span> ('+String(n__client_data_count)+')</span>';
						
						var strColor = "#cccccc";
						if (Valid_Int(n__client_data_count) && Valid_Int(n__client_count) && n__client_data_count < n__client_count && n__client_count >= 100)
						{
							var nDiffRate = parseInt((n__client_count - n__client_data_count) * 100 / n__client_count);
							if (nDiffRate > 20)
								strColor = "#aa0000;";
							else if (nDiffRate > 10)
								strColor = "#0000aa;";
							else if (nDiffRate > 5)
								strColor = "#00aa00";
							strClientCountUpDownHtml += '<span style="color:'+strColor+';"> ('+String(nDiffRate)+'%)</span>';
						}
					}
		     			
			      strHtml += '<tr id="trAgent_'+strAgentId+'" onclick="Select_Agent('+strAgentId+')">';
		        strHtml += '<td>'+AgentID+'</td>';
		        strHtml += '<td>';
		        if (g_AgentID != AgentID)
		        if (g_IsPop == 0)
	    			strHtml += 		'<a id="ahAgentNameLinkPanel_'+strAgentId+'" href="#" onmouseenter="Show_AgentNameLinkPanel_Common('+strAgentId+','+AgentID+',\''+strAgentName+'\', 1);">';
	    			strHtml += 				strAgentName;
		        if (g_AgentID != AgentID)
		        if (g_IsPop == 0)
	    			strHtml += 		'</a>';
		        strHtml += '</td>';
		        if (g_AgentID == 0)
		        strHtml += '<td class="red_font">'+MyJsonDecode(g_AllAgent[i].AgentClientCount)+'</td>';
		        strHtml += '<td class="blue_font">'+MyJsonDecode(g_AllAgent[i].InternetBarCount)+'</td>';
		        strHtml += '<td class="blue_font"><a href="#" onclick="ShowRecentAgentClientCountChart(\''+AgentID+'\');">'+String(n__client_count)+strClientCountUpDownHtml+'</a></td>';
		        if (g_IsPop == 0)
		        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].ParentAgentName)+'</td>';
		        if (g_AgentID == 0)
		        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].PopAgentName)+'</td>';
		        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].qq)+'</td>';
		        if (g_IsPop == 0)
		        strHtml += '<td class="switch_bank">'+MyJsonDecode(g_AllAgent[i].alipay_acct)+'</td>';
		        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].alipay_acct_name)+'</td>';
		        if (g_IsPop == 0)
		        {
		        strHtml += '<td class="switch_bank">'+MyJsonDecode(g_AllAgent[i].identity_number)+'</td>';
		        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].kaihuhang_province)+'</td>';
		        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].kaihuhang_city)+'</td>';
		        strHtml += '<td class="switch_bank">'+MyJsonDecode(g_AllAgent[i].kaihuhang_addr)+'</td>';
		        strHtml += '<td class="switch_bank">'+MyJsonDecode(g_AllAgent[i].kaihuhang_bank)+'</td>';
		      	}
		        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].phone)+'</td>';
		        if (g_IsPop == 0)
		        strHtml += '<td>'+(g_AllAgent[i].sub_password.length>0?'******':'未设置')+'</td>';
		        
		        
		        if (g_AgentID == 0)
		        if (g_strModuleParam == "")
		        {
		        	strHtml += '<td>';
			        if (MyJsonDecode(g_AllAgent[i].ModuleCount_feedback) == 1)
		        		strHtml += '<a class="green_font" style="margin-right:2px;" onclick="SwitchAgentFeedbackModule('+AgentID+',0,\'feedback\');">A</a>';
			        else
		        		strHtml += '<a class="red_font" style="margin-right:2px;" onclick="SwitchAgentFeedbackModule('+AgentID+',1,\'feedback\');">A</a>';
			        if (MyJsonDecode(g_AllAgent[i].ModuleCount_feedbacksuper) == 1)
		        		strHtml += '<a class="green_font" style="margin-right:2px;" onclick="SwitchAgentFeedbackModule('+AgentID+',0,\'feedbacksuper\');">B</a>';
			        else
		        		strHtml += '<a class="red_font" style="margin-right:2px;" onclick="SwitchAgentFeedbackModule('+AgentID+',1,\'feedbacksuper\');">B</a>';
			        if (MyJsonDecode(g_AllAgent[i].ModuleCount_feedbacklog) == 1)
		        		strHtml += '<a class="green_font" style="margin-right:2px;" onclick="SwitchAgentFeedbackModule('+AgentID+',0,\'feedbacklog\');">C</a>';
			        else
		        		strHtml += '<a class="red_font" style="margin-right:2px;" onclick="SwitchAgentFeedbackModule('+AgentID+',1,\'feedbacklog\');">C</a>';
			        if (MyJsonDecode(g_AllAgent[i].ModuleCount_feedbacktest) == 1)
		        		strHtml += '<a class="green_font" style="margin-right:2px;" onclick="SwitchAgentFeedbackModule('+AgentID+',0,\'feedbacktest\');">D</a>';
			        else
		        		strHtml += '<a class="red_font" style="margin-right:2px;" onclick="SwitchAgentFeedbackModule('+AgentID+',1,\'feedbacktest\');">D</a>';
		        	strHtml += '</td>';
		        	if (g_LevelType == "0")
		        	{
		        		strHtml += '<td>';
		        		strHtml += 		Generate_KuaiFen_ModuleHtml(AgentID, g_AllKuaiFenModuleInfo, MyJsonDecode(g_AllAgent[i].KF_m_id_list));
		        		strHtml += '</td>';
		        	}
		        	strHtml += '<td>';
			        if (MyJsonDecode(g_AllAgent[i].is_banned) == 1)
		        		strHtml += '<a onclick="SwitchAgentIsBanned('+AgentID+',0);">是';
			        else
		        		strHtml += '<a onclick="SwitchAgentIsBanned('+AgentID+',1);">否';
		        	strHtml += '</a></td>';
		        }
		        		        
		        strHtml += '<td>'+strRegisterTime+'</td>';
			      strHtml += '</tr>';
		    	}
	    	}
	    	// 推广商加一行汇总
	    	if (g_IsPop == 1)
	    	{
			      strHtml += '<tr id="trPopTotal">';
		        strHtml += '<td class="btn-warning">汇总</td><td></td>';
		        //strHtml += '<td class="red_font">'+String(nClientCount_Total)+'</td>';
		        strHtml += '<td class="blue_font">'+String(nInternetBarCount_Total)+'</td>';
		     		var strClientCountUpDownHtml = "";
		     		if (nYestClientCount_Total >= nYestBefClientCount_Total)
		     			strClientCountUpDownHtml = '<span class="red_font"> (+'+String(nYestClientCount_Total - nYestBefClientCount_Total)+')</span>';
		     		else
		     			strClientCountUpDownHtml = '<span class="green_font"> (-'+String(nYestBefClientCount_Total - nYestClientCount_Total)+')</span>';
		        strHtml += '<td class="blue_font">'+String(nYestClientCount_Total)+strClientCountUpDownHtml+'</td>';
		        strHtml += '<td></td><td></td><td></td><td></td>';
			      strHtml += '</tr>';
	    	}
	    	$('#tbdAgentList').html(strHtml);
	    	
	    	if ($("#is_display_bank_info").prop('checked'))
	    		$(".switch_bank").show();
	    	else
	    		$(".switch_bank").hide();
	    	
	    	if (g_AllAgent.length == 1)
	    		Select_Agent(MyJsonDecode(g_AllAgent[0].Id));
  
//			  g_nCurrentPageIndex_Agent = nPageIndex;
//			  SetCommonPager('ShowAgent', g_nRecordCount_Agent, g_nRecordCountEachPage_Agent, g_nCurrentPageIndex_Agent);
}
function ShowAgent_Pop(nPageIndex_1Add)
{
			 	var nPageIndex = 0;
			 	var strHtml = "";
			 	var i = 0;
			 	var kk = 0;
			 	var i_Pop = 0;
			 	
			 	if (! Valid_Int(nPageIndex_1Add) || nPageIndex_1Add <= 0 || nPageIndex_1Add > g_nPageCount_Agent)
			  {
			  	$.messager.alert('错误','页序号必须为1到'+g_nPageCount_Agent+'之间的数字，请重新输入！');
			    return;
			 	}
			 	nPageIndex = nPageIndex_1Add - 1;
			 	
			 	// 先循环一遍找出所有推广商的数组序号
 				var arPopAgentIndexArray = [];
 				for (i = 0; i < g_AllAgent.length; i ++)
 				{
 					var strPopAgentID = MyJsonDecode(g_AllAgent[i].PopAgentID);
 					if (strPopAgentID == "0" || strPopAgentID == "")
 						continue;
 					for (kk = 0; kk < arPopAgentIndexArray.length; kk ++)
 						if (MyJsonDecode(g_AllAgent[arPopAgentIndexArray[kk]].AgentID) == strPopAgentID)
 							break;
 					if (kk < arPopAgentIndexArray.length)
 						continue;
	 				for (kk = 0; kk < g_AllAgent.length; kk ++)
	 				{
 						if (MyJsonDecode(g_AllAgent[kk].AgentID) == strPopAgentID)
 						{
 							arPopAgentIndexArray.push(kk);
 							break;
 						}
	 				}
 				}
 				for (i_Pop = 0; i_Pop < arPopAgentIndexArray.length; i_Pop ++)
 				{
 					var strPopAgentID__T = MyJsonDecode(g_AllAgent[arPopAgentIndexArray[i_Pop]].AgentID);
 					
			 		var nClientCount_Total = 0;
			 		var nInternetBarCount_Total = 0;
			 		var nYestClientCount_Total = 0;
			 		var nYestBefClientCount_Total = 0;
				 		
					var nLoopCount = 2;
	 				for (var nLoop = 0; nLoop < nLoopCount; nLoop ++)
	 				{
			     	for (i = 0; i < g_AllAgent.length; i ++)
			     	{
			     		var strPopAgentID = MyJsonDecode(g_AllAgent[i].PopAgentID);
			     			
			     		var strAgentId = MyJsonDecode(g_AllAgent[i].Id);
			     		var AgentID = MyJsonDecode(g_AllAgent[i].AgentID);
			     		var strAgentName = MyJsonDecode(g_AllAgent[i].UserName);
			     		var strRegisterTime = MyJsonDecode(g_AllAgent[i].register_time).substr(0,10);
			     		
					 		if (nLoopCount == 2)
					 		{
						 		if (nLoop == 0)
						 		{
						 			if (strPopAgentID__T != AgentID)
						 				continue;
						 		}
						 		else if (nLoop == 1)
						 			if (strPopAgentID__T != strPopAgentID)
						 				continue;
					 		}
			     			
			     		if (nLoop == nLoopCount - 1)
			     		{
				     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].AgentClientCount)))
				     			nClientCount_Total += parseInt(MyJsonDecode(g_AllAgent[i].AgentClientCount));
				     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].InternetBarCount)))
				     			nInternetBarCount_Total += parseInt(MyJsonDecode(g_AllAgent[i].InternetBarCount));
				     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].client_count)))
				     			nYestClientCount_Total += parseInt(MyJsonDecode(g_AllAgent[i].client_count));
				     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].YestBef_client_count)))
				     			nYestBefClientCount_Total += parseInt(MyJsonDecode(g_AllAgent[i].YestBef_client_count));
				     	}
			     			
			     		if (strRegisterTime.substr(0,1) == "0")
			     			strRegisterTime = "";
			     			
			     		var n__client_count = 0;
			     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].client_count)))
			     			n__client_count = parseInt(MyJsonDecode(g_AllAgent[i].client_count));
			     		var n__YestBef_client_count = 0;
			     		if (Valid_Int(MyJsonDecode(g_AllAgent[i].YestBef_client_count)))
			     			n__YestBef_client_count = parseInt(MyJsonDecode(g_AllAgent[i].YestBef_client_count));
			     		var strClientCountUpDownHtml = "";
			     		if (n__client_count >= n__YestBef_client_count)
			     			strClientCountUpDownHtml = '<span class="red_font"> (+'+String(n__client_count - n__YestBef_client_count)+')</span>';
			     		else
			     			strClientCountUpDownHtml = '<span class="green_font"> (-'+String(n__YestBef_client_count - n__client_count)+')</span>';
			     			
			     		var strTrStyle = "";
			     		if (nLoop == 1)
			     			strTrStyle = "display:none";
			     			
			     		var strUnfoldPopAgentHtml = "";
			     		if (nLoop == 0)
			     			strUnfoldPopAgentHtml += '<a href="#" id="aUnfoldPopAgent_'+strPopAgentID__T+'" onclick="UnfoldPopAgent('+strPopAgentID__T+');">展开</a>';
			     			
			     		var strId = 'trAgent_'+strPopAgentID__T;
			     		if (nLoop == 1)
			     			strId += '_'+strAgentId;
			     			
				      strHtml += '<tr id="'+strId+'" onclick="" style="'+strTrStyle+'">';
			        strHtml += '<td>'+strUnfoldPopAgentHtml+'</td>';
			        strHtml += '<td>';
			        if (g_AgentID != AgentID)
			        if (g_IsPop == 0)
		    			strHtml += 		'<a id="ahAgentNameLinkPanel_'+strAgentId+'" href="#" onmouseenter="Show_AgentNameLinkPanel('+strAgentId+','+AgentID+',\''+strAgentName+'\');">';
		    			strHtml += 				strAgentName;
			        if (g_AgentID != AgentID)
			        if (g_IsPop == 0)
		    			strHtml += 		'</a>';
			        strHtml += '</td>';
			        if (g_IsPop == 0)
			        strHtml += '<td class="red_font">'+MyJsonDecode(g_AllAgent[i].AgentClientCount)+'</td>';
			        strHtml += '<td class="blue_font">'+MyJsonDecode(g_AllAgent[i].InternetBarCount)+'</td>';
			        strHtml += '<td class="blue_font">'+String(n__client_count)+strClientCountUpDownHtml+'</td>';
			        if (g_IsPop == 0)
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].ParentAgentName)+'</td>';
			        if (g_AgentID == 0)
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].PopAgentName)+'</td>';
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].qq)+'</td>';
			        if (g_IsPop == 0)
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].alipay_acct)+'</td>';
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].alipay_acct_name)+'</td>';
			        if (g_IsPop == 0)
			        {
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].identity_number)+'</td>';
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].kaihuhang_province)+'</td>';
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].kaihuhang_city)+'</td>';
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].kaihuhang_addr)+'</td>';
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].kaihuhang_bank)+'</td>';
			      	}
			        strHtml += '<td>'+MyJsonDecode(g_AllAgent[i].phone)+'</td>';
			        if (g_IsPop == 0)
			        strHtml += '<td>'+(g_AllAgent[i].sub_password.length>0?'******':'未设置')+'</td>';
			        strHtml += '<td>'+strRegisterTime+'</td>';
				      strHtml += '</tr>';
			    	}
		    	}
		    	// 加一行汇总
		    	{
				      strHtml += '<tr id="trPopTotal_'+strPopAgentID__T+'" style="'+strTrStyle+'">';
			        strHtml += '<td class="btn-warning">汇总</td><td></td>';
			        strHtml += '<td class="red_font">'+String(nClientCount_Total)+'</td>';
			        strHtml += '<td class="blue_font">'+String(nInternetBarCount_Total)+'</td>';
			     		var strClientCountUpDownHtml = "";
			     		if (nYestClientCount_Total >= nYestBefClientCount_Total)
			     			strClientCountUpDownHtml = '<span class="red_font"> (+'+String(nYestClientCount_Total - nYestBefClientCount_Total)+')</span>';
			     		else
			     			strClientCountUpDownHtml = '<span class="green_font"> (-'+String(nYestBefClientCount_Total - nYestClientCount_Total)+')</span>';
			        strHtml += '<td class="blue_font">'+String(nYestClientCount_Total)+strClientCountUpDownHtml+'</td>';
			        ///////strHtml += '<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>';
			        strHtml += '<td></td><td></td><td></td>';
				      strHtml += '</tr>';
		    	}
	    	}
	    	$('#tbdAgentList').html(strHtml);
	    	
	    	if (g_AllAgent.length == 1)
	    		Select_Agent(MyJsonDecode(g_AllAgent[0].Id));
  
			  g_nCurrentPageIndex_Agent = nPageIndex;
			  SetCommonPager('ShowAgent', g_nRecordCount_Agent, g_nRecordCountEachPage_Agent, g_nCurrentPageIndex_Agent);
}
function Select_Agent(strAgentId)
{
	var i = 0;
	g_strAgentId_Selected = strAgentId;
 	for (i = 0; i < g_AllAgent.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllAgent[i].Id);
 		if (strId == g_strAgentId_Selected)
			$('#trAgent_'+strId).addClass('danger');
		else
			$('#trAgent_'+strId).removeClass('danger');
 	}
}
function DeleteAgent()
{
	if (g_strAgentId_Selected == null || g_strAgentId_Selected == undefined || g_strAgentId_Selected == 0)
	{
		$.messager.alert('错误','请先选中所要删除的代理商！');
		return;
	}
	$.messager.confirm('确认操作','您确定要删除此代理商吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "agent_mng/delete_agent/agent_id/" + g_strAgentId_Selected,
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除代理商失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除代理商失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除代理商成功！");
			      
			      GetAllAgent(g_nCurrentPageIndex_Agent + 1);
			    }
			});
		}
	});
}
function UpdateAgent()
{
	g_bUpdateOrInsert = true;
	ShowEditAgentDialog();
}
function InsertAgent()
{
	g_bUpdateOrInsert = false;
	ShowEditAgentDialog();
}
function ShowEditAgentDialog()
{
	var strOp = "insert_agent";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_agent";
		strOpName = "修改";
	}
	if (! g_bUpdateOrInsert)
		$('#agent_id').val('');  // 新增要清空Id
	else
	{
		if (g_strAgentId_Selected == null || g_strAgentId_Selected == undefined || g_strAgentId_Selected == 0)
		{
			$.messager.alert('错误','请先选中所要修改的代理商！');
			return;
		}
		if (g_AgentID > 0 && g_nAgent__Id != g_strAgentId_Selected)  // 管理员可以所有代理商的信息
		{
			$.messager.alert('错误','代理商只能修改自身信息，不能修改其他代理商信息！');
			return;
		}
		
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllAgent.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllAgent[i].Id);
	 		if (strId == g_strAgentId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllAgent.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#agent_id').val(g_strAgentId_Selected);
		$('#EditAgent__ParentAgentID').val(MyJsonDecode(g_AllAgent[i].ParentAgentID));
		$('#EditAgent__PopAgentID').val(MyJsonDecode(g_AllAgent[i].PopAgentID));
		//$('#AgentName').val(MyJsonDecode(g_AllAgent[i].AgentName));
		$('#UserName').val(MyJsonDecode(g_AllAgent[i].UserName));
		$('#UserPwd').val(MyJsonDecode(g_AllAgent[i].UserPwd));
		$('#UserPwd_Confirm').val(MyJsonDecode(g_AllAgent[i].UserPwd));
		$('#qq').val(MyJsonDecode(g_AllAgent[i].qq));
		if (g_AgentID > 0 && MyJsonDecode(g_AllAgent[i].qq).length > 0)	$('#qq').prop("disabled",true);
		$('#alipay_acct').val(MyJsonDecode(g_AllAgent[i].alipay_acct));
		if (g_AgentID > 0 && MyJsonDecode(g_AllAgent[i].alipay_acct).length > 0)	$('#alipay_acct').prop("disabled",true);
		$('#alipay_acct_name').val(MyJsonDecode(g_AllAgent[i].alipay_acct_name));
		if (g_AgentID > 0 && MyJsonDecode(g_AllAgent[i].alipay_acct_name).length > 0)	$('#alipay_acct_name').prop("disabled",true);
		$('#identity_number').val(MyJsonDecode(g_AllAgent[i].identity_number));
		if (g_AgentID > 0 && MyJsonDecode(g_AllAgent[i].identity_number).length > 0)	$('#identity_number').prop("disabled",true);
		$('#kaihuhang_province').val(MyJsonDecode(g_AllAgent[i].kaihuhang_province));
		if (g_AgentID > 0 && MyJsonDecode(g_AllAgent[i].kaihuhang_province).length > 0)	$('#kaihuhang_province').prop("disabled",true);
		$('#kaihuhang_city').val(MyJsonDecode(g_AllAgent[i].kaihuhang_city));
		if (g_AgentID > 0 && MyJsonDecode(g_AllAgent[i].kaihuhang_city).length > 0)	$('#kaihuhang_city').prop("disabled",true);
		$('#kaihuhang_addr').val(MyJsonDecode(g_AllAgent[i].kaihuhang_addr));
		if (g_AgentID > 0 && MyJsonDecode(g_AllAgent[i].kaihuhang_addr).length > 0)	$('#kaihuhang_addr').prop("disabled",true);
		$('#kaihuhang_bank').val(MyJsonDecode(g_AllAgent[i].kaihuhang_bank));
		if (g_AgentID > 0 && MyJsonDecode(g_AllAgent[i].kaihuhang_bank).length > 0)	$('#kaihuhang_bank').prop("disabled",true);
		$('#phone').val(MyJsonDecode(g_AllAgent[i].phone));
		if (g_AgentID > 0 && MyJsonDecode(g_AllAgent[i].phone).length > 0)	$('#phone').prop("disabled",true);
		$('#BindAccessIP').prop('checked', MyJsonDecode(g_AllAgent[i].BindAccessIP)==1);
		$('#EnableAd').prop('checked', MyJsonDecode(g_AllAgent[i].EnableAd)==1);
		//$('#EnableRule').prop('checked', MyJsonDecode(g_AllAgent[i].EnableRule)==1);
		//$('#EnableInherit').prop('checked', MyJsonDecode(g_AllAgent[i].EnableInherit)==1);
		$('#SelfLockURL').prop('checked', MyJsonDecode(g_AllAgent[i].SelfLockURL)==1);
		$('#SelfURL').val(MyJsonDecode(g_AllAgent[i].SelfURL));
		$('#DefLockURL').prop('checked', MyJsonDecode(g_AllAgent[i].DefLockURL)==1);
		$('#DefURL').val(MyJsonDecode(g_AllAgent[i].DefURL));
		$('#URLProc').val(MyJsonDecode(g_AllAgent[i].URLProc));
		$('#NotUrlProc').val(MyJsonDecode(g_AllAgent[i].NotUrlProc));
		$('#BlackUrl').val(MyJsonDecode(g_AllAgent[i].BlackUrl));
		$('#AdverDir').val(MyJsonDecode(g_AllAgent[i].AdverDir));
		$('#AdverList').val(MyJsonDecode(g_AllAgent[i].AdverList));
		$('#bRandProcName').prop('checked', MyJsonDecode(g_AllAgent[i].bRandProcName)==1);
	}

	$("#divEditAgentDialog").dialog({title: strOpName + '信息'});
	$('#divEditAgentDialog').dialog('center');
	$('#divEditAgentDialog').dialog('open');
}
function Submit_EditAgent()
{
	var strOp = "insert_agent";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_agent";
		strOpName = "修改";
	}
	if (! checkinput_EditAgent())
		return;
	$.ajax({
	    type: "POST",
	    url: "agent_mng/" + strOp,
	    data: $("#frmEditAgent").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'代理商失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'代理商失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"代理商成功！");
				$('#divEditAgentDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      GetAllAgent(g_nCurrentPageIndex_Agent + 1);
	    }
	});
}
function checkinput_EditAgent()
{
//	var agent_name = $("#agent_name").val();
//	if (agent_name.length < 2 || agent_name.length > 40)
//	{
//    $.messager.alert('错误','代理商名称长度必须为2到40个字符，请重新输入！');
//		return false;
//	}
//	var failed_refund_rate = $("#failed_refund_rate").val();
//	if (failed_refund_rate.length > 0 && ! Valid_Int(failed_refund_rate))
//	{
//    $.messager.alert('错误','未达标退款百分比必须为数字，请重新输入！');
//		return false;
//	}
		var URLProc = $.trim($("#URLProc").val());
		if (URLProc.length > 0 && URLProc.length < 4)
		{
	    $.messager.alert('错误','浏览器进程输入格式不正确，请重新输入！');
			return false;
		}
		
		var SelfLockURL = $('#SelfLockURL').prop('checked');
		if (SelfLockURL)
		{
			var SelfURL = $.trim($('#SelfURL').val());
			if (SelfURL.length < "http://g.cn".length)
			{
		    $.messager.alert('错误','主页输入格式不正确，请重新输入！');
				return false;
			}
//			var alipay_acct = $.trim($('#alipay_acct').val());
//			if (alipay_acct.length == 0)
//			{
//		    $.messager.alert('错误','支付宝账号不能为空，请重新输入！');
//				return false;
//			}
//			var alipay_acct_name = $.trim($('#alipay_acct_name').val());
//			if (alipay_acct_name.length == 0)
//			{
//		    $.messager.alert('错误','支付宝账号姓名不能为空，请重新输入！');
//				return false;
//			}
		}
	return true;
}
// 20191112废弃此函数，全部改为调用通用函数
//function Show_AgentNameLinkPanel(nId, AgentID, AgentName)
//{
//	var strHtml = "";
//	var strUrlTail = "";
//	
//	strUrlTail = '?AgentID_ToDisplay=' + String(AgentID);
//	var strJs_RuleMng = 'parent.LoadModuleFunction_Real(\'rule_mng\',\'规则管理 - '+AgentName+'\',\'liMyRule\',\''+strUrlTail+'\');';
//	var strJs_ClientMng = 'parent.LoadModuleFunction_Real(\'client_mng\',\'客户端管理 - '+AgentName+'\',\'liClientMng\',\''+strUrlTail+'\');';
//	var strJs_GroupRuleMng = 'parent.LoadModuleFunction_Real(\'client_group_ip_mng\',\'分组规则管理 - '+AgentName+'\',\'liClientGroupIpMng\',\''+strUrlTail+'\');';
//	var strJs_InternetBarMng = 'parent.LoadModuleFunction_Real(\'internet_bar_mng\',\'网吧管理 - '+AgentName+'\',\'liInternetBarMng\',\''+strUrlTail+'\');';
//	var strJs_ClientParamMng = 'parent.LoadModuleFunction_Real(\'client_param_mng\',\'显示参数 - '+AgentName+'\',\'liClientParamMng\',\''+strUrlTail+'\');';
//	var strJs_AgentPolicyLmpMng = 'parent.LoadModuleFunction_Real(\'agent_policy_mng__lmp\',\'主页设置 - '+AgentName+'\',\'liAgentPolicyMng_Lmp\',\''+strUrlTail+'\');';
//	var strJs_AgentNfStattDetail = 'parent.LoadModuleFunction_Real(\'nf_statt\',\'收益明细 - '+AgentName+'\',\'liNfStatt\',\''+strUrlTail+'\');';
//	var strJs_ModuleMng = 'parent.LoadModuleFunction_Real(\'module_mng\',\'模块管理 - '+AgentName+'\',\'liModuleMng\',\''+strUrlTail+'\');';
//	var strJs_AgentModuleMng = 'parent.LoadModuleFunction_Real(\'agent_module_mng\',\'全局模块配置 - '+AgentName+'\',\'liAgentModuleMng\',\''+strUrlTail+'\');';
//	var strJs_ClientGroupModuleMng = 'parent.LoadModuleFunction_Real(\'client_group_policy_mng\',\'模块分配 - '+AgentName+'\',\'liClientGroupModuleMng\',\''+strUrlTail+'\');';
//	var strJs_NfMoneyPercentMng = 'parent.LoadModuleFunction_Real(\'nf_money_percent_mng\',\'资产管理 - '+AgentName+'\',\'liNfMoneyPercentMng\',\''+strUrlTail+'\');';
//	var strJs_AgentNfStattDetailChart = 'parent.LoadModuleFunction_Real(\'nf_statt_chart\',\'收益曲线 - '+AgentName+'\',\'liXXXXXXXX\',\''+strUrlTail+'\');';
//	
//	strHtml += '<ul style="list-style:none;margin:0;padding:0 10px;">';
//	if (g_AgentID == 0)
//	{
//	strHtml += '<li style="margin:10px 10px;">';
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_RuleMng+'">查看规则</a>';
//	strHtml += "</li>";
//	strHtml += '<li style="margin:10px 10px;">';
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_ClientMng+'">查看客户端</a>';
//	strHtml += "</li>";
//	strHtml += '<li style="margin:10px 10px;">';
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_GroupRuleMng+'">查看规则分配</a>';
//	strHtml += "</li>";
//	strHtml += '<li style="margin:10px 10px;">';
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_InternetBarMng+'">查看网吧</a>';
//	strHtml += "</li>";
//	strHtml += '<li style="margin:10px 10px;">';
//	if (g_LevelType == 0)
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_ClientParamMng+'">查看显示参数</a>';
//	strHtml += "</li>";
//	}
//	strHtml += '<li style="margin:10px 10px;">';
//	if (g_LevelType == 0)
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_AgentPolicyLmpMng+'">查看主页设置</a>';
//	strHtml += "</li>";
//	strHtml += '<li style="margin:10px 10px;">';
//	if (g_LevelType == 0)
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_AgentNfStattDetail+'">查看收益明细</a>';
//	strHtml += "</li>";
//	strHtml += '<li style="margin:10px 10px;">';
//	if (g_LevelType == 0)
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_AgentNfStattDetailChart+'">查看收益曲线</a>';
//	strHtml += "</li>";
//	strHtml += '<li style="margin:10px 10px;">';
//	if (g_AgentID == 0)
//	if (g_LevelType == 0)
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_NfMoneyPercentMng+'">查看资产管理</a>';
//	strHtml += "</li>";
//	strHtml += '<li style="margin:10px 10px;">';
//	if (g_LevelType == 0)
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_ModuleMng+'">查看模块管理</a>';
//	strHtml += "</li>";
////	strHtml += '<li style="margin:10px 10px;">';
////	if (g_LevelType == 0)
////	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_AgentModuleMng+'">查看全局模块</a>';
////	strHtml += "</li>";
//	strHtml += '<li style="margin:10px 10px;">';
//	if (g_AgentID == 0)
//	//if (g_LevelType == 0)  //<<< 20190222 >>>
//	strHtml += 		'<a class="green_font" href="#" onclick="'+strJs_ClientGroupModuleMng+'">查看模块分配</a>';
//	strHtml += "</li>";
//	strHtml += "</ul>";
//  $('#ahAgentNameLinkPanel_' + String(nId)).tooltip({
//  		content: strHtml,
//      onShow: function(){
//          var t = $(this);
//          t.tooltip('tip').unbind().bind('mouseenter', function(){
//              t.tooltip('show');
//          }).bind('mouseleave', function(){
//              t.tooltip('hide');
//          });
//      }
//  });
//  $('#ahAgentNameLinkPanel_' + String(nId)).tooltip('show');
//}
function ShowChangePasswordDialog()
{
	var strOp = "change_password";
	
	// 管理员可以修改所有代理商的密码，代理商只能修改自己的密码
	if (g_AgentID == 0)
	{
		if (g_strAgentId_Selected == null || g_strAgentId_Selected == undefined || g_strAgentId_Selected == 0)
		{
			$.messager.alert('错误','请先选中所要修改的代理商！');
			return;
		}
		$('#ChangePassword_agent_ID').val(g_strAgentId_Selected);
	}
		
	$('#UserPwd').val('');
	$('#UserPwd_Confirm').val('');
		
	$('#divChangePasswordDialog').dialog('center');
	$('#divChangePasswordDialog').dialog('open');
}
function Submit_ChangePassword()
{
	//if (! checkinput_ChangePassword())
	//	return;
	$.ajax({
	    type: "POST",
	    url: "agent_mng/change_password",
	    data: $("#frmChangePassword").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','修改密码失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '修改密码失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示',"修改密码成功！");
				$('#divChangePasswordDialog').dialog('close');
	    }
	});
}
function ShowChangeSubPasswordDialog()
{
	var strOp = "change_sub_password";
	
	// 管理员可以修改所有代理商的密码，代理商只能修改自己的密码
	if (g_AgentID == 0)
	{
		if (g_strAgentId_Selected == null || g_strAgentId_Selected == undefined || g_strAgentId_Selected == 0)
		{
			$.messager.alert('错误','请先选中所要修改的代理商！');
			return;
		}
		$('#ChangeSubPassword_agent_ID').val(g_strAgentId_Selected);
	}
		
	$('#sub_password').val('');
	$('#sub_password_Confirm').val('');
		
	$('#divChangeSubPasswordDialog').dialog('center');
	$('#divChangeSubPasswordDialog').dialog('open');
}
function Submit_ChangeSubPassword()
{
	//if (! checkinput_ChangeSubPassword())
	//	return;
	$.ajax({
	    type: "POST",
	    url: "agent_mng/change_sub_password",
	    data: $("#frmChangeSubPassword").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','修改二级密码失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '修改二级密码失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示',"修改二级密码成功！");
				$('#divChangeSubPasswordDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      GetAllAgent(g_nCurrentPageIndex_Agent + 1);
	    }
	});
}

function DownloadClient_Confirm()
{
	$.messager.defaults = { ok: "通用版本", cancel: "文网版本" };
	
	$.messager.confirm('确认操作', '<p style="margin-top:0;padding-top:0;">普通用户请选择“通用版本”，文网路由器的用户请选择“文网版本”</p><p class="red_font" style="padding-top:0;margin-top:0;padding-left:40px;">“恒信一卡通”用户请联系客服获取定制版本</p>',function(bYes){ 
		$.messager.defaults = { ok: "OK", cancel: "Cancel" };  
		if (bYes)
		{
			DownloadClient(0);
		}
		else
			DownloadClient(2);
	});
}

var g_nCheckGenerate_Type = 0;
var g_nCheckGenerateClientProgress_Count = 0;
function DownloadClient(nType)
{
	g_nCheckGenerate_Type = nType;
	
	if (g_AgentID == 137)
	{
  	$.messager.alert('提示', '<p class="blue_font">测试账号仅供浏览网站，不提供客户端下载功能！</p><p class="blue_font">如需下载客户端，请注册账号后下载专属客户端！</p>');
    return;
	}
//	//{{{ for test
//				$('#divDownloadDialog').dialog('center');
//				$('#divDownloadDialog').dialog('open');
//				$('#ahDownloadClientLink').text('请点击此链接下载客户端！');
//				$('#ahDownloadClientLink').prop('href', "../data/adhunter_debug.zip");
//				$('#spanDownloadClientLink').css({'margin-top':'90px'});
//
//	$.ajax({
//	    type: "GET",
//	    url: "agent_mng/inc_download_client_count",
//	    data: "",
//	    success: function (result) {
//	    	var strHtml = "";
//	    	result = RemoveDebugInfoInJsonResult(result);
//	    	if (result.length == 0)
//	      {
//	      	$.messager.alert('错误','递增失败！详细：数据错误');
//	        return;
//	   		}
//	    	var jsonResult = jQuery.parseJSON(result);
//	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
//	      {
//	      	strMsg = '递增失败！详细：' + MyJsonDecode(jsonResult.szMsg);
//	      	$.messager.alert('错误', strMsg);
//	        	return;
//	   		}
//	    }
//	});
//				return;
////}}}
				
	$('#ahDownloadClientLink').text('正在生成客户端，约需一分钟，请稍候......');
	
	//{{{ for test
	//			$('#ahDownloadClientLink').text('请点击此链接下载客户端！');
	//			$('#divDownloadDialog').dialog('center');
	//			$('#divDownloadDialog').dialog('open');
	//return;
	//}}}
	
	g_nCheckGenerateClientProgress_Count = 0;
	$.ajax({
	    type: "GET",
	    url: "agent_mng/generate_client",
	    data: 'type=' + String(g_nCheckGenerate_Type),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','请求下载客户端失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '请求下载客户端失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
	   		
				setTimeout("CheckGenerateClientProgress();", 1*1000);
				
				$('#divDownloadDialog').dialog('center');
				$('#divDownloadDialog').dialog('open');
				
				//$.messager.progress();
	    }
	});
}
var g_strHrefDownloadClient = "";
function CheckGenerateClientProgress()
{
	g_strHrefDownloadClient = "";
	
	$.ajax({
	    type: "GET",
	    url: "agent_mng/check_generate_client_progress",
	    data: 'type=' + String(g_nCheckGenerate_Type),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
					$.messager.progress('close');
	      	$.messager.alert('错误','下载客户端失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
					$.messager.progress('close');
	      	strMsg = '下载客户端失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
	   		
	   		g_nCheckGenerateClientProgress_Count ++;
	   		if (g_nCheckGenerateClientProgress_Count > 100)
	      {
					$.messager.progress('close');
	      	strMsg = '下载客户端失败，详细：操作超时';
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
	   		
	   		var strDownloadUrl = MyJsonDecode(jsonResult.szData);
				if (strDownloadUrl == null || strDownloadUrl.length == 0)
				{
					setTimeout("CheckGenerateClientProgress();", 1*1000);
					return;
				}
				//$.messager.progress('close');
				$('#ahDownloadClientLink').text('请点击此链接下载客户端！');
				g_strHrefDownloadClient = strDownloadUrl;
				//$('#ahDownloadClientLink').prop('href', MyJsonDecode(jsonResult.szData));
				////////$('#spanDownloadClientLink').css({'margin-top':'80px'});
				$('#spanDownloadClientLink').css({'margin-left':'110px'});
	    }
	});
}
function ClickHrefDownloadClient()
{
	if (! $('#agree_user_protocol').is(':checked'))
	{
	      	$.messager.alert('错误', '您须先同意用户协议才能下载客户端！');
	        return;
	}
	if (g_strHrefDownloadClient.length == 0)
	{
	      	$.messager.alert('错误', '客户端下载地址未生成！请稍候再试！');
	        return;
	}
	window.location.href = g_strHrefDownloadClient;
}

var g_nCount_OuterCall_ShowSetMainPageDialog = 0;
function OuterCall_ShowSetMainPageDialog()
{
	g_nCount_OuterCall_ShowSetMainPageDialog = 0;
	setTimeout("OuterCall_ShowSetMainPageDialog_TO();", 100);
}
function OuterCall_ShowSetMainPageDialog_TO()
{
	g_nCount_OuterCall_ShowSetMainPageDialog ++;
	if (g_nCount_OuterCall_ShowSetMainPageDialog > 10)
		return;
	if (g_AllAgent != null)
	{
  	if (g_AllAgent.length == 1)
  		UpdateAgent();
	}
	else
		setTimeout("OuterCall_ShowSetMainPageDialog_TO();", 500);
}

function AssignUnAssignNfAccount()
{
	var b__SelfLockURL_Pre = $('#SelfLockURL').prop('checked');
	if (! b__SelfLockURL_Pre)
	{
    // 不锁定主页时，主页URL必须设置为空！！！
		$('#SelfURL').val('');
		return;
	}
	var SelfURL_Pre = $.trim($('#SelfURL').val());
	if (SelfURL_Pre.length > 0)
		return;
	$.messager.show({
		title:'提示',
		msg:'系统将为您分配一个主页推广网址',
		timeout:3000,
		showType:'slide'
	});
	$('#btnSubmit_EditAgent').linkbutton('disable');
	$.ajax({
	    type: "GET",
	    url: "nf_statt/get_idle_nf_account/",
	    data: '',
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取未分配的主页推广号段失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取未分配的主页推广号段失败失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
	   		
	   		var strNfUrl = MyJsonDecode(jsonResult.szData);
				$('#SelfURL').val(strNfUrl);
				$('#btnSubmit_EditAgent').linkbutton('enable');
	    }
	});
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
	GetAllAgent(1);  // 重新排序后显示第一页
}

function UnfoldPopAgent(strPopAgentID)
{
	var strExpression_1 = '#tbdAgentList tr[id^="trAgent_'+strPopAgentID+'_"]';
	if ($(strExpression_1).is(':visible'))
		$(strExpression_1).hide();
	else
		$(strExpression_1).show();
	var strExpression_2 = '#tbdAgentList tr[id^="trPopTotal_'+strPopAgentID+'"]';
	if ($(strExpression_2).is(':visible'))
		$(strExpression_2).hide();
	else
		$(strExpression_2).show();
	
	if ($('#aUnfoldPopAgent_'+strPopAgentID).html() == '展开')
		$('#aUnfoldPopAgent_'+strPopAgentID).html('收起');
	else
		$('#aUnfoldPopAgent_'+strPopAgentID).html('展开');
}

function ShowRegisterProtocolDialog()
{
	$('#divRegisterProtocolDialog').dialog('center');
	$('#divRegisterProtocolDialog').dialog('open');
}

function ShowRecentAgentClientCountChart(strAgentId)
{
	var strMsg = "";
	var i = 0;

	$.ajax({
	    type: "GET",
	    url: "agent_mng/get_recent_agent_client_count?AgentID_ToDisplay=" + strAgentId,
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
	     	
	     	$('#divRecentAgentClientCountChartDialog').dialog('center');
	     	$('#divRecentAgentClientCountChartDialog').dialog('open');
				
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
				
				var myChart = echarts.init(document.getElementById("divRecentAgentClientCountChart"));
			  myChart.setOption(option, true);
	    }
	});
}

function GetAgentClientDecrease()
{
	var strMsg = "";
	var i = 0;
	
	    	$('#tbdGetAgentClientDecrease').html("");
	
	var strAgentClientDecrease_Rate = $("#iptAgentClientDecrease_Rate").val();
	if (strAgentClientDecrease_Rate == "")
		strAgentClientDecrease_Rate = "12";

	$.ajax({
	    type: "GET",
	    url: "agent_mng/get_agent_client_decrease?AgentClientDecrease_Rate=" + strAgentClientDecrease_Rate,
			timeout:3000,
	    data: "",
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取客户端流失信息失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取客户端流失信息失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取客户端流失信息失败！详细：数据错误');
	          return;
	     	}
	     	var t_RecentAgentClientCountArray = jsonResult.szData;
	     	var strHtml = "";
	     	
	     	$('#divGetAgentClientDecreaseDialog').dialog('center');
	     	$('#divGetAgentClientDecreaseDialog').dialog('open');
	     	if (t_RecentAgentClientCountArray == null || t_RecentAgentClientCountArray == "")
			{
	        	//$.messager.alert('提示','未发现存在客户端流失的代理商！');
	     		strHtml += '<tr>';
	     		strHtml += '<td colspan="6" class="blue_font" align="center" style="">';
	     		strHtml += 		"未发现存在客户端流失的代理商！";
	     		strHtml += '</td>';
	     		strHtml += '</tr>';
				$('#tbdGetAgentClientDecrease').html(strHtml);
				return;
	     	}
	     	
	     	for (i = 0; i < t_RecentAgentClientCountArray.length; i ++)
	     	{
	     		strHtml += '<tr>';
	     		strHtml += '<td>';
	     		strHtml += 		MyJsonDecode(t_RecentAgentClientCountArray[i].AgentName);
	     		strHtml += '</td>';
	     		strHtml += '<td>';
	     		strHtml += 		MyJsonDecode(t_RecentAgentClientCountArray[i].ClientCount_Before);
	     		strHtml += '</td>';
	     		strHtml += '<td>';
	     		strHtml += 		MyJsonDecode(t_RecentAgentClientCountArray[i].DateDate_Before);
	     		strHtml += '</td>';
	     		strHtml += '<td>';
	     		strHtml += 		MyJsonDecode(t_RecentAgentClientCountArray[i].ClientCount_Now);
	     		strHtml += '</td>';
	     		strHtml += '<td>';
	     		strHtml += 		MyJsonDecode(t_RecentAgentClientCountArray[i].DateDate_Now);
	     		strHtml += '</td>';
	     		strHtml += '<td>';
	     		strHtml += 		MyJsonDecode(t_RecentAgentClientCountArray[i].Decrease_Rate) + "%";
	     		strHtml += '</td>';
	     		strHtml += '</tr>';
	    	}
	    	$('#tbdGetAgentClientDecrease').html(strHtml);
	    }
	});
}
function SwitchAgentFeedbackModule(AgentID, nEnable, strModuleName)
{
	var strMsg = "";
	var i = 0;
	var strMsg = "";
	
	if (nEnable == 1)
		strMsg = '您确定<span class="blue_font" style="margin:2px;">开启</span>'+strModuleName+'日志模块吗';
	else
		strMsg = '您确定<span class="red_font" style="margin:2px;">关闭</span>'+strModuleName+'日志模块吗';

	$.messager.confirm('确认操作', strMsg,function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "agent_mng/switch_agent_feedback_module?agent_id="+AgentID+"&enable=" + String(nEnable) + "&module_name=" + strModuleName,
					timeout:3000,
			    data: "",
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','设置日志模块开关失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '设置日志模块开关失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			    	if (jsonResult.szData == undefined)
			      {
			        	$.messager.alert('错误','设置日志模块开关失败！详细：数据错误');
			          return;
			     	}
			     	func_Get();
			     	$.messager.alert('提示','设置日志模块开关成功！');
			    }
			});
		}
	});
}
function SwitchAgentIsBanned(AgentID, nIsBanned)
{
	var strMsg = "";
	var i = 0;
	var strMsg = "";
	
	if (nIsBanned == 1)
		strMsg = '您确定<span class="blue_font">禁用</span>所选账户吗';
	else
		strMsg = '您确定<span class="red_font">启用</span>所选账户吗';

	$.messager.confirm('确认操作', strMsg,function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "agent_mng/switch_agent_is_banned?agent_id="+AgentID+"&is_banned=" + String(nIsBanned),
					timeout:3000,
			    data: "",
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','设置账户是否禁用状态失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '设置是否禁用状态失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			    	if (jsonResult.szData == undefined)
			      {
			        	$.messager.alert('错误','设置是否禁用状态失败！详细：数据错误');
			          return;
			     	}
			     	func_Get();
			     	$.messager.alert('提示','设置是否禁用状态成功！');
			    }
			});
		}
	});
}

function Generate_KuaiFen_ModuleHtml(strAgentId, tAllKuaiFenModuleInfo, strKF_module_id_list)
{
	var strHtml = '<ul style="margin:0;padding:0;list-style:none;">';
	var arModuleId_Array = strKF_module_id_list.split("_");
	
	for (var kk = 0; kk < tAllKuaiFenModuleInfo.length; kk ++)
	{
		var nnn = 0;
		var bIsAssigned = false;
		var strModuleId = MyJsonDecode(tAllKuaiFenModuleInfo[kk]["Id"]);
		
		for (nnn = 0; nnn < arModuleId_Array.length; nnn++)
			if (arModuleId_Array[nnn] == strModuleId)
				break;
		if (nnn < arModuleId_Array.length)
			bIsAssigned = true;
		
		strHtml += '<li id="liKuaiFenModule_'+String(strAgentId)+'_'+strModuleId+'">';
		if (bIsAssigned)
		strHtml += '<a class="green_font" href="#" onclick="UnAssign_KuaiFen_Module('+strAgentId+','+strModuleId+');">';
		else
		strHtml += '<a href="#" onclick="Assign_KuaiFen_Module('+strAgentId+','+strModuleId+');">';
		strHtml += 	MyJsonDecode(tAllKuaiFenModuleInfo[kk]["module_name"]);
		strHtml += "</a>";
		strHtml += "</li>";
	}
	strHtml += "</ul>";
	return strHtml;
}

function Assign_KuaiFen_Module(AgentId, ModuleId)
{	
	var strMsg = "";
	var i = 0;
	var strMsg = "";
	
	strMsg = '您确定<span class="blue_font">分配</span>所选模块吗';

	$.messager.confirm('确认操作', strMsg,function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "agent_module_mng/assign_agent_module_single?agent_id="+String(AgentId)+"&module_id=" + String(ModuleId),
					timeout:3000,
			    data: "",
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','分配模块失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '分配模块失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			    	if (jsonResult.szData == undefined)
			      {
			        	$.messager.alert('错误','分配模块失败！详细：数据错误');
			          return;
			     	}
			     	
						var str_liKuaiFenModule = 'liKuaiFenModule_'+String(AgentId)+'_'+String(ModuleId);
						strHtml += '<a class="green_font" href="#" onclick="UnAssign_KuaiFen_Module('+String(AgentId)+','+String(ModuleId)+');">';
						strHtml += 		$('#'+str_liKuaiFenModule).text();
						strHtml += '</a>';
						$('#'+str_liKuaiFenModule).html(strHtml);
			     	//func_Get();
			     	$.messager.alert('提示','分配模块成功！');
			     	
			    }
			});
		}
	});
}

function UnAssign_KuaiFen_Module(AgentId, ModuleId)
{	
	var strMsg = "";
	var i = 0;
	var strMsg = "";
	
	strMsg = '您确定<span class="blue_font">取消分配</span>所选模块吗';

	$.messager.confirm('确认操作', strMsg,function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "agent_module_mng/unassign_agent_module_single__Simple?agent_id="+String(AgentId)+"&module_id=" + String(ModuleId),
					timeout:3000,
			    data: "",
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','取消分配模块失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '取消分配模块失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			    	if (jsonResult.szData == undefined)
			      {
			        	$.messager.alert('错误','取消分配模块失败！详细：数据错误');
			          return;
			     	}
			     	
						var str_liKuaiFenModule = 'liKuaiFenModule_'+String(AgentId)+'_'+String(ModuleId);
						strHtml += '<a href="#" onclick="Assign_KuaiFen_Module('+String(AgentId)+','+String(ModuleId)+');">';
						strHtml += 		$('#'+str_liKuaiFenModule).text();
						strHtml += '</a>';
						$('#'+str_liKuaiFenModule).html(strHtml);
			     	//func_Get();
			     	$.messager.alert('提示','取消分配模块成功！');
			     	
			    }
			});
		}
	});
}

function Enabled_ChangeInfo_AllFields()
{
	$('#divEditAgentDialog').find("input").prop("disabled",false);
	$('#UserName').prop("disabled", true);
}