
var g_AllModule = null;
var g_AllAgent = null;
var g_AllSharedRule = null;
var g_strModuleId_Selected = "";
var g_bUpdateOrInsert = true;

var g_strOrderBy = "0";
var g_nEscDesc = 0;

jQuery(document).ready(function() {
	func_Get();
	$("#divEditModuleDialog").show();
	$("#divEditModuleDialog").dialog('center');
	$("#divEditModuleDialog").dialog('close');
	$("#divAssignToAgentListDialog").show();
	$("#divAssignToAgentListDialog").dialog('center');
	$("#divAssignToAgentListDialog").dialog('close');
	$("#divUnassignToAgentListDialog").show();
	$("#divUnassignToAgentListDialog").dialog('center');
	$("#divUnassignToAgentListDialog").dialog('close');
	$("#divHavntAssignModule_AgentList_Dialog").show();
	$("#divHavntAssignModule_AgentList_Dialog").dialog('center');
	$("#divHavntAssignModule_AgentList_Dialog").dialog('close');
	
	if (g_AgentID > 0)
		$("#run_time_segment").hide();
	
	$('#divModuleList').css('height', $(window).height() - 70);
});
var func_Get = function Get()
{
	func_GetAllModule();
}
var func_GetAllModule = function GetAllModule()
{
	var strMsg = "";
	var nItemCount = 0;
	var i = 0;
	g_strModuleId_Selected = "";
	var strQuery = "";
	
 	strQuery += "order="+g_strOrderBy+"&orderesc="+String(g_nEscDesc);
 	
 	strQuery += "&ModuleParam="+g_strModuleParam;
	
 	if (g_AgentID_ToDisplay.length > 0)
 		strQuery += "&AgentID_ToDisplay=" + g_AgentID_ToDisplay;
	$.ajax({
	    type: "GET",
	    url: "module_mng/get_all_module",
	    data: strQuery,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取模块信息失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取模块信息失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取模块信息失败！详细：数据错误');
	          	return;
	     	}
	     	g_AllModule = jsonResult.szData.tAllModule;
	     	g_AllAgent = jsonResult.szData.tAllAgent;
	    	if (g_AgentID == 0)
				g_AllSharedRule = jsonResult.szData.tAllSharedRule;
	     	var strHtml = "";
	     	
	     	strHtml = "";
	     	for (i = 0; i < g_AllAgent.length; i ++)
		      strHtml += '<option value="'+MyJsonDecode(g_AllAgent[i].AgentID)+'">'+MyJsonDecode(g_AllAgent[i].AgentName)+'</option>';
	    	$('#EditModule__AgentID').html($('#EditModule__AgentID').html() + strHtml);
	    	
	    	if (g_AgentID == 0)
				{
					strHtml = "";
					strHtml += '<option value="0">请选择......</option>';
	     		for (i = 0; i < g_AllSharedRule.length; i ++)
	     		{
						strHtml += '<option value="'+MyJsonDecode(g_AllSharedRule[i].Id)+'">';
						strHtml += 		MyJsonDecode(g_AllSharedRule[i].AgentName) + ' - ' + MyJsonDecode(g_AllSharedRule[i].AdName);
						strHtml += '</option>';
	     		}
	    		$('#EditModule__relational_rule_id').html(strHtml);
				}
					    	
	    	strHtml = "";
	     	for (i = 0; i < g_AllModule.length; i ++)
	     	{
	     		var strModuleId = MyJsonDecode(g_AllModule[i].Id);
	     		var strAgentId = MyJsonDecode(g_AllModule[i].AgentID);
	     		var strAgentName = MyJsonDecode(g_AllModule[i].AgentName);
	     		if (MyJsonDecode(g_AllModule[i].AgentID) == 0)
	     			strAgentName = "振创网络";
	     		var strAgentVisible = "";
	     		var agent_visible = MyJsonDecode(g_AllModule[i].agent_visible);
	     		if (agent_visible == 0)
	     			strAgentVisible = "管";
	     		else if (agent_visible == 1)
	     			strAgentVisible = '<span class="blue_font">全体</span>';
	     		else if (agent_visible == 2)
	     			strAgentVisible = '<span class="red_font">管 市</span>';
	     		else if (agent_visible == 4)
	     			strAgentVisible = '<span class="blue_font">全体只读</span>';
	     		else if (agent_visible == 55)
	     			strAgentVisible = '<span class="red_font">管</span><span class="blue_font"> 快分</span>';
	     		
	     		var strModuleFilePath = MyJsonDecode(g_AllModule[i].module_dll_file_path);
	     		if (strModuleFilePath.indexOf(";") > 0)
	     		{
	     			strModuleFilePath = strModuleFilePath.replace(/;;/g, ';');
	     			strModuleFilePath = strModuleFilePath.replace(/;/g, '</p><p style="margin:0;padding:0;">');
	     			strModuleFilePath = '<p style="margin:0;padding:0;">' + strModuleFilePath + '</p>';
	     		}
	     			
		      strHtml += '<tr id="trModule_'+strModuleId+'" onclick="Select_Module('+strModuleId+')">';
		     	strHtml += '<td>';
			    if (g_AgentID == 0)
					strHtml += 		'<a id="ahAgentNameLinkPanel_'+strAgentId+'" href="#" onmouseenter="Show_AgentNameLinkPanel_Common('+strAgentId+','+strAgentId+',\''+strAgentName+'\');">';
	        strHtml += 			strAgentName;
			    if (g_AgentID == 0)
					strHtml += 		'</a>';
		     	strHtml += '</td>';
			if (g_AgentID == 0 || g_strModuleParam != 'official')
	        strHtml += '<td>'+MyJsonDecode(g_AllModule[i].module_name)+'</td>';
	        strHtml += '<td>'+MyJsonDecode(g_AllModule[i].module_display_name)+'</td>';
	        if (g_AgentID == 0 || g_strModuleParam != "official")
	        strHtml += '<td>'+strModuleFilePath+'</td>';
					if (g_AgentID == 0)
	        strHtml += '<td>'+(MyJsonDecode(g_AllModule[i].visible)==1?'是':'否')+'</td>';
					if (g_AgentID == 0)
	        strHtml += '<td>'+MyJsonDecode(g_AllModule[i].display_order)+'</td>';
	        strHtml += '<td>'+MyJsonDecode(g_AllModule[i].md5)+'</td>';
	        strHtml += '<td>'+MyJsonDecode(g_AllModule[i].downloaded_count)+'</td>';
					//if (g_AgentID == 0)
	        strHtml += '<td>'+MyJsonDecode(g_AllModule[i].run_possibility)+'</td>';
					//if (g_AgentID == 0)
	        strHtml += '<td>'+MyJsonDecode(g_AllModule[i].run_time_segment)+'</td>';
					if (g_AgentID == 0)
	        strHtml += '<td>'+(MyJsonDecode(g_AllModule[i].run_type)==0?'主程序':'注入')+'</td>';
					if (g_AgentID == 0)
	        strHtml += '<td style="width:120px;word-break:break-all;">'+MyJsonDecode(g_AllModule[i].AdName)+'</td>';
					if (g_AgentID == 0)
	        strHtml += '<td>'+strAgentVisible+'</td>';
	        strHtml += '<td>'+MyJsonDecode(g_AllModule[i].remark)+'</td>';
	        strHtml += '<td>'+EmptyDateTime_0(MyJsonDecode(g_AllModule[i].add_time))+'</td>';
	        strHtml += '<td>'+EmptyDateTime_0(MyJsonDecode(g_AllModule[i].last_update_time))+'</td>';
					if (g_AgentID == 0)
						;
					else
	        strHtml += '<td><a href="#" onclick="AssignAgentModule('+strModuleId+');">全局分配</a></td>';
		      strHtml += '</tr>';
	    	}
	    	$('#tbdModuleList').html(strHtml);
	    }
	});
}
function Select_Module(strModuleId)
{
	var i = 0;
	g_strModuleId_Selected = strModuleId;
 	for (i = 0; i < g_AllModule.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllModule[i].Id);
 		if (strId == g_strModuleId_Selected)
			$('#trModule_'+strId).addClass('danger');
		else
			$('#trModule_'+strId).removeClass('danger');
 	}
}
var func_Submit = function Submit()
{
}
function DeleteModule()
{
	if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中所要删除的模块！');
		return;
	}
	$.messager.confirm('确认操作','您确定要删除此模块吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "module_mng/delete_module/module_id/" + g_strModuleId_Selected,
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除模块失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除模块失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除模块成功！");
			      
			      // 删除页面元素，简单处理直接重新取一遍数据
			      func_GetAllModule();
			    }
			});
		}
	});
}
function UpdateModule()
{
	g_bUpdateOrInsert = true;
	ShowEditModuleDialog();
}
function InsertModule()
{
	g_bUpdateOrInsert = false;
	ShowEditModuleDialog();
}
function ShowEditModuleDialog()
{
	var strOp = "insert_module";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_module";
		strOpName = "修改";
	}
	if (! g_bUpdateOrInsert)
		$('#module_id').val('');  // 新增要清空Id
	else
	{
		if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
		{
			$.messager.alert('错误','请先选中所要修改的模块！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllModule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllModule[i].Id);
	 		if (strId == g_strModuleId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllModule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#module_id').val(g_strModuleId_Selected);
		$('#EditModule__AgentID').val(MyJsonDecode(g_AllModule[i].AgentID));
		$('#module_name').val(MyJsonDecode(g_AllModule[i].module_name));
		$('#module_display_name').val(MyJsonDecode(g_AllModule[i].module_display_name));
		$('#module_dll_file_path').val(MyJsonDecode(g_AllModule[i].module_dll_file_path));
		$('#md5').val(MyJsonDecode(g_AllModule[i].md5));
		$('#visible').prop('checked', MyJsonDecode(g_AllModule[i].visible)=='1');
		$('#display_order').val(MyJsonDecode(g_AllModule[i].display_order));
		$('#downloaded_count').val(MyJsonDecode(g_AllModule[i].downloaded_count));
		$('#remark').val(MyJsonDecode(g_AllModule[i].remark));
		
		$('#run_possibility').val(MyJsonDecode(g_AllModule[i].run_possibility));
		$('#run_time_segment').val(MyJsonDecode(g_AllModule[i].run_time_segment));
		Gernerate_run_time_segment($('#run_time_segment').val());
		
		if (g_AgentID == 0)
		{
		$('#run_type').val(MyJsonDecode(g_AllModule[i].run_type));
		//$('#agent_visible').prop('checked', MyJsonDecode(g_AllModule[i].agent_visible)=='1');
		$('#agent_visible').val(MyJsonDecode(g_AllModule[i].agent_visible));
		$('#is_test').prop('checked', MyJsonDecode(g_AllModule[i].is_test)=='1');
		$('#EditModule__relational_rule_id').val(MyJsonDecode(g_AllModule[i].relational_rule_id));
		
		//$('#EditModule__module_nf_money_percent_id').val(MyJsonDecode(g_AllModule[i].module_nf_money_percent_id));
		$('#EditModule__percent_2345').val(MyJsonDecode(g_AllModule[i].percent_2345));
		$('#EditModule__percent_hao774').val(MyJsonDecode(g_AllModule[i].percent_hao774));
		$('#EditModule__percent_hao774_2').val(MyJsonDecode(g_AllModule[i].percent_hao774_2));
		$('#EditModule__percent_daohang2').val(MyJsonDecode(g_AllModule[i].percent_daohang2));
		$('#EditModule__percent_daohang3').val(MyJsonDecode(g_AllModule[i].percent_daohang3));
		$('#EditModule__percent_daohang4').val(MyJsonDecode(g_AllModule[i].percent_daohang4));
		$('#EditModule__percent_daohang5').val(MyJsonDecode(g_AllModule[i].percent_daohang5));
		$('#EditModule__percent_daohang6').val(MyJsonDecode(g_AllModule[i].percent_daohang6));
		$('#EditModule__percent_daohang7').val(MyJsonDecode(g_AllModule[i].percent_daohang7));
		
		$('#EditModule__percent_daohang8').val(MyJsonDecode(g_AllModule[i].percent_daohang8));
		$('#EditModule__percent_daohang9').val(MyJsonDecode(g_AllModule[i].percent_daohang9));
		$('#EditModule__percent_daohang10').val(MyJsonDecode(g_AllModule[i].percent_daohang10));
		$('#EditModule__percent_daohang11').val(MyJsonDecode(g_AllModule[i].percent_daohang11));
		$('#EditModule__percent_daohang12').val(MyJsonDecode(g_AllModule[i].percent_daohang12));
		$('#EditModule__percent_daohang13').val(MyJsonDecode(g_AllModule[i].percent_daohang13));
		}
	}
		
	$("#divEditModuleDialog").dialog({title: strOpName + '模块'});
	$('#divEditModuleDialog').dialog('center');
	$('#divEditModuleDialog').dialog('open');
}
function Submit_EditModule()
{
	var strOp = "insert_module";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_module";
		strOpName = "修改";
	}
	if (! checkinput_EditModule())
		return;
	$.ajax({
	    type: "POST",
	    url: "module_mng/" + strOp,
	    data: $("#frmEditModule").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'模块失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'模块失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"模块成功！");
				$('#divEditModuleDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      func_GetAllModule();
	    }
	});
}
function checkinput_EditModule()
{
	if (g_AgentID == 0)
	{
		var display_order = $.trim($("#display_order").val());
		if (! Valid_Int(display_order))
		{
	    $.messager.alert('错误','显示顺序必须为数字，请重新输入！');
			return false;
		}
	}
	var module_name = $.trim($("#module_name").val());
	if (module_name.length == 0)
	{
    $.messager.alert('错误','模块名称不能为空，请重新输入！');
		return false;
	}
	var module_display_name = $.trim($("#module_display_name").val());
	if (module_display_name.length == 0)
	{
    $.messager.alert('错误','模块显示名称不能为空，请重新输入！');
		return false;
	}
	var module_dll_file_path = $.trim($("#module_dll_file_path").val());
	if (g_AgentID == 0)
	{
		if (module_dll_file_path.length == 0)
		{
	    $.messager.alert('错误','模块文件名不能为空，请重新输入！');
			return false;
		}
	}
	else
	{
		if (module_dll_file_path.indexOf("://") < 0)
		{
	    $.messager.alert('错误','模块文件网址格式不正确，请重新输入！');
			return false;
		}
	}
	var md5 = $.trim($("#md5").val());
	if (md5.length == 0)
	{
    $.messager.alert('错误','文件MD5不能为空，请重新输入！');
		return false;
	}
	
	var sms_verify_code = $.trim($("#sms_verify_code").val());
	if (g_AgentID != 0)
	if (sms_verify_code.length == 0)
	{
    $.messager.alert('错误','短信验证码不能为空，请重新输入！');
		return false;
	}
	return true;
}
function Module_ClearMd5()
{
	if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中模块！');
		return;
	}
	$.ajax({
	    type: "GET",
	    url: "module_mng/module_clear_md5/module_id/" + g_strModuleId_Selected,
	    data: '',
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','清空模块MD5失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '清空模块MD5失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', "清空模块MD5成功！");
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      func_GetAllModule();
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
	func_GetAllModule();
}

