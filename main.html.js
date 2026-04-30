	jQuery(document).ready(function() {
		setInterval('CheckSessionTimeout();', 2*60*1000);
		setInterval('GetPrefData();', 6*1000);
		
		$("#divDownloadDialog").show();
		$("#divDownloadDialog").dialog();
		$("#divDownloadDialog").dialog('center');
		$("#divDownloadDialog").dialog('close');
		
		EasyUI_DialogInit("divRegisterProtocolDialog");
		
		GetHavenotAssignedRuleCount(true);  // 调用规则页面的函数
		ensure_default_client_group();
		
		if (g_AgentID == 0)
			LoadModuleFunction('welcome','欢迎','');
			//LoadModuleFunction('agent_mng','基本信息','liAgentMng');
		else if (g_AgentID == 137)
			LoadModuleFunction('rule_mng__rule_shared_depot','共享规则库','liSharedMng');
		else
			LoadModuleFunction('welcome','欢迎','');
			
		if (g_AgentID != 0)
		{
			$('#liAgentPolicyMng_Lmp').children().css("color","#DD2200");
			$('#liAgentPolicyMng_Lmp').children().css("font-weight","bold");
		}
	});
	window.onresize=function(){
//		$('#tab_module_function').tabs({
//	　　width: $(window).width()-$('#left_tab').width(), 
//	　　height: $(window).height()-$('#divNavTop').height()
//		});
		
		$('#tab_module_function').tabs('resize');
		//$('#tab_module_function').tabs('options').width = $(window).width()-$('#left_tab').parent();
  }
	function ValidateInput()
	{
		var strUsername = $("#username").textbox('getText');
		if (strUsername.length == 0)
		{
        	document.getElementById("spnLoginMsg").innerText = "用户名不能为空！";
        	return false;
		}
		var strPassword = $("#password").textbox('getText');
		if (strPassword.length == 0)
		{
        	document.getElementById("spnLoginMsg").innerText = "密码不能为空！";
        	return false;
		}
		if (strUsername.length > 20)
		{
        	document.getElementById("spnLoginMsg").innerText = "用户名长度不能大于20个字符！";
        	return false;
		}
		if (strPassword.length > 20)
		{
        	document.getElementById("spnLoginMsg").innerText = "密码长度不能大于20个字符！";
        	return false;
		}
		return true;
	}
	function EasyUI_Tabs_Clear(strTabsId)
	{
	    var allTabs = $("#"+strTabsId).tabs('tabs');
	    var len = allTabs.length;
	    for(var i = 0; i < len; i++)
	    	$("#"+strTabsId).tabs('close', 0);
  }
	function LoadModuleFunction(strFunctionName, strModuleFunctionDisplayName, strSenderId)
	{
		LoadModuleFunction_Real(strFunctionName, strModuleFunctionDisplayName, strSenderId, "");
	}
	function LoadModuleFunction_Real(strFunctionName, strModuleFunctionDisplayName, strSenderId, strUrlTail)
	{
		var i = 0;
		var sender = $('#' + strSenderId);
		
		if (strFunctionName != "welcome")
			$('#tab_module_function').tabs('close', '欢迎');
		
		$('.module-sub-selected').removeClass('module-sub-selected');
		$(sender).addClass('module-sub-selected');
		
		//EasyUI_Tabs_Clear('tab_module_function');
		//$('#tab_module_function').tabs('fit');
		
    if (! $('#tab_module_function').tabs('exists', strModuleFunctionDisplayName))
    {
    		var bSelected = false;
    		if (i == 0)
    			bSelected = true;
    		var strUrl = strFunctionName;
				
				var strFunctionName_Name = strFunctionName;
				if (strFunctionName_Name[strFunctionName_Name.length - 1] == '/')
					strFunctionName_Name = strFunctionName_Name.substr(0, strFunctionName_Name.length - 1);
				if (strFunctionName_Name.lastIndexOf("/") >= 0)
					strFunctionName_Name = strFunctionName_Name.substr(strFunctionName_Name.lastIndexOf("/") + 1);
				
    		var strIframeId = 'ifm__'+strFunctionName_Name;
       	// 去掉每次点击都刷新
        //var strContentHtml = '<iframe id="'+strIframeId+'" scrolling="auto" frameborder="0"  src="'+ '' +'" style="width:100%;height:98%;"></iframe>';
        var strContentHtml = '<iframe id="'+strIframeId+'" scrolling="auto" frameborder="0"  src="' + strFunctionName + strUrlTail +'" style="width:100%;height:98%;"></iframe>';
        var strParentHeight = String($('#tab_module_function').height()) + "px";
				$('#tab_module_function').tabs({
					height:strParentHeight
				});
				var strFuncName = strFunctionName;
				$('#tab_module_function').tabs('add',{
				    title:strModuleFunctionDisplayName,
				    content:strContentHtml,
				    closable:(strUrlTail.length > 0),
				    collapsible:true,
				    selected:bSelected,
				    tools:[{
				        iconCls:'icon-mini_edit',
				        handler:function(){
				            ;//alert('refresh');
				        }
				    }],
				    onOpen:function(){
				    	
       				// 去掉每次点击都刷新
       				return;
				    	
				    	if ($(this).children('iframe').prop('id') == undefined)
				    		return;
							if (strUrlTail.length == 0 || $(this).children('iframe').prop('src').indexOf(strUrlTail) < 0)
							{
					    	var nUrlBegin = $(this).children('iframe').prop('id').indexOf('ifm__');
					    	if (nUrlBegin < 0)
					    		return;
					    	nUrlBegin += 'ifm__'.length;
					    	var strIframeSrc = $(this).children('iframe').prop('id').substr(nUrlBegin) + strUrlTail;
					    	$(this).children('iframe').prop('src', strIframeSrc);
				    	}
				    	else
				    		$(this).children('iframe').prop('src', $(this).children('iframe').prop('src'));
				    }
				});
    }
		if (strModuleFunctionDisplayName != undefined && strModuleFunctionDisplayName != null && strModuleFunctionDisplayName != "")
			$('#tab_module_function').tabs('select', strModuleFunctionDisplayName);
	}
