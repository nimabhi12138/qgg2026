
var g_AllRule = null;
var g_AllAgent = null;
var g_strRuleId_Selected = "";
var g_bUpdateOrInsert = true;
var g_bAdvMode = false;
var g_strRuleItemTabHtml = "";

jQuery(document).ready(function() {
	Init();
	func_Get();
	$("#divEditRuleDialog").show();
	$("#divEditRuleDialog").dialog();
	$("#divEditRuleDialog").dialog('center');
	if ((window.screen.availHeight-150) < 580)
		$("#divEditRuleDialog").dialog('resize',{width: 1080, height: window.screen.availHeight-150});
	$("#divEditRuleDialog").dialog('close');
	$('#divRuleList').css('height', $(window).height() - 70);
	
	//$('#divRuleList').css('height', window.screen.availHeight - 225);
	
	g_strRuleItemTabHtml = $('#divRuleItemTab').html();
	$('#divRuleItemTab').tabs();
	
	if (JSON.stringify("中文").length > 4)
		$("#spnMsg").html("温馨提示：IE8浏览器下不允许规则中使用中文，请您重新输入或更换浏览器");
		
	$("#divShareRuleToSpecifiedAgentDialog").show();
	$("#divShareRuleToSpecifiedAgentDialog").dialog();
	$("#divShareRuleToSpecifiedAgentDialog").dialog('close');
	$("#divShareRuleToMany_AgentDialog").show();
	$("#divShareRuleToMany_AgentDialog").dialog();
	$("#divShareRuleToMany_AgentDialog").dialog('close');
	$("#divUpdateRuleDialog").show();
	$("#divUpdateRuleDialog").dialog();
	$("#divUpdateRuleDialog").dialog('close');
	$("#divCopyRuleDialog").show();
	$("#divCopyRuleDialog").dialog();
	$("#divCopyRuleDialog").dialog('close');
	$("#divDeleteShareRuleToMany_AgentDialog").show();
	$("#divDeleteShareRuleToMany_AgentDialog").dialog();
	$("#divDeleteShareRuleToMany_AgentDialog").dialog('close');
	$("#divUpdateAllCopyedFromThisRule_AgentDialog").show();
	$("#divUpdateAllCopyedFromThisRule_AgentDialog").dialog();
	$("#divUpdateAllCopyedFromThisRule_AgentDialog").dialog('close');
});
var func_Get = function Get()
{
	func_GetAllRule();
}
function Init()
{
	$("#tblRuleItem_Adv textarea").dblclick(function(e){
			$(this).css('height', $(this).height()+60);
	});
}
var func_GetAllRule = function GetAllRule()
{
	var strMsg = "";
	var nItemCount = 0;
	var i = 0;
	
	GetHavenotAssignedRuleCount(false);
	
	var strQuery = "ModuleParam=" + g_strModuleParam;
 	if (g_AgentID_ToDisplay.length > 0)
 		strQuery += "&AgentID_ToDisplay=" + g_AgentID_ToDisplay;
 		
 	var search_keyword = $.trim($('#search_keyword').val());
 	if (search_keyword.length > 0)
 		strQuery += "&rule_name=" + search_keyword;
	
	g_strRuleId_Selected = "";
	$.ajax({
	    type: "GET",
	    url: "rule_mng/get_all_rule",
	    data: strQuery,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取规则信息失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取规则信息失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取规则信息失败！详细：数据错误');
	          	return;
	     	}
	     	g_AllRule = jsonResult.szData.tAllRule;
	     	g_AllAgent = jsonResult.szData.tAllAgent;
	     	var strHtml = "";
	     	
	     	strHtml = '<option value="0">请选择...</option>';
	     	for (i = 0; i < g_AllAgent.length; i ++)
	     		strHtml += '<option value="'+MyJsonDecode(g_AllAgent[i].AgentID)+'">'+MyJsonDecode(g_AllAgent[i].AgentName)+'</option>';
	     	$('#ShareRuleToSpecifiedAgent__agent_id_share_to').html(strHtml);
	     	
	     	strHtml = "";
	     	for (i = 0; i < g_AllRule.length; i ++)
	     	{
	     		var strRuleId = MyJsonDecode(g_AllRule[i].Id);
	     		var strTrClass = "";
	     		var bIsShare = (MyJsonDecode(g_AllRule[i].IsShare) == 1);
	     		if (bIsShare)
	     			strTrClass = "warning";
	     		var EnableAd = MyJsonDecode(g_AllRule[i].EnableAd)==1?'启用':'禁用';
	     		if (EnableAd == '禁用')
	     			EnableAd = '<span class="red_font">'+EnableAd+'</sapn>';
	     		var is_hide = MyJsonDecode(g_AllRule[i].is_hide)==1?'隐藏':'可见';
	     		if (is_hide == '隐藏')
	     			is_hide = '<span class="blue_font">'+is_hide+'</sapn>';
	     		var run_possibility = MyJsonDecode(g_AllRule[i].run_possibility);
	     		if (run_possibility < 100)
	     			run_possibility = '<span class="red_font">'+run_possibility+'</sapn>';
	     		
	     		var strAgentName = MyJsonDecode(g_AllRule[i].AgentName)	
	     		var strOrgnShareAgentID = MyJsonDecode(g_AllRule[i].OrgnShareAgentID);
	     		
	     		if (MyJsonDecode(g_AllRule[i].AgentID) == 0)
	     			strAgentName = "振创网络";
	     		
	     		var strAgentName_Display = strAgentName;
	        if (g_AgentID != 0 && MyJsonDecode(g_AllRule[i].OrgnShareAgentID) != g_AgentID)
	        {
	        	strAgentName_Display = strAgentName.substr(0,4);
	        	for (var kk = 4; kk < strAgentName.length; kk ++)
	        			strAgentName_Display += "*";
	      	}
	     			
		      strHtml += '<tr id="trRule_'+strRuleId+'" class="'+strTrClass+'" onclick="Select_Rule('+strRuleId+')">';
	        strHtml += '<td class="v-al-md">'+strAgentName_Display+'</td>';
	        strHtml += '<td class="v-al-md">'+MyJsonDecode(g_AllRule[i].AdName)+'</td>';
	        if (g_AgentID == 0 && g_LevelType == 0)
	        strHtml += '<td class="v-al-md" onclick="Switch_Rule_EnableAd('+strRuleId+');">'+EnableAd+'</td>';
	        else
	        strHtml += '<td class="v-al-md">'+EnableAd+'</td>';
	        if (g_AgentID == 0 && g_LevelType == 0)
	        strHtml += '<td class="v-al-md" onclick="Switch_Rule_IsShare('+strRuleId+');">'+(bIsShare?'是':'否')+'</td>';
	        else
	        strHtml += '<td class="v-al-md">'+(bIsShare?'是':'否')+'</td>';
	        if (g_AgentID == 0 /*&& g_LevelType == 0*/)
	        strHtml += '<td class="v-al-md" onclick="Switch_Rule_is_hide('+strRuleId+');">'+is_hide+'</td>';
	        
	        if (g_AgentID == 0)
	      	strHtml += '<td class="v-al-md" style="">'+run_possibility+'</td>';
	        
	        strHtml += '<td>';
	        // 代理商不能看到和修改共享规则，自己共享的规则除外
	        if ((g_AgentID != 0 && strOrgnShareAgentID != g_AgentID)   || (   g_LevelType != 0
	        																															 && (	   g_strModuleParam == "rule_shared_depot"
	        																															 			|| g_AgentID_ToDisplay == ""
	        																															 			|| strOrgnShareAgentID != MyJsonDecode(g_AllRule[i].AgentID)
	        																															 		)
	        																															)
	        		)
	        	;
	        else
	        {
	        strHtml += 		'<div id="divShowRuleItemTab_'+strRuleId+'" class="easyui-tabs" style="width:800px;height:140px;">';
	        strHtml += 				'<div title="文件规则" style="">';
	        strHtml += 						Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].PE), "文件");
	        strHtml += 						Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].DIR), "文件");  // 都是文件
	        strHtml += 						Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].MD5), "文件");
	        strHtml += 				'</div>';
//	        strHtml += 				'<div title="目录规则" style="">';
//	        strHtml += 						Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].DIR))
//	        strHtml += 				'</div>';
//	        strHtml += 				'<div title="MD5规则" style="">';
//	        strHtml += 						Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].MD5))
//	        strHtml += 				'</div>';
	        strHtml += 				'<div title="注册表规则" style="">';
	        strHtml += 						Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].REG), "注册表")
	        strHtml += 						Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].MD5_REG), "注册表MD5")
	        strHtml += 				'</div>';
	        //strHtml += 				'<div title="注册表MD5规则" style="">';
	        //strHtml += 						Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].MD5_REG))
	        //strHtml += 				'</div>';
	        strHtml += 				'<div title="网络规则" style="">';
	        strHtml += 						Generate_RuleItemHtml_Str_RuleIP(MyJsonDecode(g_AllRule[i].IP))
	        strHtml += 				'</div>';
	        strHtml += 				'<div title="窗口规则" style="">';
	        strHtml += 						Generate_RuleItemHtml_Str_RuleWINDOW(MyJsonDecode(g_AllRule[i].CtrlWnd))
	        strHtml += 				'</div>';
	        strHtml += 				'<div title="线程注入规则" style="">';
	        strHtml += 						Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].AntiThread))
	        strHtml += 				'</div>';
		      strHtml += 		'</div>';
		    	}
	        strHtml += '</td>';
	      	strHtml += '<td class="v-al-md" style="">'+MyJsonDecode(g_AllRule[i].RuleUsedCount)+'</td>';
	      	strHtml += '<td class="v-al-md" style="word-break:break-word;">'+Generate_BkRuleHtml(MyJsonDecode(g_AllRule[i].bk_id_list), MyJsonDecode(g_AllRule[i].bk_desc_list))+'</td>';
	      	strHtml += '<td class="v-al-md" style="word-break:break-word;">'+MyJsonDecode(g_AllRule[i].Remark)+'</td>';
	      	if (MyJsonDecode(g_AllRule[i].has_update).length == 0)
	      	strHtml += '<td class="v-al-md" style="">'+MyJsonDecode(g_AllRule[i].LastModify).substring(0,10)+'</td>';
	      	else
	      	strHtml += '<td id="tdLastModify_'+strRuleId+'" class="v-al-md" style=""><a href="#" onclick="UpdateSharedRule('+strRuleId+');">更新</a></td>';
	      	