function AssignAgentModule(strModuleId)
{
	$.messager.confirm('确认操作','您确定要全局分配此模块吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "agent_module_mng/update_agent_module__single_wrapper/module_id/" + strModuleId,
			    data: '',
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
			      $.messager.alert('提示', "分配模块成功！您可在“模块分配”页面查看分配情况");
			    }
			});
		}
	});
}
function AssignToAllAgent()
{
	if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中模块！');
		return;
	}
	$.messager.confirm('确认操作','您确定要对 全部代理商 分配此模块吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "agent_module_mng/assign_to_all_agent/module_id/" + g_strModuleId_Selected,
			    data: '',
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
			      $.messager.alert('提示', "分配模块成功！");
			    }
			});
		}
	});
}
function UnassignToAllAgent()
{
	if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中模块！');
		return;
	}
	$.messager.confirm('确认操作','您确定要对全部代理商 删除 此模块的分配吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "agent_module_mng/unassign_to_all_agent/module_id/" + g_strModuleId_Selected,
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除模块分配失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除模块分配失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        return;
			   		}
			      $.messager.alert('提示', "删除模块分配成功！");
			    }
			});
		}
	});
}

function Show_AssignToAgentListDialog()
{
	var strOp = "insert_rule";
	var strOpName = "分配";
	
	$('#AssignToAgentList__module_id').val(0);
	
	{
		if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
		{
			$.messager.alert('错误','请先选中待'+strOpName+'的模块！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllModule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllModule[i].Id);
	 		if (strId == g_strModuleId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllModule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#AssignToAgentList__module_id').val(g_strModuleId_Selected);
	}
	$("#divAssignToAgentListDialog").dialog({title: strOpName + ' - 大量用户'});
	$('#divAssignToAgentListDialog').dialog('center');
	$('#divAssignToAgentListDialog').dialog('open');
}
function Submit_AssignToAgentList()
{
	var strOpName = "分配";
	if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中待'+strOpName+'的模块！');
		return;
	}
	$.messager.confirm('确认操作','您确定要'+strOpName+'此模块到大量用户吗？',function(bYes){   
		if (bYes)
		{
			if (! checkinput_AssignToAgentList_Agent())
				return;
			$.ajax({
			    type: "POST",
			    url: "agent_module_mng/assign_to_agent_list",
			    data: "module_id=" + g_strModuleId_Selected + "&agent_name_list=" + $('#AssignToAgentList__agent_name_list').val(),
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误',strOpName+'模块到指定用户失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = strOpName+'模块到指定用户失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', strOpName+'模块到指定用户成功！');
						$("#divAssignToAgentListDialog").dialog('close');
			      
			      // 复制模块不用更新显示
			      //func_GetAllRule();
			    }
			});
		}
	});
}
function checkinput_AssignToAgentList_Agent()
{
	var agent_name_list = $('#AssignToAgentList__agent_name_list').val();
	if (agent_name_list.length == 0)
	{
  	$.messager.alert('错误','请输入目标用户列表！以分号分隔');
    return false;
	}
	return true;
}