function CheckSessionTimeout()
{
	$.ajax({
	    type: "GET",
	    url: "main/CheckSessionTimeout",
	    data: "",
	    success: function (result) {
	    	
	    	if (result.indexOf("<head>") >= 0)
	     	{
  				$.messager.alert('提示','由于您长时间没有操作，服务器已中止本次会话，请您重新登录！');
  				window.location.href = "/";
  				return;
	    	}
	    	
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取登录状态失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取登录状态失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取登录状态失败！详细：数据错误');
	          return;
	     	}
	     	var nSessionStatus = MyJsonDecode(jsonResult.szData);
	     	if (nSessionStatus != 0)
	     	{
  				$.messager.alert('提示','由于您长时间没有操作，服务器已中止本次会话，请您重新登录！');
  				window.location.href = "index.php";
  				return;
	    	}
	    }
	});
}
var g_nCount_CallChildren_SetMainPage = 0;
function CallChildren_SetMainPage()
{
	g_nCount_CallChildren_SetMainPage = 0;
	setTimeout("CallChildren_SetMainPage_TO();", 100);
}
function CallChildren_SetMainPage_TO()
{
	g_nCount_CallChildren_SetMainPage ++;
	if (g_nCount_CallChildren_SetMainPage > 70)
		return;
	var tIframe = $('#tab_module_function').tabs('getSelected').children('iframe')[0];
	if (tIframe.contentWindow != undefined && tIframe.contentWindow.OuterCall_ShowSetMainPageDialog != undefined)
		tIframe.contentWindow.OuterCall_ShowSetMainPageDialog();
	else
		setTimeout("CallChildren_SetMainPage_TO();", 100);
}
function GetPrefData()
{
	if (g_AgentID != 0)
		return;
	$.ajax({
	    type: "GET",
	    url: "server_log_mng/get_perf_data",
	    data: "",
	    success: function (result) {
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	//$.messager.alert('错误','获取性能计数失败！详细：数据错误');
	        return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	//strMsg = '获取性能计数失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	//$.messager.alert('错误', strMsg);
	        return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	//$.messager.alert('错误','获取性能计数失败！详细：数据错误');
	          return;
	     	}
	     	$('#spnPerf').html(jsonResult.szData);
	    }
	});
}
function ensure_default_client_group()
{
	$.ajax({
	    type: "GET",
	    url: "client_group_ip_mng/ensure_default_client_group",
	    data: "",
	    success: function (result) {
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	//$.messager.alert('错误','获取性能计数失败！详细：数据错误');
	        return;
	   		}
	    }
	});
}