//	        strHtml += '<td>'+Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].PE))+'</td>';
//	        strHtml += '<td>'+Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].DIR))+'</td>';
//	       	strHtml += '<td>'+Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].MD5))+'</td>';
//	        strHtml += '<td>'+Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].REG))+'</td>';
//	        strHtml += '<td>'+Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].MD5_REG))+'</td>';
//	        strHtml += '<td>'+Generate_RuleItemHtml_Str(MyJsonDecode(g_AllRule[i].IP))+'</td>';

		      strHtml += '</tr>';
	    	}
	    	$('#tbdRuleList').html(strHtml);
	    	$('#tbdRuleList .easyui-tabs').tabs();
	    }
	});
}
function Select_Rule(strRuleId)
{
	var i = 0;
	g_strRuleId_Selected = strRuleId;
 	for (i = 0; i < g_AllRule.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllRule[i].Id);
 		if (strId == g_strRuleId_Selected)
			$('#trRule_'+strId).addClass('danger');
		else
			$('#trRule_'+strId).removeClass('danger');
 	}
}
function DeleteRule()
{
	if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中待删除的规则！');
		return;
	}
	$.messager.confirm('确认操作','您确定要删除此规则吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "rule_mng/delete_rule/AdRule_id/" + g_strRuleId_Selected,
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除规则失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除规则失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除规则成功！");
			      
			      // 删除页面元素，简单处理直接重新取一遍数据
			      func_GetAllRule();
			    }
			});
		}
	});
}
function UpdateRule(bAdvMode)
{
	g_bAdvMode = bAdvMode;
	
	g_bUpdateOrInsert = true;
	ShowEditRuleDialog();
}
function InsertRule(bAdvMode)
{
	g_bAdvMode = bAdvMode;
	
	g_bUpdateOrInsert = false;
	ShowEditRuleDialog();
}
function ShowEditRuleDialog()
{
	var strOp = "insert_rule";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_rule";
		strOpName = "修改";
	}
	
	// 清空窗口先
	Clear_EditRuleDialog();
	if (! g_bAdvMode)
	{
			$('#divRuleItem_Adv').hide();
			$('#divRuleItemTab').show();
	}
	else
	{
			$('#divRuleItem_Adv').show();
			$('#divRuleItemTab').hide();
	}
	
	// 启用规则复选框默认勾上
	$('#EnableAd').prop('checked', true);
	
	if (! g_bUpdateOrInsert)
		$('#AdRule_id').val('');  // 新增要清空Id
	else
	{
		if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
		{
			$.messager.alert('错误','请先选中待修改的规则！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllRule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllRule[i].Id);
	 		if (strId == g_strRuleId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllRule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		
		// 代理商不能看到和修改的共享规则，自己共享的规则除外
		if (g_AgentID != 0 && MyJsonDecode(g_AllRule[i].OrgnShareAgentID) != g_AgentID)
		{
			$.messager.alert('错误','您不能修改其他代理商提供的共享规则！');
			return;
		}
		
		$('#AdRule_id').val(g_strRuleId_Selected);
		$('#AdName').val(MyJsonDecode(g_AllRule[i].AdName));
		$('#EnableAd').prop('checked', MyJsonDecode(g_AllRule[i].EnableAd) == 1);
		$('#IsShare').prop('checked', MyJsonDecode(g_AllRule[i].IsShare) == 1);
		$('#is_hide').prop('checked', MyJsonDecode(g_AllRule[i].is_hide) == 1);
		$('#Remark').val(MyJsonDecode(g_AllRule[i].Remark));
	  if (g_AgentID == 0)
		$('#run_possibility').val(MyJsonDecode(g_AllRule[i].run_possibility));
		
		if (! g_bAdvMode)
		{
			//Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].PE), 'RulePE_1_DirItem');
			Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].PE), 'RuleDIR');  // 三个合并
			Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].DIR), 'RuleDIR');
			Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].MD5), 'RuleDIR');
			//Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].MD5), 'RuleMD5_1_DirItem');
			Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].REG), 'RuleREG');
			Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].MD5_REG), 'RuleREG');  // 两个合并
			//Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].MD5_REG), 'RuleREGMD5');
			Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].IP), 'RuleIP');
			Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].CtrlWnd), 'RuleWINDOW');
			Show_RuleItem_Input_Str(MyJsonDecode(g_AllRule[i].AntiThread), 'RuleAntiThread');
		}
		else
		{
			$('#EditAdRule__PE').val(MyJsonDecode(g_AllRule[i].PE));
			$('#EditAdRule__DIR').val(MyJsonDecode(g_AllRule[i].DIR));
			$('#EditAdRule__MD5').val(MyJsonDecode(g_AllRule[i].MD5));
			$('#EditAdRule__REG').val(MyJsonDecode(g_AllRule[i].REG));
			$('#EditAdRule__MD5_REG').val(MyJsonDecode(g_AllRule[i].MD5_REG));
			$('#EditAdRule__IP').val(MyJsonDecode(g_AllRule[i].IP));
			$('#EditAdRule__CtrlWnd').val(MyJsonDecode(g_AllRule[i].CtrlWnd));
			$('#EditAdRule__AntiThread').val(MyJsonDecode(g_AllRule[i].AntiThread));
			$('#EditAdRule__ThreadControl').val(MyJsonDecode(g_AllRule[i].ThreadControl));
		}
	}
		
	$("#divEditRuleDialog").dialog({title: strOpName + '规则'});
	$('#divEditRuleDialog').dialog('center');
	$('#divEditRuleDialog').dialog('open');
}
function Submit_EditRule()
{
	var strOp = "insert_rule";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_rule";
		strOpName = "修改";
	}
	if (! checkinput_EditRule())
		return;
	var strRule_QueryString = "";
	if (! g_bAdvMode)
	{
	strRule_QueryString = GetEditRule_QueryString();
	if (strRule_QueryString.length == 0)
		return;
	}
	
	var strPostData = $("#frmEditRule").serialize() + strRule_QueryString;  // strRule_QueryString以 "&"开头
	if (! $('#EditAdRule__CtrlWnd').is(":visible"))  // not adv mode no ctrlwnd
		strPostData = strPostData.replace('CtrlWnd=', '');
	if (! $('#EditAdRule__AntiThread').is(":visible"))  // not adv mode no AntiT
		strPostData = strPostData.replace('AntiThread=', '');
	
	// IE8下规则不能输入中文
	if (JSON.stringify("中文").length > 4)
	{
		if (strPostData.indexOf("\\u") > 0)
		{
			$.messager.alert('错误','IE8浏览器下不允许规则中使用中文，请您重新输入或更换浏览器！');
			return;
		}
	}
	
	$.ajax({
	    type: "POST",
	    url: "rule_mng/" + strOp,
	    data: strPostData,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'规则失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'规则失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"规则成功！");
				$('#divEditRuleDialog').dialog('close');
	      
	      // 刷新
	      func_GetAllRule();
	    }
	});
}
function checkinput_EditRule()
{
	var AdName = $.trim($("#AdName").val());
	if (AdName.length < 2 || AdName.length > 40)
	{
    $.messager.alert('错误','规则名称长度必须为2到40个字符，请重新输入！');
		return false;
	}
	if (g_bAdvMode)
	{
		var PE = $.trim($("#EditAdRule__PE").val());
		if (PE.length > 0 && ! Is_Validate_JsonString(PE))
		{
	    $.messager.alert('错误','文件规则格式不正确，请重新输入！');
			return false;
		}
		if (PE.length > 10000)
		{
	    $.messager.alert('错误','文件规则最大长度为10000个字符，请重新输入！');
			return false;
		}
		var DIR = $.trim($("#EditAdRule__DIR").val());
		if (DIR.length > 0 && ! Is_Validate_JsonString(DIR))
		{
	    $.messager.alert('错误','目录规则格式不正确，请重新输入！');
			return false;
		}
		if (DIR.length > 10000)
		{
	    $.messager.alert('错误','目录规则最大长度为10000个字符，请重新输入！');
			return false;
		}
		var MD5 = $.trim($("#EditAdRule__MD5").val());
		if (MD5.length > 0 && ! Is_Validate_JsonString(MD5))
		{
	    $.messager.alert('错误','MD5规则格式不正确，请重新输入！');
			return false;
		}
		if (MD5.length > 10000)
		{
	    $.messager.alert('错误','MD5规则最大长度为10000个字符，请重新输入！');
			return false;
		}
		var REG = $.trim($("#EditAdRule__REG").val());
		if (REG.length > 0 && ! Is_Validate_JsonString(REG))
		{
	    $.messager.alert('错误','注册表规则格式不正确，请重新输入！');
			return false;
		}
		if (REG.length > 10000)
		{
	    $.messager.alert('错误','注册表规则最大长度为10000个字符，请重新输入！');
			return false;
		}
		var REGMD5 = $.trim($("#EditAdRule__REGMD5").val());
		if (REGMD5.length > 0 && ! Is_Validate_JsonString(REGMD5))
		{
	    $.messager.alert('错误','注册表MD5规则格式不正确，请重新输入！');
			return false;
		}
		if (REGMD5.length > 10000)
		{
	    $.messager.alert('错误','注册表MD5规则最大长度为10000个字符，请重新输入！');
			return false;
		}
		var IP = $.trim($("#EditAdRule__IP").val());
		if (IP.length > 0 && ! Is_Validate_JsonString(IP))
		{
	    $.messager.alert('错误','网络规则格式不正确，请重新输入！');
			return false;
		}
		if (IP.length > 10000)
		{
	    $.messager.alert('错误','网络规则最大长度为10000个字符，请重新输入！');
			return false;
		}
		var CtrlWnd = $.trim($("#EditAdRule__CtrlWnd").val());
		if (CtrlWnd.length > 0 && ! Is_Validate_JsonString(CtrlWnd))
		{
	    $.messager.alert('错误','窗口规则格式不正确，请重新输入！');
			return false;
		}
		if (CtrlWnd.length > 10000)
		{
	    $.messager.alert('错误','窗口规则最大长度为10000个字符，请重新输入！');
			return false;
		}
		var AntiThread = $.trim($("#EditAdRule__AntiThread").val());
		if (AntiThread.length > 0 && ! Is_Validate_JsonString(AntiThread))
		{
	    $.messager.alert('错误','线程注入规则格式不正确，请重新输入！');
			return false;
		}
		if (AntiThread.length > 10000)
		{
	    $.messager.alert('错误','线程注入规则最大长度为10000个字符，请重新输入！');
			return false;
		}
	}
	return true;
}