function Show_UnassignToAgentListDialog()
{
	var strOp = "insert_rule";
	var strOpName = "取消分配";
	
	$('#UnassignToAgentList__module_id').val(0);
	
	{
		if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
		{
			$.messager.alert('错误','请先选中待'+strOpName+'的模块！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllModule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllModule[i].Id);
	 		if (strId == g_strModuleId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllModule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#UnassignToAgentList__module_id').val(g_strModuleId_Selected);
		
		
			$.ajax({
			    type: "GET",
			    url: "module_mng/get_module_assigned_agent_list",
			    data: "module_id=" + g_strModuleId_Selected,
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','获取全局分配模块的用户列表失败！详细：数据错误');
			        return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '获取全局分配模块的用户列表失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			   		
			   		if (jsonResult.szData == undefined || jsonResult.szData == null)
			   		{
			      	$.messager.alert('错误', '获取全局分配模块的用户列表时返回错误数据');
			      	return;
			   		}
			   		
			     	var tAgentName_Info = jsonResult.szData;
			     	
			     	var strAgentNameList = '';
			     	if (tAgentName_Info != '')
			     	for (i = 0; i < tAgentName_Info.length; i ++)
			     		strAgentNameList += MyJsonDecode(tAgentName_Info[i].AgentName) + ';';
			     	$('#UnassignToAgentList__agent_name_list').val(strAgentNameList);
			    }
			});
			
			
	}
	$("#divUnassignToAgentListDialog").dialog({title: strOpName + ' - 大量用户'});
	$('#divUnassignToAgentListDialog').dialog('center');
	$('#divUnassignToAgentListDialog').dialog('open');
}
function Submit_UnassignToAgentList()
{
	var strOpName = "取消分配";
	if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中待'+strOpName+'的模块！');
		return;
	}
	$.messager.confirm('确认操作','您确定要'+strOpName+'此模块到大量用户吗？',function(bYes){   
		if (bYes)
		{
			if (! checkinput_UnassignToAgentList_Agent())
				return;
			$.ajax({
			    type: "POST",
			    url: "agent_module_mng/unassign_to_agent_list",
			    data: "module_id=" + g_strModuleId_Selected + "&agent_name_list=" + $('#UnassignToAgentList__agent_name_list').val(),
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误',strOpName+'模块到指定用户失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = strOpName+'模块到指定用户失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', strOpName+'模块到指定用户成功！');
						$("#divUnassignToAgentListDialog").dialog('close');
			      
			      // 复制模块不用更新显示
			      //func_GetAllRule();
			    }
			});
		}
	});
}
function checkinput_UnassignToAgentList_Agent()
{
	var agent_name_list = $('#UnassignToAgentList__agent_name_list').val();
	if (agent_name_list.length == 0)
	{
  	$.messager.alert('错误','请输入目标用户列表！以分号分隔');
    return false;
	}
	return true;
}