function Generate_RuleItemHtml_Str(strRuleItem, strType)
{
	var jsonRuleItem = null;
	try
	{
		jsonRuleItem = jQuery.parseJSON(strRuleItem);
	}
	catch (e)
	{
		return strRuleItem;
	}
	return Generate_RuleItemHtml(jsonRuleItem, strType);
}
function Generate_RuleItemHtml_Str_RuleIP(strRuleItem, strType)
{
	var jsonRuleItem = null;
	try
	{
		jsonRuleItem = jQuery.parseJSON(strRuleItem);
	}
	catch (e)
	{
		return strRuleItem;
	}
	return Generate_RuleItemHtml_RuleIP(jsonRuleItem, strType);
}
function Generate_RuleItemHtml_Str_RuleWINDOW(strRuleItem, strType)
{
	var jsonRuleItem = null;
	try
	{
		jsonRuleItem = jQuery.parseJSON(strRuleItem);
	}
	catch (e)
	{
		return strRuleItem;
	}
	return Generate_RuleItemHtml_RuleWINDOW(jsonRuleItem["CwRule"], strType);
}
function Generate_RuleItemHtml(jsonRuleItem, strType)
{
	var i = 0;
	var strHtml = "";
	
	if (jsonRuleItem.constructor != Object)
		return Generate_RuleItem_ContentHtml(jsonRuleItem);
	
	strHtml += '<table class="table table-condensed table-bordered table-my-add" style="width:100%;padding:0;word-break:break-all;">';
	for (var keyItem in jsonRuleItem)
	{
		var valueItem = jsonRuleItem[keyItem];
		var strContentHtml = Generate_RuleItemHtml(valueItem);
		var strTdClass = "";
		var strTdStyle_1 = "";
		var strTdStyle_2 = "";
		
		if (strContentHtml.indexOf("<table") < 0)
		{
			strTdClass = "bs-bg-info";
			if (keyItem.indexOf("TCP") < 0 && keyItem.indexOf("UDP") < 0)
			{
				strTdStyle_1 = "width:400px;";
				strTdStyle_2 = "width:100px;";
			}
			else
			{
				strTdStyle_1 = "width:100px;";
				strTdStyle_2 = "width:220px;";
			}
		}
		else
		{
			strTdStyle_1 = "width:120px;";
		}
		
		strHtml += '<tr>';
//		if (strType != undefined && strType.length > 0)
//		{
//		strHtml += 		'<td class="v-al-md" style="width:50px;">';
//		strHtml +=			strType;
//		strHtml += 		'</td>';
//		}
		strHtml += 		'<td class="v-al-md" style="'+strTdStyle_1+'">';
		strHtml +=			DisplayFriendly(keyItem);
		strHtml += 		'</td>';
		strHtml += 		'<td class="'+strTdClass+'" style="'+strTdStyle_2+'">';
		strHtml +=			strContentHtml;
		strHtml += 		'</td>';
		strHtml += '</tr>';
	}
	strHtml += '</table>';
	return strHtml;
}
function Generate_RuleItemHtml_RuleIP(jsonRuleItem, strType, strIpFromParent)
{
	var i = 0;
	var strHtml = "";
	var i_Rule = 0;
	
	if (jsonRuleItem == null)
		return "";
		
	if ( (jsonRuleItem.constructor != Object && jsonRuleItem.constructor != Array)
		|| (jsonRuleItem.constructor == Array && (jsonRuleItem.length == 0 || jsonRuleItem[0].constructor != Object))  )
		return Generate_RuleItem_ContentHtml(jsonRuleItem);
	
	strHtml += '<table class="table table-condensed table-bordered table-my-add" style="width:100%;padding:0;word-break:break-all;">';
	for (i_Rule = 0; /**/; i_Rule ++)  // 此循环兼容数组与对象
	{
		var jsonRuleItem_Item = null;
		if (jsonRuleItem.constructor != Array)
		{
			if (i_Rule > 0)  // 不是数组只搞一次
				break;
			jsonRuleItem_Item = jsonRuleItem;
		}
		else
		{
			if (i_Rule >= jsonRuleItem.length)
				break;
			jsonRuleItem_Item = jsonRuleItem[i_Rule];
		}
		
		{
			var keyItem = Object__keys(jsonRuleItem_Item)[0];
			var valueItem = jsonRuleItem_Item[keyItem];
			var strContentHtml = "";
			var strTdClass = "";
			var strTdStyle_1 = "";
			var strTdStyle_2 = "";
			var strDirection = "";
			var strDirection_Value = "";
			var strIp = "";
			
			var strProcessType = "本进程";
			if (jsonRuleItem_Item["level"] != undefined || jsonRuleItem_Item["tcp"] != undefined || jsonRuleItem_Item["udp"] != undefined)
			{
				if (jsonRuleItem_Item["level"] == 2)
					strProcessType = "子进程";
				else if (jsonRuleItem_Item["level"] == 3)
					strProcessType = "本进程 子进程"
			}
			if (keyItem == "level")
			{
				if (jsonRuleItem_Item["tcp"] != undefined)
					keyItem = "tcp";
				else
					keyItem = "udp";
				valueItem = jsonRuleItem_Item[keyItem];
			}
			
			if (valueItem["in"] != undefined)
			{
				strDirection = "进";
				strDirection_Value = "in";
			}
			else if (valueItem["out"] != undefined)
			{
				strDirection = "出";
				strDirection_Value = "out";
			}
			if (valueItem["in"] != undefined || valueItem["out"] != undefined)  // 第一层
			{
				for (var ii_Ip = 0; ii_Ip < valueItem[strDirection_Value].length; ii_Ip ++)
				{
					var objIp_Item = valueItem[strDirection_Value][ii_Ip];
					if (valueItem["out"] != undefined)
					{
							strIp = Object__keys(objIp_Item)[0];
							strContentHtml += Generate_RuleItemHtml_RuleIP(objIp_Item[strIp], undefined, strIp);
					}
					else
						strContentHtml += Generate_RuleItemHtml_RuleIP(objIp_Item);
				}
			}
			else
				strContentHtml = Generate_RuleItemHtml_RuleIP(valueItem);
			
			if (strContentHtml.indexOf("<table") < 0)
			{
				strTdClass = "bs-bg-info";
				if (keyItem.indexOf("TCP") < 0 && keyItem.indexOf("UDP") < 0)
				{
					strTdStyle_1 = "width:400px;";
					strTdStyle_2 = "width:100px;";
					
					if (strIpFromParent == undefined)
						strIpFromParent = "";
					keyItem = '<ul style="margin:0;padding:0;list-style:none;"><li style="width:200px;float:left;">' + strIpFromParent + '</li><li style="width:100px;float:left;">' + keyItem + '</li>' + strProcessType + "</ul>";  // 此处修改key，无妨
				}
				else
				{
					strTdStyle_1 = "width:100px;";
					strTdStyle_2 = "width:220px;";
				}
			}
			else
				strTdStyle_1 = "width:120px;";
			
			strHtml += '<tr>';
			if (strType != undefined && strType.length > 0)
				strHtml += 	'<td class="v-al-md" style="width:50px;">' + strType + '</td>';
			strHtml += 		'<td class="v-al-md" style="'+strTdStyle_1+'">';
			strHtml +=			DisplayFriendly(keyItem);
			strHtml += 		'</td>';
			if (strDirection.length > 0)
			strHtml += 		'<td class="v-al-md" style="width:50px;">' + strDirection + '</td>';
			if (strDirection.length > 0)
				;//strHtml +=	'<td class="v-al-md" style="">' + strIp + '</td>';
			strHtml += 		'<td class="'+strTdClass+'" style="'+strTdStyle_2+'">';
			strHtml +=			strContentHtml;
			strHtml += 		'</td>';
			strHtml += '</tr>';
		}
	}
	strHtml += '</table>';
	return strHtml;
}
function Generate_RuleItemHtml_RuleWINDOW(jsonRuleItem, strType)
{
	var i = 0;
	var strHtml = "";
	var i_Rule = 0;
	
	strHtml += '<table class="table table-condensed table-bordered table-my-add" style="width:100%;padding:0;word-break:break-all;">';
	for (i_Rule = 0; i_Rule < jsonRuleItem.length; i_Rule ++)  // 此循环兼容数组与对象
	{
		var jsonRuleItem_Item = jsonRuleItem[i_Rule];
		
		{
			var strProcessPath = jsonRuleItem_Item["ProcessName"];
			var strContentHtml = "";
			var strTdClass = "";
			var strTdStyle_1 = "";
			var strTdStyle_2 = "";
			var strProcessChildType = "";
			var nProcessChildType = parseInt(jsonRuleItem_Item["ProcessChildType"]);
			
			strContentHtml = Generate_RuleItemHtml_RuleWINDOW_WindowProp(jsonRuleItem_Item["CwWindowProp"]);
			
			if (nProcessChildType & 1)
				strProcessChildType += " 本进程";
			if (nProcessChildType & 2)
				strProcessChildType += " 子进程";
			if (nProcessChildType & 4)
				strProcessChildType += " 不注入";
			if (nProcessChildType & 8)
				strProcessChildType += " 后关闭";
			if (nProcessChildType & 16)
				strProcessChildType += " 只隐藏";
			if (nProcessChildType & 32)
				strProcessChildType += " 加退出";
			
			if (strContentHtml.indexOf("<table") < 0)
			{
				strTdClass = "bs-bg-info";
				if (keyItem.indexOf("TCP") < 0 && keyItem.indexOf("UDP") < 0)
				{
					strTdStyle_1 = "width:400px;";
					strTdStyle_2 = "width:100px;";
				}
				else
				{
					strTdStyle_1 = "width:100px;";
					strTdStyle_2 = "width:220px;";
				}
			}
			else
				strTdStyle_1 = "width:120px;";
			
			strHtml += '<tr>';
			strHtml += 		'<td class="v-al-md" style="'+strTdStyle_1+'">';
			strHtml +=			DisplayFriendly(strProcessPath);
			strHtml += 		'</td>';
			strHtml += 		'<td class="v-al-md" style="">' + strProcessChildType + '</td>';
			strHtml += 		'<td class="v-al-md" style="">延时' + jsonRuleItem_Item["StartDelay"] + '秒</td>';
			strHtml += 		'<td class="'+strTdClass+'" style="'+strTdStyle_2+'">';
			strHtml +=			strContentHtml;
			strHtml += 		'</td>';
			strHtml += '</tr>';
		}
	}
	strHtml += '</table>';
	return strHtml;
}
function Generate_RuleItemHtml_RuleWINDOW_WindowProp(jsonRuleItem, strType)
{
	var i = 0;
	var strHtml = "";
	var i_Rule = 0;
	
	strHtml += '<table class="table table-condensed table-bordered table-my-add" style="width:100%;padding:0;word-break:break-all;">';
	for (i_Rule = 0; i_Rule < jsonRuleItem.length; i_Rule ++)  // 此循环兼容数组与对象
	{
		var jsonRuleItem_Item = jsonRuleItem[i_Rule];
		
		{
			var strTdClass = "";
			var strTdStyle = "";
			var arKeyArray = Object__keys(jsonRuleItem_Item);
			
			strTdStyle = "width:"+String(Math.floor(100/arKeyArray.length))+"%;";
			
			strHtml += '<tr>';
			for (var i_Prop = 0; i_Prop < arKeyArray.length; i_Prop ++)
			{
				var keyItem = arKeyArray[i_Prop];
				var valueItem = jsonRuleItem_Item[keyItem];
				
				if (keyItem == "ClassName")
					valueItem = "类名: " + valueItem;
				if (keyItem == "WindowText")
					valueItem = "标题: " + valueItem;
				if (keyItem == "Width")
					valueItem = "宽度: " + valueItem;
				if (keyItem == "Height")
					valueItem = "高度: " + valueItem;
				strHtml += 		'<td class="v-al-md" style="'+strTdStyle+'">';
				strHtml +=			DisplayFriendly(valueItem);
				strHtml += 		'</td>';
			}
			strHtml += '</tr>';
		}
	}
	strHtml += '</table>';
	return strHtml;
}
function Generate_RuleItem_ContentHtml(valueItem)
{
		var i = 0;
		var strContentHtml = "";
		
		if (valueItem.constructor == Number)
			return String(valueItem);
		else if (valueItem.constructor == String)
		{
			if (valueItem.indexOf("noRead") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁读</span>';
			if (valueItem.indexOf("noWrite") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁写</span>';
			if (valueItem.indexOf("noExecute") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁执行</span>';
			if (valueItem.indexOf("noCreate") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁创建</span>';
			if (valueItem.indexOf("noOpen") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁打开</span>';
			if (valueItem.indexOf("NoOpen") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁打开</span>';
			if (valueItem.indexOf("NoKill") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁关闭</span>';
			if (valueItem.indexOf("NoSuspend") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁挂起</span>';
			if (valueItem.indexOf("NoWMOP") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁读写</span>';
			if (valueItem.indexOf("noDelete") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁删除</span>';
			if (valueItem.indexOf("HideProc180615") >= 0)
				strContentHtml += '<span style="margin-right:3px;">隐藏进程</span>';
			if (valueItem.indexOf("SuspendChildProc") >= 0)
				strContentHtml += '<span style="margin-right:3px;">挂子进程</span>';
			if (valueItem.indexOf("KillChildProc") >= 0)
				strContentHtml += '<span style="margin-right:3px;">关子进程</span>';
			if (valueItem.indexOf("SuspendProc") >= 0)
				strContentHtml += '<span style="margin-right:3px;">挂进程</span>';
			if (valueItem.indexOf("KillProc") >= 0)
				strContentHtml += '<span style="margin-right:3px;">关进程</span>';
			if (valueItem.indexOf("ProtectProc") >= 0)
				strContentHtml += '<span style="margin-right:3px;">保护</span>';
			else if (valueItem.indexOf("Hide") >= 0)
				strContentHtml += '<span style="margin-right:3px;">隐藏</span>';
			if (valueItem.indexOf("noThread") >= 0)
				strContentHtml += '<span style="margin-right:3px;">禁止注入</span>';
			if (valueItem.indexOf("WhitePass") >= 0)
				strContentHtml += '<span style="margin-right:3px;">白名单</span>';
			if (valueItem.indexOf("LevelEnable_Self") >= 0)
				strContentHtml += '<span class="blue_font" style="margin-right:3px;">本进程</span>';
			if (valueItem.indexOf("LevelEnable_Child") >= 0)
				strContentHtml += '<span class="blue_font" style="margin-right:3px;">子进程</span>';
			if (strContentHtml.length == 0)
				strContentHtml = valueItem;
		}
		else if (valueItem.constructor == Array)
		{
				for (i = 0; i < valueItem.length; i ++)
					strContentHtml += Generate_RuleItem_ContentHtml(valueItem[i]) + " ";
		}
		else
				strContentHtml = DisplayFriendly(String(valueItem));
		return strContentHtml;
}

function AddInputRow_DirItem(strItemTableName)
{	
		var i = 0;
		var strHtml_Row = "";
		var strItemTableName_Prefix = strItemTableName;
		var strItem_Name_Current = strItemTableName;
		
		// 确定当前规则子项数目
		var nItemCount = GetRuleTable_RuleItemCount(strItemTableName);
		if (nItemCount < 1)
			return;
		
		// 列ID和项目序号没有直接关系，列ID是乱的，不能直接用项目序号当做列ID
		var nLastTrIdIndex = GetInputRow_LastTrIdIndex(strItemTableName);
		if (nLastTrIdIndex == 0)
			return;
		
		strItem_Name_Previous = strItemTableName_Prefix + "_" + String(nLastTrIdIndex);
		strItem_Name_Current = strItemTableName_Prefix + "_" + String(nLastTrIdIndex + 1);

		strHtml_Row += '<tr id="'+strItem_Name_Current+'">';
		strHtml_Row += 		$('#'+strItem_Name_Previous).html();
		strHtml_Row += 	'</tr>';
		strHtml_Row = strHtml_Row.replace(eval("/"+strItem_Name_Previous+"/g"), strItem_Name_Current);
		
		// 单独处理规则类型的单选按钮，ID和NAME必须不同
		strHtml_Row = strHtml_Row.replace(eval("/_"+String(nLastTrIdIndex)+"_type/g"), "_"+String(nLastTrIdIndex+1)+"_type");
		
		// 清除复选框的选择状态
		strHtml_Row = strHtml_Row.replace(/\schecked/g, "");
		strHtml_Row = strHtml_Row.replace(/\schecked=""/g, "");
		strHtml_Row = strHtml_Row.replace(/\schecked="checked"/g, "");
		
//		strHtml_Row += '<tr id="'+strItem_Name_Current+'">';
//		strHtml_Row += 		'<td style="width:210px;">';
//		strHtml_Row += 				'<input type="text" id="'+strItem_Name_Current+'_DirPath" style="width:200px;" />';
//		strHtml_Row += 				'<input type="radio" id="'+strItem_Name_Current+'_DirPath_FILE" style="" />文件';
//		strHtml_Row += 				'<input type="radio" id="'+strItem_Name_Current+'_DirPath_DIR" style="margin-left:3px;" />目录';
//		strHtml_Row += 				'<input type="radio" id="'+strItem_Name_Current+'_DirPath_FULL_PATH" style="margin-left:3px;" />全路径';
//		strHtml_Row += 				'<input type="radio" id="'+strItem_Name_Current+'_DirPath_MD5" style="margin-left:3px;" />MD5';
//		strHtml_Row += 		'</td>';
//		strHtml_Row += 		'<td>';
//		strHtml_Row += 			'<input type="checkbox" value="noRead" style="" />禁读';
//		strHtml_Row += 			'<input type="checkbox" value="noRead" style="margin-left:5px;" />禁写';
//		strHtml_Row += 			'<input type="checkbox" value="noRead" style="margin-left:5px;" />禁执行';
//		strHtml_Row += 			'<input type="hidden" id="'+strItem_Name_Current+'_Control" value="" />';
//		strHtml_Row += 		'</td>';
//		strHtml_Row += 		'<td style="width:50px;">';
// 		strHtml_Row += 			'<img src="../web/Public/js/jquery-easyui/themes/icons/edit_add.png" onclick="AddInputRow_DirItem(\''+strItemTableName+'\');" style="margin-right:5px;"/>';
// 		strHtml_Row += 			'<img src="../web/Public/js/jquery-easyui/themes/icons/edit_remove.png" onclick="DeleteInputRow_DirItem(\''+strItem_Name_Current+'\');"/>';
//		strHtml_Row += 		'</td>';
//		strHtml_Row += 	'</tr>';
 		$('#'+strItemTableName).append(strHtml_Row);
}
function GetRuleTable_RuleItemCount(strItemTableName)
{
		var nItemCount = $('#' + strItemTableName + " > * > tr").length - 1;
		return nItemCount;
}
function DeleteInputRow_DirItem(strItem_Name)
{
		// 不能删除最后一个
		var strItemTableName = strItem_Name.substr(0, strItem_Name.lastIndexOf("_"));
		var nItemCount = $('#' + strItemTableName + " > * > tr").length              - 1;
		// 最后一行只清空内容不删除，保留控件
		if (nItemCount == 1)
		{
			Clear_EditRuleDialog_Row(strItem_Name);
			return;
		}
		$('#' + strItem_Name).remove();
}
function Show_RuleItem_Input_Str(strRuleItem, strTableName)
{
	var jsonRuleItem = null;
	try {
		jsonRuleItem = jQuery.parseJSON(strRuleItem)
	}
	catch (e) {
		return strRuleItem;
	}
	if (strTableName == "RuleIP")
		return Show_RuleItem_Input_RuleIP(jsonRuleItem, strTableName, true);
	else if (strTableName == "RuleWINDOW")
		return Show_RuleItem_Input_RuleWINDOW(jsonRuleItem, strTableName, true);
	else
		return Show_RuleItem_Input(jsonRuleItem, strTableName);
}
function Show_RuleItem_Input(jsonRuleItem, strTableName)
{
	var i = 0;
	
	for (var keyItem in jsonRuleItem)
	{
		i ++;
		var valueItem = jsonRuleItem[keyItem];

		// 先加入新的空行才能填写前一行，否则不存在没被输入过的行
		AddInputRow_DirItem(strTableName);
		
		// 列ID和项目序号没有直接关系，列ID是乱的，不能直接用项目序号当做列ID
		var nLastTrIdIndex = GetInputRow_LastTrIdIndex(strTableName);
		if (nLastTrIdIndex == 0)
			return;
			
		// 因为刚添加了一列，所以后两列的序号肯定是连续的
		var strTrId = strTableName + "_" + String(nLastTrIdIndex - 1);
		var strSub_TableId = strTrId + "_DirItem";
		
		Show_RuleItem_Input_ShowContent(keyItem, strTrId, true);
		
		if (valueItem.constructor != Object)
			Show_RuleItem_Input_ShowContent(valueItem, strTrId, false);
		else
			Show_RuleItem_Input(valueItem, strSub_TableId);
	}
	// 删除多加的一个空行
	if (i > 0)
		$('#' + strTableName + ' > * > tr:last-child').remove();
}
function Show_RuleItem_Input_RuleIP(jsonRuleItem, strTableName, bRemoveLastTr)
{
	var i = 0;
	var strIp = "";
	var strDirection = "";
	
	// 网络规则的第一层是数组
	if (jsonRuleItem.constructor == Array)
	{
		for (i = 0; i < jsonRuleItem.length; i ++)
			Show_RuleItem_Input_RuleIP(jsonRuleItem[i], strTableName, false);
		if (bRemoveLastTr)
		{
			// 删除多加的一个空行
			if (i > 0)
				$('#' + strTableName + ' > * > tr:last-child').remove();
		}
		return;
	}
	
	if (jsonRuleItem.constructor == Object)
	{
		var jsonSub_1 = jsonRuleItem[Object__keys(jsonRuleItem)[0]];
		if (jsonSub_1 != undefined && jsonSub_1.constructor == Object)  // 如果还有两层就是存在IP层，也就是方向为出的层次
		{
			// 只能有两层，第三层必须不为对象
			var jsonSub_2 = jsonSub_1[Object__keys(jsonSub_1)[0]];
			if ( jsonSub_2 != undefined && jsonSub_2.constructor == Array
				&& (jsonSub_2.length == 0 || jsonSub_2[0].constructor != Object)  )
			{
				strIp = Object__keys(jsonRuleItem)[0];
				jsonRuleItem = jsonSub_1;  // 整个对象从此处开始被修改为其子对象
				strDirection = "out";
			}
		}
		else if ( jsonSub_1 != undefined && jsonSub_1.constructor == Array
				&& (jsonSub_1.length == 0 || jsonSub_1[0].constructor != Object)  )  // 进方向对象少一层
			strDirection = "in";
	}
	
	// 进
	if (jsonRuleItem.constructor == Object && jsonRuleItem["level"] != undefined)
	{
		// 先加入新的空行才能填写前一行，否则不存在没被输入过的行
		AddInputRow_DirItem(strTableName);
			var nLastTrIdIndex_TT = GetInputRow_LastTrIdIndex(strTableName);
			var strTrId_TT = strTableName + "_" + String(nLastTrIdIndex_TT - 1);
			for (var keyItem_Leaf in jsonRuleItem)
			{
				if (keyItem_Leaf == "tcp" || keyItem_Leaf == "udp")
				{
					Show_RuleItem_Input_ShowContent_RuleIP(keyItem_Leaf, strTrId_TT, false, 0);
					Show_RuleItem_Input_ShowContent_RuleIP(jsonRuleItem[keyItem_Leaf], strTrId_TT, false, 1);
				}
				else  // level
					Show_RuleItem_Input_ShowContent_RuleIP(jsonRuleItem[keyItem_Leaf], strTrId_TT, false, 0);
			}
			
			//if (strDirection == "in")
			if ($('#'+strTrId_TT).parent().parent().parent().parent().find('td:eq(1) > select').val() == "in")
				$('#'+strTrId_TT+' td:eq(0) > input:text').prop('disabled', true);
				
		if (bRemoveLastTr)
		{
			// 删除多加的一个空行
			//if (i > 0)
				$('#' + strTableName + ' > * > tr:last-child').remove();
		}
			return;
	}
	
	for (var keyItem in jsonRuleItem)
	{
		i ++;
		var valueItem = jsonRuleItem[keyItem];

		// 先加入新的空行才能填写前一行，否则不存在没被输入过的行
		AddInputRow_DirItem(strTableName);
		
		// 列ID和项目序号没有直接关系，列ID是乱的，不能直接用项目序号当做列ID
		var nLastTrIdIndex = GetInputRow_LastTrIdIndex(strTableName);
		if (nLastTrIdIndex == 0)
			return;
			
		// 因为刚添加了一列，所以后两列的序号肯定是连续的
		var strTrId = strTableName + "_" + String(nLastTrIdIndex - 1);
		var strSub_TableId = strTrId + "_DirItem";
		
		Show_RuleItem_Input_ShowContent_RuleIP(keyItem, strTrId, true, (strDirection.length > 0 ? 1 : 0));
		
		if (i == 1)
		{
			if (strIp.length > 0)
				Show_RuleItem_Input_ShowContent_RuleIP(strIp, strTrId, true);  // 显示IP放到此处
			if (strDirection == "in")
				$('#'+strTrId+' td:eq(0) > input:text').prop('disabled', true);
		}
		
		var jsonSub = null;
		
		if (valueItem["in"] != undefined || valueItem["out"] != undefined)
		{
			var strDirection = "out";
			if (valueItem["in"] != undefined)
				strDirection = "in";
			$('#'+strTrId).find('td:eq(1) > select').val(strDirection);  // 显示方向
			if (valueItem["in"] != undefined)
				jsonSub = valueItem[strDirection];
			else
				jsonSub = valueItem[strDirection]; //20190412 //valueItem[strDirection][0];
		}
		else
			jsonSub = valueItem;

		if (jsonSub.constructor == Array)
		{
			for (var ii_Ip = 0; ii_Ip < jsonSub.length; ii_Ip ++)
			{
			if (jsonSub[ii_Ip] == null)
				continue;
			if (jsonSub[ii_Ip].constructor != Object)
				Show_RuleItem_Input_ShowContent_RuleIP(jsonSub[ii_Ip], strTrId, false, 1);
			else
				Show_RuleItem_Input_RuleIP(jsonSub[ii_Ip], strSub_TableId, (ii_Ip == jsonSub.length - 1));
			}
		}
		else
		{
			if (jsonSub.constructor != Object)
				Show_RuleItem_Input_ShowContent_RuleIP(jsonSub, strTrId, false, 1);
			else
			{
					for (var keyItem_Leaf in jsonSub)
					{
						if (keyItem_Leaf == "tcp" || keyItem_Leaf == "udp")
						{
							Show_RuleItem_Input_ShowContent_RuleIP(keyItem_Leaf, strTrId, false, 0);
							Show_RuleItem_Input_ShowContent_RuleIP(jsonSub[keyItem_Leaf], strTrId, false, 1);
						}
						else  // level
							Show_RuleItem_Input_ShowContent_RuleIP(jsonSub[keyItem_Leaf], strTrId, false, 0);
					}
			}
		}
	}
	if (bRemoveLastTr)
	{
		// 删除多加的一个空行
		if (i > 0)
			$('#' + strTableName + ' > * > tr:last-child').remove();
	}
}
function Show_RuleItem_Input_RuleWINDOW(jsonRuleItem, strTableName)
{
	var i = 0;
	var arHiddenArray = $('#'+strTableName+' > * > tr:eq(0) > td:eq(3) > input:hidden');
	
	$(arHiddenArray[0]).val(jsonRuleItem["CheckProcessTimespan"]);
	$(arHiddenArray[1]).val(jsonRuleItem["CheckProcessTime"]);
	$(arHiddenArray[2]).val(jsonRuleItem["CheckProcessStartDelay"]);
	
	jsonRuleItem = jsonRuleItem["CwRule"];  // 此处开始修改整个对象！！
	
	for (i = 0; i < jsonRuleItem.length; i ++)
	{
		var jsonRuleItem_Item = jsonRuleItem[i];
		var strProcessName = jsonRuleItem_Item["ProcessName"];
		var strProcessChildType = jsonRuleItem_Item["ProcessChildType"];
		var nProcessChildType = parseInt(strProcessChildType);

		// 先加入新的空行才能填写前一行，否则不存在没被输入过的行
		AddInputRow_DirItem(strTableName);
		
		// 列ID和项目序号没有直接关系，列ID是乱的，不能直接用项目序号当做列ID
		var nLastTrIdIndex = GetInputRow_LastTrIdIndex(strTableName);
		if (nLastTrIdIndex == 0)
			return;
			
		// 因为刚添加了一列，所以后两列的序号肯定是连续的
		var strTrId = strTableName + "_" + String(nLastTrIdIndex - 1);
		var strSub_TableId = strTrId + "_DirItem";
		
		$('#'+strTrId+' > td:eq(2) > input:text').val(strProcessName);
		$('#'+strTrId+' > td:eq(1) > input:text').val(jsonRuleItem_Item["StartDelay"]);
		$('#'+strTrId+' > td:eq(0) > input:checkbox').each(function(){
			var bChecked = (0 != (nProcessChildType & parseInt($(this).val())));
			$(this).prop('checked', bChecked);
		});
		
		Show_RuleItem_Input_RuleWINDOW_CwWindowProp(jsonRuleItem_Item["CwWindowProp"], strSub_TableId);
	}
	// 删除多加的一个空行
	if (i > 0)
		$('#' + strTableName + ' > * > tr:last-child').remove();
}
function Show_RuleItem_Input_RuleWINDOW_CwWindowProp(jsonRuleItem, strTableName)
{
	var i = 0;
	
	for (i = 0; i < jsonRuleItem.length; i ++)
	{
		var jsonRuleItem_Item = jsonRuleItem[i];
		// 先加入新的空行才能填写前一行，否则不存在没被输入过的行
		AddInputRow_DirItem(strTableName);
		
		// 列ID和项目序号没有直接关系，列ID是乱的，不能直接用项目序号当做列ID
		var nLastTrIdIndex = GetInputRow_LastTrIdIndex(strTableName);
		if (nLastTrIdIndex == 0)
			return;
		// 因为刚添加了一列，所以后两列的序号肯定是连续的
		var strTrId = strTableName + "_" + String(nLastTrIdIndex - 1);
		
		$('#'+strTrId+' > td:eq(0) > input:text').val(jsonRuleItem_Item["ClassName"]);
		$('#'+strTrId+' > td:eq(1) > input:text').val(jsonRuleItem_Item["WindowText"]);
		$('#'+strTrId+' > td:eq(2) > input:text').val(jsonRuleItem_Item["Width"]);
		$('#'+strTrId+' > td:eq(3) > input:text').val(jsonRuleItem_Item["Height"]);
		$('#'+strTrId+' > td:eq(4) > input:text').val(jsonRuleItem_Item["clct"]);
		$('#'+strTrId+' > td:eq(5) > input:text').val(jsonRuleItem_Item["sl"]);
	}
	// 删除多加的一个空行
	if (i > 0)
		$('#' + strTableName + ' > * > tr:last-child').remove();
}
function Show_RuleItem_Input_ShowContent(valueItem, strTrId, bIsKeyOrContent)
{
		var i = 0;
		var strContent = "";
		
		if (valueItem.constructor == Array)
		{
				for (i = 0; i < valueItem.length; i ++)
					Show_RuleItem_Input_ShowContent(valueItem[i], strTrId, bIsKeyOrContent);
				return;
		}
		
		var nTdIndex = 0;
		if (bIsKeyOrContent)
			nTdIndex = 0;
		else
			nTdIndex = 1;
		
		var tCheckBoxArray = $('#'+strTrId + " td:eq("+String(nTdIndex)+") input:checkbox");
		var tRadioArray = $('#'+strTrId + " td:eq("+String(nTdIndex)+") input:radio");
		var tInputTextBox = $('#'+strTrId + " td:eq("+String(nTdIndex)+") input:text");
		
		if (tCheckBoxArray != undefined)
			for (i = 0; i < tCheckBoxArray.length; i++)
				if ($(tCheckBoxArray[i]).val() == String(valueItem))  // 之前已经清空过窗口，现在只需显示有内容的元素
					$(tCheckBoxArray[i]).prop('checked', $(tCheckBoxArray[i]).val() == String(valueItem));
		if (tRadioArray != undefined)
			for (i = 0; i < tRadioArray.length; i++)
					$(tRadioArray[i]).prop('checked', $(tRadioArray[i]).val() == String(valueItem));
					
		if (tInputTextBox != undefined)
			$(tInputTextBox).val($(tInputTextBox).val() + DisplayFriendly(String(valueItem)) + " ");
}
function Show_RuleItem_Input_ShowContent_RuleIP(valueItem, strTrId, bIsKeyOrContent, nBeginTdIndex)
{
		var i = 0;
		var strContent = "";
		
		if (valueItem.constructor == Array)
		{
				for (i = 0; i < valueItem.length; i ++)
					Show_RuleItem_Input_ShowContent_RuleIP(valueItem[i], strTrId, bIsKeyOrContent, nBeginTdIndex);
				return;
		}
		
		if (nBeginTdIndex == undefined)
			nBeginTdIndex = 0;
		var nTdIndex = nBeginTdIndex;
		if (bIsKeyOrContent)
			nTdIndex = nBeginTdIndex;
		else
			nTdIndex = nBeginTdIndex + 1;
		
		var tCheckBoxArray = $('#'+strTrId + " td:eq("+String(nTdIndex)+") input:checkbox");
		var tRadioArray = $('#'+strTrId + " td:eq("+String(nTdIndex)+") input:radio");
		var tInputTextBox = $('#'+strTrId + " td:eq("+String(nTdIndex)+") input:text");
		
//		if (tCheckBoxArray != undefined)
//			for (i = 0; i < tCheckBoxArray.length; i++)
//				if ($(tCheckBoxArray[i]).val() == String(valueItem))  // 之前已经清空过窗口，现在只需显示有内容的元素
//					$(tCheckBoxArray[i]).prop('checked', $(tCheckBoxArray[i]).val() == String(valueItem));
					
		if (valueItem == "tcp" || valueItem == "udp")
		{
		if (tRadioArray != undefined)
			for (i = 0; i < tRadioArray.length; i++)
					$(tRadioArray[i]).prop('checked', $(tRadioArray[i]).val() == String(valueItem));
		}
					
		if (tInputTextBox != undefined)
			$(tInputTextBox).val($(tInputTextBox).val() + DisplayFriendly(String(valueItem)) + " ");
		
		if (valueItem != "tcp" && valueItem != "udp")
		{
		if (tCheckBoxArray != undefined)
			for (i = 0; i < tCheckBoxArray.length; i++)
					$(tCheckBoxArray[i]).prop('checked', 0 != (parseInt($(tCheckBoxArray[i]).val()) & parseInt(String(valueItem))));
		}
}
function GetInputRow_LastTrIdIndex(strItemTableName)
{
		var nItemCount = GetRuleTable_RuleItemCount(strItemTableName);
		if (nItemCount == 0)
			return 0;
		
		// 列ID和项目序号没有直接关系，列ID是乱的，不能直接用项目序号当做列ID
		var strItem_Name_Previous = $('#' + strItemTableName + " > * > tr:eq("+String(nItemCount-1+1)+")").prop('id');
		if (strItem_Name_Previous == undefined)
			return 0;
		var strLastTrIdIndex = strItem_Name_Previous.substr(strItem_Name_Previous.lastIndexOf("_")+1);
		if (! Valid_Int(strLastTrIdIndex))
			return 0;
		return parseInt(strLastTrIdIndex);
}
function Clear_EditRuleDialog()
{
	var i = 0;
	var strParentName = "";
	
	if (g_bAdvMode)
		strParentName = "divRuleItem_Adv";
	else
		strParentName = "divRuleItemTab";
	var tTableArray = $('#'+strParentName+' table');
	
	if (! g_bAdvMode)
		for (i = 0; i < tTableArray.length; i ++)
			$(tTableArray[i]).children().children('tr:gt(1)').remove();
			
	$('#'+strParentName+' table input:text').val('');
	$('#'+strParentName+' table input:radio').prop('checked', false);
	$('#'+strParentName+' table input:checkbox').prop('checked', false);
	
	$('#divRuleItem_Adv table textarea').val('');
	$('#divRuleItemTab table textarea').val('');
	
	$('#tblEditRuleDialog input:text').val('');
	$('#tblEditRuleDialog input:radio').prop('checked', false);
	$('#tblEditRuleDialog input:checkbox').prop('checked', false);
}
function Clear_EditRuleDialog_Row(strParentId)
{
	$('#'+strParentId+' input:text').val('');
	$('#'+strParentId+' input:radio').prop('checked', false);
	$('#'+strParentId+' input:checkbox').prop('checked', false);
}
// 输入有误返回false, 无数据返回null, 有数据返回JSON对象
function GetEditRule_Json_Item_RuleIP(strTableId, strAlertMsgHeader)
{
	var i = 0;
	var kk = 0;
	var json_Top = new Array;
	var jsonItem = {};
	var nFieldCount = 0;
	var tItemTrArray = $('#'+strTableId+' > * > tr:gt(0)');
	var strValueColumnIndex = "1";
	var bIs_2nd_Depth = false;
	
	bIs_2nd_Depth = (strTableId.indexOf("_DirItem") > 0);  // 递归第二层Table ID都带_DirItem
	if (strAlertMsgHeader == "网络规则" && ! bIs_2nd_Depth)
		strValueColumnIndex = "2";
		
	//<<<20190411改为一个进程项支持多个IP
					var arArrayValue_Ip = new Array();
	//>>>
	
	for (i = 0; i < tItemTrArray.length; i ++)
	{
		var strKey = "";
		var objValue = null;
		// 键
		{
			var tInputTextBox = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(0) > input:text");
			// 键没有复选框
			//var tCheckBoxArray = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(0) > input:checkbox:checked");
			var tRadio_Checked = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(0) > input:radio:checked");
			
			if (tInputTextBox.length > 0)
			{
				strKey = $.trim($(tInputTextBox[0]).val());
				if (strTableId.indexOf("RuleIP") < 0)
					strKey = AddFileSlash(strKey);
			}
			else if (tRadio_Checked.length > 0)
				strKey = $.trim($(tRadio_Checked[0]).val());
		}
		// 值
		var tValueObject_Table = $('#'+$(tItemTrArray[i]).prop('id') + ' > td:eq('+strValueColumnIndex+') > table');
		var bIsValueObject = (tValueObject_Table.length == 1);
		if (bIsValueObject)
			objValue = GetEditRule_Json_Item_RuleIP($(tValueObject_Table).prop('id'), strAlertMsgHeader);
		else
		{
			var tInputTextBox = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+strValueColumnIndex+") > input:text");
			var tCheckBoxArray = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+strValueColumnIndex+") > input:checkbox:checked");
			// 值没有单选框
			//var tRadio_Checked = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+strValueColumnIndex+") > input:radio:checked");
			
			// 网络规则特殊处理，加方向对象
			if (strAlertMsgHeader == "网络规则" && bIs_2nd_Depth)
			{
				// 先取上级空间的方向
				var strDirection = $('#'+$(tItemTrArray[i]).parent().parent().parent().parent().prop('id') + " > td:eq(1) > select").val();  // 两层：有一层tbody
				var strIp = strKey;  // 总的KEY此时为IP，方向的值实际上才是总的KEY
				strKey = strDirection;  // 交换值
				// 进方向的规则不用输IP
				if (strDirection == "out")
				{
	//<<<20190411改为一个进程项支持多个IP
					//var arArrayValue_Ip = new Array();
	//>>>
					var tRadio_Checked = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(1) > input:radio:checked");
					var tCheckBox_Checked = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(1) > input:checkbox:checked");
					
					if (strIp.length > 0)
					{
						var jsonIp_Item = {};
						var objValue_Ip_Item = null;  // 当前网络简化为，数组只有一项目
						
						if (tRadio_Checked.length > 0)
						{
							var strProtocol = $(tRadio_Checked[0]).val();
							var strPort_List = $.trim($('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(2) > input:text").val());
							var arPort_Array = new Array();
							var jsonValue_Ip_Item = {};  // 当前网络简化为，数组只有一项目
							
							//<<<
							var nSelfAndChildren = 0;
							for (var nnn = 0; nnn < tCheckBox_Checked.length; nnn ++)
								nSelfAndChildren += parseInt($(tCheckBox_Checked[nnn]).val());
							if (nSelfAndChildren == 0)
								nSelfAndChildren = 1;
							jsonValue_Ip_Item["level"] = nSelfAndChildren;
							//>>>
							
							strPort_List = strPort_List.replace(/\s\s/g, " ");
							if (strPort_List.length > 0)
							{
								if (strPort_List.indexOf(" ") >= 0)
									arPort_Array = strPort_List.split(" ");
								else
									arPort_Array.push(strPort_List);
								
								jsonValue_Ip_Item[strProtocol] = arPort_Array;
								
								objValue_Ip_Item = jsonValue_Ip_Item;
							}
						}
						
						if (! checkinput_Rule_KeyValue(strIp, objValue_Ip_Item))
						{
							if (strAlertMsgHeader.length > 0)
					      $.messager.alert('提示', strAlertMsgHeader+"的规则输入不正确！请检查输入");
					    return false;
						}
						
						jsonIp_Item[strIp] = objValue_Ip_Item;
						arArrayValue_Ip.push(jsonIp_Item);
						
						objValue = arArrayValue_Ip;
					}
				}
				else
				{
					var tRadio_Checked = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(1) > input:radio:checked");
					var tCheckBox_Checked = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(1) > input:checkbox:checked");
					
					var jsonIp_Item = {};
					var objValue_Ip_Item = null;  // 当前网络简化为，数组只有一项目
					
					if (tRadio_Checked.length > 0)
					{
						var strProtocol = $(tRadio_Checked[0]).val();
						var strPort_List = $.trim($('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(2) > input:text").val());
						var arPort_Array = new Array();
						var jsonValue_Ip_Item = {};  // 当前网络简化为，数组只有一项目
							
							//<<<
							var nSelfAndChildren = 0;
							for (var nnn = 0; nnn < tCheckBox_Checked.length; nnn ++)
								nSelfAndChildren += parseInt($(tCheckBox_Checked[nnn]).val());
							if (nSelfAndChildren == 0)
								nSelfAndChildren = 1;
							jsonValue_Ip_Item["level"] = nSelfAndChildren;
							//>>>
						
						strPort_List = strPort_List.replace(/\s\s/g, " ");
						if (strPort_List.length > 0)
						{
							if (strPort_List.indexOf(" ") >= 0)
								arPort_Array = strPort_List.split(" ");
							else
								arPort_Array.push(strPort_List);
							
							jsonValue_Ip_Item[strProtocol] = arPort_Array;
							objValue_Ip_Item = jsonValue_Ip_Item;
						}
						// 放到里边，因为少一层
						if (! checkinput_Rule_KeyValue(strProtocol, objValue_Ip_Item))
						{
							if (strAlertMsgHeader.length > 0)
					      $.messager.alert('提示', strAlertMsgHeader+"的规则输入不正确！请检查输入");
					    return false;
						}
					}
					
					jsonIp_Item = objValue_Ip_Item;  // 没有IP，直接赋值
						arArrayValue_Ip.push(jsonIp_Item);
						
						objValue = arArrayValue_Ip;		
					//objValue = jsonIp_Item;
				}
			}
			// 暂不管，其他所有情况都放在一起
			else
			{
				var arValueArray = new Array();
				
				if (tInputTextBox.length > 0)
				{
					var strInputText = $.trim($(tInputTextBox[0]).val());
					strInputText = strInputText.replace(/\s\s/g, " ");
					if (strInputText.indexOf(" ") >= 0)
						arValueArray = strInputText.split(" ");
					else if (strInputText.length > 0)
					{
						if (strTableId.indexOf("RuleIP") < 0)
							strInputText = AddFileSlash(strInputText);
						arValueArray.push(AddFileSlash(strInputText));
					}
				}
				else if (tCheckBoxArray.length > 0)
				{
					for (kk = 0; kk < tCheckBoxArray.length; kk ++)
						arValueArray.push($.trim($(tCheckBoxArray[kk]).val()));
				}
				if (arValueArray.length > 0)
					objValue = arValueArray;
			}
		}
		
		
				if (   (objValue == false)
				|| (strKey.length > 0 && (objValue == null || objValue == undefined))
				|| (strKey.length == 0 && (objValue != null && objValue != undefined && Object__keys(objValue).length > 0))
				)
				{
					if (strKey != "in" && strKey != "out")  // 方向的SELECT必定有值
					{
					if (strAlertMsgHeader.length > 0)
			      $.messager.alert('提示', strAlertMsgHeader+"的规则输入不正确！请检查输入");
			    return false;
			  	}
				}
				else if (strKey.length > 0 && (objValue != null && objValue != undefined))
				{
					// 检查重复的键值
					if (strKey != "in" && strKey != "out")
					{
					for (var keyItem_CheckIdentical in jsonItem)
					{
						if (keyItem_CheckIdentical.toLowerCase() == strKey.toLowerCase())
						{
							if (strAlertMsgHeader.length > 0)
					      $.messager.alert('提示', strAlertMsgHeader+"的规则输入有重复项——"+strKey+"！请检查输入");
					    return false;
						}
					}
					}
					
					if (strTableId == "RuleIP")  // 顶层
					{
						var json__Temp = {};
						json__Temp[strKey] = objValue;
						json_Top.push(json__Temp);
					}
					else
						jsonItem[strKey] = objValue;
				}
		
			nFieldCount ++;
	}
	
	if (strTableId == "RuleIP")  // 顶层
		jsonItem = json_Top;
		
	if (Object__keys(jsonItem).length == 0)
		return null;
	if (nFieldCount == 0)
		return null;  // 返回null表示无输入
	return jsonItem;
}
// 输入有误返回false, 无数据返回null, 有数据返回JSON对象
function GetEditRule_Json_Item_RuleWINDOW(strTableId, strAlertMsgHeader)
{
	var json_CwRule = GetEditRule_Json_Item_RuleWINDOW_Internal(strTableId, strAlertMsgHeader);
	if (json_CwRule == false || json_CwRule == null)
		return json_CwRule;
	var json = {};
	var arHiddenArray = $('#'+strTableId+' > * > tr:eq(0) > td:eq(4) > input:hidden');
	
	json["CheckProcessTimespan"] = $(arHiddenArray[0]).val();
	json["CheckProcessTime"] = $(arHiddenArray[1]).val();
	json["CheckProcessStartDelay"] = $(arHiddenArray[2]).val();
	json["CwRule"] = json_CwRule;
	return json;
}
function GetEditRule_Json_Item_RuleWINDOW_Internal(strTableId, strAlertMsgHeader)
{
	var i = 0;
	var kk = 0;
	var json_Top = new Array;
	var nFieldCount = 0;
	var tItemTrArray = $('#'+strTableId+' > * > tr:gt(0)');
	var col = 2;
	for (i = 0; i < tItemTrArray.length; i ++)
	{
		var jsonItem = {};
		var json_CwWindowProp = null;
		var n_ProcessChildType = 0;  // 不能设1，后边要相加
		var str_ProcessChildType = "1";  // 默认本进程
		var str_ProcessName = "";
		var str_StartDelay = "2";
		
		var tInputTextBox_ProcessName = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+String(col)+") > input:text");
		str_ProcessName = $.trim($(tInputTextBox_ProcessName[0]).val());
		
		var tCheckBox_ProcessChild_Arrray = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(0) > input:checkbox:checked");
		$(tCheckBox_ProcessChild_Arrray).each(function(){
			n_ProcessChildType += parseInt($(this).val());
		});
		if ((n_ProcessChildType & 16) && (n_ProcessChildType & 8) == 0)
			n_ProcessChildType += 8;
		str_ProcessChildType = String(n_ProcessChildType);
		
		var tInputTextBox_StartDelay = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(1) > input:text");
		str_StartDelay = $.trim($(tInputTextBox_StartDelay[0]).val());
		
		var tCwWindowProp_Table = $("#"+$(tItemTrArray[i]).prop('id') + " > td:eq("+String(col+1)+") > table");
		json_CwWindowProp = GetEditRule_Json_Item_RuleWINDOW_WindowProp($(tCwWindowProp_Table).prop('id'), strAlertMsgHeader);
		
		if (json_CwWindowProp == false)
		{
			if (strAlertMsgHeader.length > 0)
	      $.messager.alert('提示', strAlertMsgHeader+"的规则输入不正确——窗口属性输入不正确！请检查输入");
	    return false;
		}
		if (str_ProcessChildType.length == 0 && str_ProcessName.length == 0)
			return null;
		if (	str_ProcessChildType.length == 0
			&& (/*json_CwWindowProp != null || */str_ProcessName.length > 0)  )  // 窗口属性对象不可能为空
		{
			if (strAlertMsgHeader.length > 0)
	      $.messager.alert('提示', strAlertMsgHeader+"的规则输入有误——子进程类型单选按钮不能为空！请检查输入");
	    return false;
		}
		if (	str_ProcessName.length == 0
			&& (/*json_CwWindowProp != null || */str_ProcessChildType.length > 0)  )
		{
		// 有些二笔！！
//			if (strAlertMsgHeader.length > 0)
//	      $.messager.alert('提示', strAlertMsgHeader+"的规则输入有误——进程路径不能为空！请检查输入");
//	    return false;
				continue;
		}
		// 实际上此情况不会发生
		if (	json_CwWindowProp == null
			&& (str_ProcessName.length > 0 || str_ProcessChildType.length > 0)  )
		{
			if (strAlertMsgHeader.length > 0)
	      $.messager.alert('提示', strAlertMsgHeader+"的规则输入有误——窗口属性不能为空！请检查输入");
	    return false;
		}
		if (! Valid_Int(str_StartDelay))
		{
			if (strAlertMsgHeader.length > 0)
	      $.messager.alert('提示', strAlertMsgHeader+"的规则输入不正确——延时必须输入整数！请检查输入");
	    return false;
		}
		
		jsonItem["ProcessName"] = str_ProcessName;
		jsonItem["ProcessChildType"] = parseInt(str_ProcessChildType);
		jsonItem["StartDelay"] = parseInt(str_StartDelay);
		jsonItem["CwWindowProp"] = json_CwWindowProp;

		json_Top.push(jsonItem);
		nFieldCount ++;
	}
	
	if (nFieldCount == 0)
		return null;  // 返回null表示无输入
	return json_Top;
}
function GetEditRule_Json_Item_RuleWINDOW_WindowProp(strTableId, strAlertMsgHeader)
{
	var i = 0;
	var kk = 0;
	var json_Top = new Array;
	var jsonItem = {};
	var nFieldCount = 0;
	var tItemTrArray = $('#'+strTableId+' > * > tr:gt(0)');
	for (i = 0; i < tItemTrArray.length; i ++)
	{
		var json__WindowProp = {};
		var strInputText_1 = $.trim($('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(0) > input:text").val());
		var strInputText_2 = $.trim($('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(1) > input:text").val());
		var strInputText_3 = $.trim($('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(2) > input:text").val());
		var strInputText_4 = $.trim($('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(3) > input:text").val());
		var strInputText_5 = $.trim($('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(4) > input:text").val());
		var strInputText_6 = $.trim($('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(5) > input:text").val());
		
		if (strInputText_3.length == 0)
			strInputText_3 = "0";
		if (strInputText_4.length == 0)
			strInputText_4 = "0";
		if (strInputText_5.length == 0)
			strInputText_5 = "0";
		if (strInputText_6.length == 0)
			strInputText_6 = "0";
//		if (! Valid_Int(strInputText_3))
//		{
//				if (strAlertMsgHeader.length > 0)
//		      $.messager.alert('提示', strAlertMsgHeader+"的规则输入不正确——窗口宽度必须为正整数或0！请检查输入");
//		    return false;
//		}
//		if (! Valid_Int(strInputText_4))
//		{
//				if (strAlertMsgHeader.length > 0)
//		      $.messager.alert('提示', strAlertMsgHeader+"的规则输入不正确——窗口高度必须为正整数或0！请检查输入");
//		    return false;
//		}
		json__WindowProp["ClassName"] = strInputText_1;
		json__WindowProp["WindowText"] = strInputText_2;
		json__WindowProp["Width"] = strInputText_3;
		json__WindowProp["Height"] = strInputText_4;
		json__WindowProp["clct"] = strInputText_5;
		json__WindowProp["sl"] = strInputText_6;
		
		json_Top.push(json__WindowProp);
		nFieldCount ++;
	}
	
	if (nFieldCount == 0)
		return null;  // 返回null表示无输入
	return json_Top;
}
function checkinput_Rule_KeyValue(strKey, objValue)
{
		if (   (objValue == false)
				|| (strKey.length > 0 && (objValue == null || objValue == undefined))
				|| (strKey.length == 0 && (objValue != null && objValue != undefined))
				)
	    return false;
	  return true;
}

// 输入有误返回false, 无数据返回null, 有数据返回JSON对象
function GetEditRule_Json_Item(strTableId, strAlertMsgHeader)
{
	var i = 0;
	var kk = 0;
	var jsonItem = {};
	var nFieldCount = 0;
	var tItemTrArray = $('#'+strTableId+' > * > tr:gt(0)');
	var col = 0;
	for (i = 0; i < tItemTrArray.length; i ++)
	{
		var strKey = "";
		var objValue = null;
		
//		var tRadio_Type_Arrray = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq(0) > input:radio");
//		// 区分合并的
//		if (tRadio_Type_Arrray.length > 0)
//		{
//			col = 1;
//			if (   (strAlertMsgHeader == "文件规则" && ! $(tRadio_Type_Arrray[0]).prop('checked'))
//			   	|| (strAlertMsgHeader == "MD5规则"  && ! $(tRadio_Type_Arrray[1]).prop('checked'))   )
//			   	continue;
//			if (   (strAlertMsgHeader == "注册表规则" && ! $(tRadio_Type_Arrray[0]).prop('checked'))
//			   	|| (strAlertMsgHeader == "注册表MD5规则" && ! $(tRadio_Type_Arrray[1]).prop('checked'))   )
//			   	continue;
//		}

		
		// 键
		{
			var tInputTextBox = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+String(col)+") > input:text");
			// 键没有复选框
			//var tCheckBoxArray = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+String(col)+") > input:checkbox:checked");
			var tRadio_Checked = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+String(col)+") > input:radio:checked");
			
			if (tInputTextBox.length > 0)
			{
				strKey = $.trim($(tInputTextBox[0]).val());
				if (strTableId.indexOf("RuleIP") < 0)
					strKey = AddFileSlash(strKey);
			}
			else if (tRadio_Checked.length > 0)
				strKey = $.trim($(tRadio_Checked[0]).val());
		}
		// 值
		var tValueObject_Table = $("#"+$(tItemTrArray[i]).prop('id') + " > td:eq("+String(col+1)+") > table");
		var bIsValueObject = (tValueObject_Table.length == 1);
		if (bIsValueObject)
			objValue = GetEditRule_Json_Item($(tValueObject_Table).prop('id'), strAlertMsgHeader);
		else
		{
			var tInputTextBox = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+String(col+1)+") > input:text");
			var tCheckBoxArray = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+String(col+1)+") > input:checkbox:checked");
			// 值没有单选框
			//var tRadio_Checked = $('#'+$(tItemTrArray[i]).prop('id') + " > td:eq("+String(col+1)+") > input:radio:checked");
			
			var arValueArray = new Array();
			
			if (tInputTextBox.length > 0)
			{
				var strInputText = $.trim($(tInputTextBox[0]).val());
				strInputText = strInputText.replace(/\s\s/g, " ");
				if (strInputText.indexOf(" ") >= 0)
					arValueArray = strInputText.split(" ");
				else if (strInputText.length > 0)
				{
					if (strTableId.indexOf("RuleIP") < 0)
						strInputText = AddFileSlash(strInputText);
					arValueArray.push(AddFileSlash(strInputText));
				}
			}
			else if (tCheckBoxArray.length > 0)
			{
				for (kk = 0; kk < tCheckBoxArray.length; kk ++)
					arValueArray.push($.trim($(tCheckBoxArray[kk]).val()));
			}
			if (arValueArray.length > 0)
				objValue = arValueArray;
		}
		
		if (   (objValue == false)
				|| (strKey.length > 0 && (objValue == null || objValue == undefined))
				|| (strKey.length == 0 && (objValue != null && objValue != undefined && objValue != {}))
				)
		{
			if (strAlertMsgHeader.length > 0)
	      $.messager.alert('提示', strAlertMsgHeader+"的规则输入不正确！请检查输入");
	    return false;
		}
		else if (strKey.length > 0 && (objValue != null && objValue != undefined))
		{
			// 检查重复的键值
			for (var keyItem_CheckIdentical in jsonItem)
			{
				if (keyItem_CheckIdentical.toLowerCase() == strKey.toLowerCase())
				{
					if (strAlertMsgHeader.length > 0)
			      $.messager.alert('提示', strAlertMsgHeader+"的规则输入有重复项——"+strKey+"！请检查输入");
			    return false;
				}
			}
			
			jsonItem[strKey] = objValue;
			nFieldCount ++;
		}
	}
	
	if (nFieldCount == 0)
		return null;  // 返回null表示无输入
	return jsonItem;
}
function RuleItem_Json_To_Str(jsonRuleItem)
{
	if (jsonRuleItem == false || jsonRuleItem == null || jsonRuleItem == undefined)
		return "";
	return JSON.stringify(jsonRuleItem);
}
function GetEditRule_QueryString()
{
	var strQueryString = "";
//	var jsonPE = GetEditRule_Json_Item('RulePE_1_DirItem', "文件规则");
//	var jsonDIR = GetEditRule_Json_Item('RuleDIR', "目录规则");
//	var jsonMD5 = GetEditRule_Json_Item('RuleMD5_1_DirItem', "MD5规则");
// 函数内部使用规则中文名区分
// 三合一
//	var jsonPE = GetEditRule_Json_Item('RuleDIR', "文件规则");
	var jsonDIR = GetEditRule_Json_Item('RuleDIR', "目录规则");
	//var jsonMD5 = GetEditRule_Json_Item('RuleDIR', "MD5规则");
// 二合一
	var jsonREG = GetEditRule_Json_Item('RuleREG', "注册表规则");
	//var jsonREGMD5 = GetEditRule_Json_Item('RuleREG', "注册表MD5规则");
	var jsonIP = GetEditRule_Json_Item_RuleIP('RuleIP', "网络规则");
	var jsonWINDOW = GetEditRule_Json_Item_RuleWINDOW('RuleWINDOW', "窗口规则");
	var jsonAntiThread = GetEditRule_Json_Item('RuleAntiThread', "线程注入规则");
	if (   
			//jsonPE == false
			//|| 
			jsonDIR == false
			//|| jsonMD5 == false
			|| jsonREG == false
			//|| jsonREGMD5 == false
			|| jsonIP == false
			|| jsonWINDOW == false
			|| jsonAntiThread == false
		)
		return "";
	if (   
			//jsonPE == null
			//&& 
			jsonDIR == null
			//&& jsonMD5 == null
			&& jsonREG == null
			//&& jsonREGMD5 == null
			&& jsonIP == null
			&& jsonWINDOW == null
			&& jsonAntiThread == null
		)
	{
	  $.messager.alert('提示', "请至少输入一个规则！");
		return "";
	}
	var strDIR = RuleItem_Json_To_Str(jsonDIR);
	var strREG = RuleItem_Json_To_Str(jsonREG);
	var strIP = RuleItem_Json_To_Str(jsonIP);
	var strWINDOW = RuleItem_Json_To_Str(jsonWINDOW);
	var strAntiThread = RuleItem_Json_To_Str(jsonAntiThread);
	
	if (strDIR.length > 10000)
	{
    $.messager.alert('错误','目录规则最大长度为10000个字符，请重新输入！');
		return "";
	}
	if (strREG.length > 10000)
	{
    $.messager.alert('错误','注册表规则最大长度为10000个字符，请重新输入！');
		return "";
	}
	if (strIP.length > 10000)
	{
    $.messager.alert('错误','网络规则最大长度为10000个字符，请重新输入！');
		return "";
	}
	if (strWINDOW.length > 10000)
	{
    $.messager.alert('错误','窗口规则最大长度为10000个字符，请重新输入！');
		return "";
	}
	if (strAntiThread.length > 10000)
	{
    $.messager.alert('错误','线程注入规则最大长度为10000个字符，请重新输入！');
		return "";
	}
	
	//strQueryString += "&PE=" + encodeURIComponent(RuleItem_Json_To_Str(jsonPE));
	strQueryString += "&DIR=" + encodeURIComponent(strDIR);
	//strQueryString += "&MD5=" + encodeURIComponent(RuleItem_Json_To_Str(jsonMD5));
	strQueryString += "&REG=" + encodeURIComponent(strREG);
	//strQueryString += "&MD5_REG=" + encodeURIComponent(RuleItem_Json_To_Str(jsonREGMD5));
	strQueryString += "&IP=" + encodeURIComponent(strIP);
	strQueryString += "&CtrlWnd=" + encodeURIComponent(strWINDOW);
	strQueryString += "&AntiThread=" + encodeURIComponent(strAntiThread);
	return strQueryString;
}
function CopyRule()
{
	if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中待复制的规则！');
		return;
	}
	$('#CopyRule_assign_rule__default_group').prop('checked', true);
	$("#divCopyRuleDialog").dialog('center');
	$("#divCopyRuleDialog").dialog('open');
}
function Submit_CopyRule()
{
	var assign_to = 1;
	if ($('#CopyRule_assign_rule__default_group').prop('checked'))
		assign_to = 1;
	if ($('#CopyRule_assign_rule__all_group').prop('checked'))
		assign_to = 2;
	if ($('#CopyRule_assign_rule__none_group').prop('checked'))
		assign_to = 0;
	$.messager.confirm('确认操作','您确定要复制此规则吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "rule_mng/copy_rule/AdRule_id/" + g_strRuleId_Selected + "/assign_to/" + String(assign_to),
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','复制规则失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '复制规则失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "复制规则成功！");
			      $('#divCopyRuleDialog').dialog('close');
			      
			      // 复制规则不用更新显示
			      //func_GetAllRule();
			    }
			});
		}
	});
}
function AddFileSlash(str)
{
	var i = 0;
	
	if (str.indexOf("\\") == 0)
		return str;
	
	// 全路径返回原字符串
	if (str.indexOf(":") == 1)
		return str;
		
	if (str.indexOf("*") == 0)
		return str;
	
	// MD5直接原字符串
	var strLower = str.toLowerCase();
	for (i = 0; i < strLower.length; i ++)
	{
		if (   (strLower[i] < 'a' || strLower[i] > 'f')
				&& (strLower[i] < '0' || strLower[i] > '9') )
				break;
	}
	if (i == strLower.length)
		return str;
		
	return "\\" + str;
}

function UpdateSharedRule(strRuleId)
{
	$('#UpdateRule__AdRule_id').val(strRuleId);
	$('#divUpdateRuleDialog').dialog('center');
	$('#divUpdateRuleDialog').dialog('open');
}
function Submit_UpdateRule()
{
	$.messager.confirm('确认操作','您确定更新此规则吗？',function(bYes){   
		if (bYes)
		{
			$('#divUpdateRuleDialog').dialog('close');
			$.ajax({
			    type: "GET",
			    url: "rule_mng/update_shared_rule",
			    data: $("#frmUpdateRule").serialize(),
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','更新规则失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '复制规则失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "更新规则成功！");
			      
			      // 更新显示
			      func_GetAllRule();
			    }
			});
		}
	});
}
// 按选中的网络方向，切换界面
function Change_RuleIP_Direction(sender)
{
	var tInputTextBox_Ip = $("#" + $(sender).parent().parent().prop("id") + " > td:eq(2) > table > * > tr:gt(0)").find("td:eq(0) > input:text");  // 直接一次选择器取不到
	$(tInputTextBox_Ip).prop("disabled", ($(sender).val() == "in"));
}
// 此函数有可能被父页面调用
function GetHavenotAssignedRuleCount(bCallFromParentWindow)
{
	if (g_AgentID == 0)  // 管理员不用检查这个
		return;
			
	var strQuery = "ModuleParam=" + g_strModuleParam;
	if (! bCallFromParentWindow)
	{
	 	if (g_AgentID_ToDisplay.length > 0)
	 		strQuery += "&AgentID_ToDisplay=" + g_AgentID_ToDisplay;
 	}
 		
	$.ajax({
	    type: "GET",
	    url: "rule_mng/get_havenot_assigned_rule_count",
	    data: strQuery,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取未分配的规则数失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取未分配的规则数失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	   		
	   		if (jsonResult.szData == undefined || jsonResult.szData == null)
	   		{
	      	$.messager.alert('错误', '获取未分配的规则数时返回错误数据');
	      	return;
	   		}
	   		nCount_HavenotAssignedRule = parseInt(MyJsonDecode(jsonResult.szData));
	   		if (nCount_HavenotAssignedRule == 0)
	   			$("#spnMsg").html('');
	   		else
	   		{
	      	$("#spnMsg").html('温馨提示：您的规则中存在'+String(nCount_HavenotAssignedRule)+'条未经分配的规则，未经分配规则不会生效！');
	      	$("#spnMsg2").html('温馨提示：您的规则中存在'+String(nCount_HavenotAssignedRule)+'条未经分配的规则，未经分配规则不会生效！');
	      }
	    }
	});
}
function ShowShareRuleToSpecifiedAgentDialog()
{
	var strOp = "insert_rule";
	var strOpName = "新增";
	
	$('#ShareRuleToSpecifiedAgent__agent_id_share_to').val(0);
	
	{
		if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
		{
			$.messager.alert('错误','请先选中待共享的规则！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllRule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllRule[i].Id);
	 		if (strId == g_strRuleId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllRule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#ShareRuleToSpecifiedAgent__AdRule_id').val(g_strRuleId_Selected);
	}
	$('#divShareRuleToSpecifiedAgentDialog').dialog('center');
	$('#divShareRuleToSpecifiedAgentDialog').dialog('open');
}
function Submit_ShareRuleToSpecifiedAgent()
{
	if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中待共享的规则！');
		return;
	}
	$.messager.confirm('确认操作','您确定要共享此规则到指定用户吗？',function(bYes){   
		if (bYes)
		{
			if (! checkinput_ShareRuleToSpecifiedAgent())
				return;
			$.ajax({
			    type: "GET",
			    url: "rule_mng/share_rule_to_specified_agent/AdRule_id/" + g_strRuleId_Selected + "/agent_id_share_to/" + $('#ShareRuleToSpecifiedAgent__agent_id_share_to').val(),
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','共享规则到指定用户失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '共享规则到指定用户失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "共享规则到指定用户成功！");
						$("#divShareRuleToSpecifiedAgentDialog").dialog('close');
			      
			      // 复制规则不用更新显示
			      //func_GetAllRule();
			    }
			});
		}
	});
}
function checkinput_ShareRuleToSpecifiedAgent()
{
	var agent_id_share_to = $('#ShareRuleToSpecifiedAgent__agent_id_share_to').val();
	if (agent_id_share_to == 0)
	{
  	$.messager.alert('错误','请选择待复制到的目标用户！');
    return false;
	}
	return true;
}





function ShowShareRuleToMany_AgentDialog()
{
	var strOp = "insert_rule";
	var strOpName = "新增";
	
	$('#ShareRuleToMany_Agent__agent_id_share_to').val(0);
	
	{
		if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
		{
			$.messager.alert('错误','请先选中待共享的规则！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllRule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllRule[i].Id);
	 		if (strId == g_strRuleId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllRule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#ShareRuleToMany_Agent__AdRule_id').val(g_strRuleId_Selected);
	}
	$('#divShareRuleToMany_AgentDialog').dialog('center');
	$('#divShareRuleToMany_AgentDialog').dialog('open');
}
function Submit_ShareRuleToMany_Agent()
{
	if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中待共享的规则！');
		return;
	}
	$.messager.confirm('确认操作','您确定要共享此规则到大量用户吗？',function(bYes){   
		if (bYes)
		{
			if (! checkinput_ShareRuleToMany_Agent())
				return;
			$.ajax({
			    type: "POST",
			    url: "rule_mng/share_rule_to_many__Agent",
			    data: "AdRule_id=" + g_strRuleId_Selected + "&agent_id_share_to__list=" + $('#ShareRuleToMany_Agent__agent_id_share_to__list').val(),
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','共享规则到指定用户失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '共享规则到指定用户失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "共享规则到指定用户成功！");
						$("#divShareRuleToMany_AgentDialog").dialog('close');
			      
			      // 复制规则不用更新显示
			      //func_GetAllRule();
			    }
			});
		}
	});
}
function checkinput_ShareRuleToMany_Agent()
{
	var agent_id_share_to__list = $('#ShareRuleToMany_Agent__agent_id_share_to__list').val();
	if (agent_id_share_to__list.length == 0)
	{
  	$.messager.alert('错误','请输入待复制到的目标用户列表！');
    return false;
	}
	return true;
}

function Generate_BkRuleHtml(bk_id_list, bk_desc_list)
{
	var i = 0;
	var strHtml = "";
	var arIdListArray = bk_id_list.split("_");
	var arDescArray = bk_desc_list.split("_#_");
	if (arIdListArray.length != arDescArray.length)
		return;
	
	strHtml += '<ul style="list-style:none;margin:0;padding:0;">';
	for (i = 0; i < arIdListArray.length; i ++)
	{
		if (arIdListArray[i] == null || arIdListArray[i].length == 0)
			continue;
		strHtml += '<li style="">';
		strHtml += '<a href="#" onclick="RestoreRule('+arIdListArray[i]+',\''+arDescArray[i]+'\');">'+arDescArray[i]+'</a>';
		strHtml += '<a href="#" onclick="Delete_RuleBk('+arIdListArray[i]+',\''+arDescArray[i]+'\');"><img src="../../web/Public/js/jquery-easyui/themes/icons/clear.png"></a>';
		strHtml += '</li>';
	}
	strHtml += '<li style="clear:both;"></li>';
	strHtml += "<ul>";
	return strHtml;
}

function RestoreRule(adrule_id, strBkDesc)
{
	$.messager.confirm('确认操作','您确定要将规则恢复到还原点('+strBkDesc+')吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "rule_mng/restore_rule/AdRule_id/" + adrule_id,
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','恢复规则失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '恢复规则失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "恢复规则成功！");
			      
			      func_GetAllRule();
			    }
			});
		}
	});
}
function Delete_RuleBk(adrule_bk_id, strBkDesc)
{
	$.messager.confirm('确认操作','您确定要删除所选的规则还原点('+strBkDesc+')吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "rule_mng/delete_rule/AdRule_id/" + adrule_bk_id,
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除规则还原点失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除规则还原点失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除规则还原点成功！");
			      
			      func_GetAllRule();
			    }
			});
		}
	});
}



function Submit_ShareRuleToAll_Agent()
{
	if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中待共享的规则！');
		return;
	}
	$.messager.confirm('确认操作','您确定要共享此规则到《所有》用户吗？',function(bYes){   
		if (bYes)
		{
			//if (! checkinput_ShareRuleToAll_Agent())
			//	return;
			$.ajax({
			    type: "POST",
			    url: "rule_mng/share_rule_to_all__Agent",
			    data: "AdRule_id=" + g_strRuleId_Selected,
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','共享规则到所有用户失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '共享规则到所有用户失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "共享规则到所有用户成功！");
			      // 复制规则不用更新显示
			    }
			});
		}
	});
}


function ShowDeleteShareRuleToMany_AgentDialog()
{
	var strOp = "insert_rule";
	var strOpName = "新增";
	
	{
		if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
		{
			$.messager.alert('错误','请先选中待删除推送的共享规则！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllRule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllRule[i].Id);
	 		if (strId == g_strRuleId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllRule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#DeleteShareRuleToMany_Agent__AdRule_id').val(g_strRuleId_Selected);
		
			$.ajax({
			    type: "GET",
			    url: "rule_mng/get_shared_rule_assigned_agent_list",
			    data: "AdRule_id=" + g_strRuleId_Selected,
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','获取共享规则的已推送用户列表失败！详细：数据错误');
			        return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '获取未分配的规则数失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			   		
			   		if (jsonResult.szData == undefined || jsonResult.szData == null)
			   		{
			      	$.messager.alert('错误', '获取未分配的规则数时返回错误数据');
			      	return;
			   		}
			   		
			     	var tAgentName_Info = jsonResult.szData;
			     	
			     	var strAgentNameList = '';
			     	if (tAgentName_Info != '')
			     	for (i = 0; i < tAgentName_Info.length; i ++)
			     		strAgentNameList += MyJsonDecode(tAgentName_Info[i].AgentName) + ';';
			     	$('#DeleteShareRuleToMany_Agent__agent_id_share_to__list').val(strAgentNameList);
			    }
			});
	}
	$('#divDeleteShareRuleToMany_AgentDialog').dialog('center');
	$('#divDeleteShareRuleToMany_AgentDialog').dialog('open');
}
function Submit_DeleteShareRuleToMany_Agent()
{
	if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中待删除的规则推送！');
		return;
	}
	$.messager.confirm('确认操作','您确定要删除对指定用户的规则推送吗？',function(bYes){   
		if (bYes)
		{
			if (! checkinput_DeleteShareRuleToMany_Agent())
				return;
			$.ajax({
			    type: "POST",
			    url: "rule_mng/delete_share_rule_to_many__agent",
			    data: "AdRule_id=" + g_strRuleId_Selected + "&agent_id_share_to__list=" + $('#DeleteShareRuleToMany_Agent__agent_id_share_to__list').val(),
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除规则推送失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除规则推送！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除规则推送成功！");
						$("#divShareRuleToMany_AgentDialog").dialog('close');
			      
			      // 复制规则不用更新显示
			      //func_GetAllRule();
			    }
			});
		}
	});
}
function checkinput_DeleteShareRuleToMany_Agent()
{
	var agent_id_share_to__list = $('#DeleteShareRuleToMany_Agent__agent_id_share_to__list').val();
	if (agent_id_share_to__list.length == 0)
	{
  	$.messager.alert('错误','请输入待删除推送的目标用户列表！');
    return false;
	}
	return true;
}

function Switch_Rule_EnableAd(adrule_id)
{
	var i = 0;
	var strTd_Text = $('#trRule_' + String(adrule_id) + ' td:eq(2)').text();
	var nEnableAd = strTd_Text=='启用'? 0 : 1;
	
	$.messager.confirm('确认操作','您确定要-'+(nEnableAd==1?'启':'禁')+'用-所选规则吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "rule_mng/update_rule_field/AdRule_id/" + String(adrule_id)+"/f/EnableAd/v/"+String(nEnableAd),
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','操作失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '操作失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "操作成功！");
			      
			      $('#trRule_' + String(adrule_id) + ' td:eq(2)').html(nEnableAd==1?'启用':'<span class="red_font">禁用</span>');
			      
					 	for (i = 0; i < g_AllRule.length; i ++)
					 	{
					 		var strId = MyJsonDecode(g_AllRule[i].Id);
					 		if (strId == adrule_id)
					 			break;
					 	}
					 	if (i >= g_AllRule.length)
					 	{
							$.messager.alert('错误','数据错误，请联系管理人员修正！');
							return;
						}
						g_AllRule[i].EnableAd = StringToHex(String(nEnableAd));
				}
			});
		}
	});
}

function Switch_Rule_IsShare(adrule_id)
{
	var i = 0;
	var strTd_Text = $('#trRule_' + String(adrule_id) + ' td:eq(3)').text();
	var nIsShare = strTd_Text=='是'? 0 : 1;
	
	$.messager.confirm('确认操作','您确定要-'+(nIsShare==1?'共享':'取消共享')+'-所选规则吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "rule_mng/update_rule_field/AdRule_id/" + String(adrule_id)+"/f/IsShare/v/"+String(nIsShare),
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','操作失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '操作失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "操作成功！");
			      
			      $('#trRule_' + String(adrule_id) + ' td:eq(3)').html(nIsShare==1?'是':'否');
			      
					 	for (i = 0; i < g_AllRule.length; i ++)
					 	{
					 		var strId = MyJsonDecode(g_AllRule[i].Id);
					 		if (strId == adrule_id)
					 			break;
					 	}
					 	if (i >= g_AllRule.length)
					 	{
							$.messager.alert('错误','数据错误，请联系管理人员修正！');
							return;
						}
						g_AllRule[i].IsShare = StringToHex(String(nIsShare));
				}
			});
		}
	});
}

function Switch_Rule_is_hide(adrule_id)
{
	var i = 0;
	var strTd_Text = $('#trRule_' + String(adrule_id) + ' td:eq(4)').text();
	var nis_hide = strTd_Text=='可见'? 1 : 0;
	
	$.messager.confirm('确认操作','您确定要-'+(nis_hide==1?'隐藏':'取消隐藏')+'-所选规则吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "rule_mng/update_rule_field/AdRule_id/" + String(adrule_id)+"/f/is_hide/v/"+String(nis_hide),
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','操作失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '操作失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "操作成功！");
			      
			      $('#trRule_' + String(adrule_id) + ' td:eq(4)').html(nis_hide==1?'<span class="blue_font">隐藏</span>':'可见');
			      
					 	for (i = 0; i < g_AllRule.length; i ++)
					 	{
					 		var strId = MyJsonDecode(g_AllRule[i].Id);
					 		if (strId == adrule_id)
					 			break;
					 	}
					 	if (i >= g_AllRule.length)
					 	{
							$.messager.alert('错误','数据错误，请联系管理人员修正！');
							return;
						}
						g_AllRule[i].is_hide = StringToHex(String(nis_hide));
				}
			});
		}
	});
}


	
function ShowUpdateAllCopyedFromThisRule_AgentDialog()
{
	var strOp = "insert_rule";
	var strOpName = "新增";
	
	{
		if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
		{
			$.messager.alert('错误','请先选中待更新所有复制的共享规则！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllRule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllRule[i].Id);
	 		if (strId == g_strRuleId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllRule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#UpdateAllCopyedFromThisRule_Agent__AdRule_id').val(g_strRuleId_Selected);
		
			$.ajax({
			    type: "GET",
			    url: "rule_mng/get_shared_rule_assigned_agent_2_list",
			    data: "AdRule_id=" + g_strRuleId_Selected,
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','获取共享规则的已推送用户列表失败！详细：数据错误');
			        return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '获取未分配的规则数失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			   		
			   		if (jsonResult.szData == undefined || jsonResult.szData == null)
			   		{
			      	$.messager.alert('错误', '获取未分配的规则数时返回错误数据');
			      	return;
			   		}
			   		
			     	var strAgentName_List = MyJsonDecode(jsonResult.szData);

			     	$('#UpdateAllCopyedFromThisRule_Agent__agent_id_share_to__list').val(strAgentName_List);
			    }
			});
	}
	$('#divUpdateAllCopyedFromThisRule_AgentDialog').dialog('center');
	$('#divUpdateAllCopyedFromThisRule_AgentDialog').dialog('open');
}
function Submit_UpdateAllCopyedFromThisRule_Agent()
{
	if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中待更新的源头规则！');
		return;
	}
	$.messager.confirm('确认操作','您确定更新所有复制自此规则的规则吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "POST",
			    url: "rule_mng/update_all_copyed_from_this_rule/AdRule_id/" + g_strRuleId_Selected,
			    data: "agent_id_share_to__list=" + $('#UpdateAllCopyedFromThisRule_Agent__agent_id_share_to__list').val(),
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','更新所有复制规则失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '更新所有复制规则失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "更新所有复制规则成功，"+MyJsonDecode(jsonResult.szMsg)+"！");
			      // 不用更新显示
			    }
			});
		}
	});
}
function checkinput_UpdateAllCopyedFromThisRule_Agent()
{
	var agent_id_share_to__list = $('#UpdateAllCopyedFromThisRule_Agent__agent_id_share_to__list').val();
	if (agent_id_share_to__list.length == 0)
	{
  	$.messager.alert('错误','请输入待更新所有复制的目标用户列表！');
    return false;
	}
	return true;
}
// function UpdateAllCopyedFromThisRule()
// {
	// if (g_strRuleId_Selected == null || g_strRuleId_Selected == undefined || g_strRuleId_Selected == 0)
	// {
		// $.messager.alert('错误','请先选中待更新的源头规则！');
		// return;
	// }
	// $.messager.confirm('确认操作','您确定更新所有复制自此规则的规则吗？',function(bYes){   
		// if (bYes)
		// {
			// $.ajax({
			    // type: "GET",
			    // url: "rule_mng/update_all_copyed_from_this_rule/AdRule_id/" + g_strRuleId_Selected,
			    // data: '',
			    // success: function (result) {
			    	// var strHtml = "";
			    	// result = RemoveDebugInfoInJsonResult(result);
			    	// if (result.length == 0)
			      // {
			      	// $.messager.alert('错误','更新所有复制规则失败！详细：数据错误');
			        	// return;
			   		// }
			    	// var jsonResult = jQuery.parseJSON(result);
			    	// if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      // {
			      	// strMsg = '更新所有复制规则失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	// $.messager.alert('错误', strMsg);
			        	// return;
			   		// }
			      // $.messager.alert('提示', "更新所有复制规则成功，"+MyJsonDecode(jsonResult.szMsg)+"！");
			      ////不用更新显示
			    // }
			// });
		// }
	// });
// }