function Click_run_time_segment()
{
	var strTimeSegmentList = "";
	var nTime_Begin = -1;
	var nTime_End = -1;
	var tm = 0;
	for (tm = 0; tm < 24; tm += 2)
	{
		var bChecked= $('#run_time_segment__' + String(tm)).prop('checked');
		if (bChecked)
		{
			if (nTime_Begin == -1)
				nTime_Begin = tm;
			nTime_End = tm + 1;
		}
		
		if (! bChecked || tm == 24 - 2)
		{
			if (nTime_Begin != -1)
			{
				if (strTimeSegmentList.length > 0)
					strTimeSegmentList += ";";
				strTimeSegmentList += String(nTime_Begin)+"-"+String(nTime_End);
				
				nTime_Begin = -1;
				nTime_End = -1;
			}
		}
	}
	$('#run_time_segment').val(strTimeSegmentList);
}
function Gernerate_run_time_segment(strTimeSegmentList)
{
	if (strTimeSegmentList == "")
		strTimeSegmentList = "0-23";
	var arTimeSegment_Array = strTimeSegmentList.split(";");
	var nTime_Begin = -1;
	var nTime_End = -1;
	var tm = 0;
	for (tm = 0; tm < 24; tm += 2)
	{
		var bChecked = false;
		for (var kk = 0; kk < arTimeSegment_Array.length; kk ++)
		{
			var from_to_Array = arTimeSegment_Array[kk].split("-");
			if (from_to_Array.length != 2)
				return;
			var nFrom = parseInt(from_to_Array[0]);
			var nTo = parseInt(from_to_Array[1]);
			if (nFrom <= tm && nTo >= tm)
			{
				bChecked = true;
				break;
			}
		}
		$('#run_time_segment__' + String(tm)).prop('checked', bChecked);
	}
}

function GetAllHavntAssignModule_AgentList()
{
	var strMsg = "";
	var i = 0;
	
	if (g_strModuleId_Selected == null || g_strModuleId_Selected == undefined || g_strModuleId_Selected == 0)
	{
		$.messager.alert('错误','请先选中模块！');
		return;
	}
	// 查找模块名
	for (i = 0; i < g_AllModule.length; i ++)
	{
		var strId = MyJsonDecode(g_AllModule[i].Id);
		if (strId == g_strModuleId_Selected)
			break;
	}
	if (i >= g_AllModule.length)
	{
		$.messager.alert('错误','数据错误，请联系管理人员修正！');
		return;
	}
	
	$('#module_item_list').val("no " + MyJsonDecode(g_AllModule[i].module_name) + ";");
	
	GetAllHavntAssignModule_AgentList_EditSubmit();
}

function GetAllHavntAssignModule_AgentList_EditSubmit()
{
	var strMsg = "";
	var nItemCount = 0;
	var i = 0;
	var strQuery = "";
	
	var module_item_list = $('#module_item_list').val();
	if (module_item_list.length == 0)
	{
		$.messager.alert('错误','查询条件为空！');
		return;
	}
	
	$('#tbdHavntAssignModule_AgentList').html('');
	$.ajax({
	    type: "GET",
	    url: "module_mng/get_havnt_assign_module_agent/module_item_list/" + module_item_list,
	    data: strQuery,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取模块未分配信息失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取模块未分配信息失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取模块未分配信息失败！详细：数据错误');
	          	return;
	     	}
	     	g_AllHavntAssignModule_AgentList = jsonResult.szData.tAllYjsProcess;
	     	var strHtml = "";
	     	
				$("#divHavntAssignModule_AgentList_Dialog").dialog('open');
	    	
	    	ShowHavntAssignModule_AgentList();
	    }
	});
}

function ShowHavntAssignModule_AgentList()
{
	var strHtml = "";
	var i = 0;
	var strHtml_Total = "";
	var nTotal = 0;

	if (g_AllHavntAssignModule_AgentList == null)
		return;
	for (i = 0; i < g_AllHavntAssignModule_AgentList.length; i ++)
	{
		var strHavntAssignModule_AgentListId = g_AllHavntAssignModule_AgentList[i].Id;
		var strAgentName = MyJsonDecode(g_AllHavntAssignModule_AgentList[i].AgentName);
		var client_count = MyJsonDecode(g_AllHavntAssignModule_AgentList[i].client_count);
			
	  strHtml += '<tr id="trHavntAssignModule_AgentList_'+strHavntAssignModule_AgentListId+'" onclick="Select_HavntAssignModule_AgentList('+strHavntAssignModule_AgentListId+')">';
	  strHtml += '<td>'+MyJsonDecode(g_AllHavntAssignModule_AgentList[i].AgentID)+'</td>';
   	strHtml += '<td>';
		strHtml += 		'<a id="ahAgentNameLinkPanel_HavntAssign_'+strHavntAssignModule_AgentListId+'" href="#" onmouseenter="Show_AgentNameLinkPanel_AgentName__StringId(\'HavntAssign_'+strHavntAssignModule_AgentListId+'\',\''+strAgentName+'\');">';
    strHtml += 			strAgentName;
		strHtml += 		'</a>';
   	strHtml += '</td>';
	  strHtml += '<td>'+client_count+'</td>';
	  strHtml += '</tr>';
	  
	  nTotal += parseInt(client_count);
	}
	strHtml_Total += '<tr>';
	  strHtml_Total += '<td class="btn-warning">总计</td>';
   	strHtml_Total += '<td>'+String(g_AllHavntAssignModule_AgentList.length)+'人</td>';
	  strHtml_Total += '<td>'+nTotal+'</td>';
	  strHtml_Total += '</tr>';
	$('#tbdHavntAssignModule_AgentList').html(strHtml_Total + strHtml);
}