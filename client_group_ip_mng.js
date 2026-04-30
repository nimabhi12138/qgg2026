
var g_AllClientGroupIp = null;
var g_AllClientGroupAdRule = null;
var g_AllClientIp = null;
var g_AllAgentInfo = null;
var g_AllClientGroup = null;
var g_AllAdRule = null;
var g_strClientGroupId_Selected = "";
var g_bUpdateOrInsert = true;

var g_nRecordCount_ClientGroupIpGroupIp = 0;
var g_nPageCount_ClientGroupIp = 1;
var g_nRecordCountEachPage_ClientGroupIp = 100;
var g_nCurrentPageIndex_ClientGroupIp = 0;

var g_strOrderBy = "";
var g_nEscDesc = 0;

jQuery(document).ready(function() {
	Init();
	func_Get();
});
function Init()
{
	EasyUI_DialogInit("divEditClientGroupIpDialog");
	EasyUI_DialogInit("divEditClientGroupDialog");
	EasyUI_DialogInit("divEditClientGroupAdRuleDialog");
	EasyUI_DialogInit("divEditClientGroupBootBatDialog");
	
	$('#divClientGroupIpList').css('height', $(window).height() - 100);
	
	$("textarea").dblclick(function(e){
			$(this).css('height', $(this).height()+60);
	});
}
var func_Get = function Get()
{
	if (g_AgentID != 0 || g_AgentID_ToDisplay.length > 0)  // 管理员只能搜索，不能显示全部
		GetAllClientGroupAssignInfo(1);
}
function GetAllClientGroupAssignInfo(nPageIndex_1Add)
{
	var strMsg = "";
	var nItemCount = 0;
	var i = 0;
	g_strClientGroupId_Selected = "";
	var strQuery = "";
	
	if (g_AgentID == 0 && g_AgentID_ToDisplay.length == 0)
		if ($.trim($('#search_keyword').val()).length < 3)
	  {
	  	$.messager.alert('错误','输入长度不能小于3个字符！');
	    return;
	 	}
	
 	if (! Valid_Int(nPageIndex_1Add) || nPageIndex_1Add <= 0 || nPageIndex_1Add > g_nPageCount_ClientGroupIp)
  {
  	$.messager.alert('错误','页序号必须为1到'+g_nPageCount_ClientGroupIp+'之间的数字，请重新输入！');
    return;
 	}
 	var nPageIndex = nPageIndex_1Add - 1;
 	
 	if (g_strOrderBy.length == 0)
 		g_strOrderBy = "0";
 	strQuery += "page="+String(nPageIndex)+'&pagecount='+String(g_nRecordCountEachPage_ClientGroupIp)+"&order="+g_strOrderBy+"&orderesc="+String(g_nEscDesc);
 	strQuery += "&search_field=" + $('#search_field').val() + "&search_keyword=" + $.trim($('#search_keyword').val());
 	if (g_AgentID_ToDisplay.length > 0)
 		strQuery += "&AgentID_ToDisplay=" + g_AgentID_ToDisplay;
 		
	$.ajax({
	    type: "GET",
	    url: "client_group_ip_mng/get_all_client_group_ip",
	    data: strQuery,
	    timeout: 240*1000,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取网吧分组IP分配信息失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取网吧分组IP分配信息失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取网吧分组IP分配信息失败！详细：数据错误');
	          	return;
	     	}
	     	g_AllClientGroupIp = jsonResult.szData.tAllClientGroupIp;
	     	g_AllClientGroupAdRule = jsonResult.szData.tAllClientGroupAdRule;
	     	g_AllClientIp = jsonResult.szData.tAllClientIp;
	     	g_AllAgentInfo = jsonResult.szData.tAllAgentInfo;
	     	g_AllClientGroup = jsonResult.szData.tAllClientGroup;
	     	g_AllAdRule = jsonResult.szData.tAllAdRule;
	     	g_nRecordCount_ClientGroupIp = MyJsonDecode(jsonResult.szData.nTotalCount);
	     	var strHtml = "";
	    	
	     	strHtml = "";
	     	for (i = 0; i < g_AllAgentInfo.length; i ++)
		      strHtml += '<option value="'+MyJsonDecode(g_AllAgentInfo[i].AgentID)+'">' + MyJsonDecode(g_AllAgentInfo[i].AgentName) + '</option>';
	    	$('#EditClientGroup__AgentID').html(strHtml);
	    	$('#EditClientGroupIp__AgentID').html(strHtml);
	     	$('#EditClientGroupAdRule__AgentID').html(strHtml);
	    	
	    	Change_AgentID();
	    	Change_ClientGroupId();
	    	
	    	Change_AgentID_AssignAdRule();
	    	Change_ClientGroupId_AssignAdRule();
	    	
	     	g_nPageCount_ClientGroupIp = Math.ceil(g_nRecordCount_ClientGroupIp / g_nRecordCountEachPage_ClientGroupIp);
	     	if (g_nPageCount_ClientGroupIp == 0)
	     		g_nPageCount_ClientGroupIp = 1;
	     		
	     	ShowAllClientGroupAssignInfo();
  
			  g_nCurrentPageIndex_ClientGroupIp = nPageIndex;
			  SetCommonPager('GetAllClientGroupAssignInfo', g_nRecordCount_ClientGroupIp, g_nRecordCountEachPage_ClientGroupIp, g_nCurrentPageIndex_ClientGroupIp);
	    }
	});
}
function ShowAllClientGroupAssignInfo()
{
	     	var strHtml = "";
	     	var i = 0;
	     	var kk = 0;
	     	
	     	for (i = 0; i < g_AllClientGroupIp.length; i ++)
	     	{
	     		var strClientGroupId = MyJsonDecode(g_AllClientGroupIp[i].client_group_id);
	     		var client_ip_list = MyJsonDecode(g_AllClientGroupIp[i].client_ip_list).replace(/_/g,"、");
	     		var arClientIpArray = client_ip_list.split("、");
	     		
	     		//var internet_bar_name_list = MyJsonDecode(g_AllClientGroupIp[i].internet_bar_name_list);  // 已经是中文顿号分隔了
	     		//var arInternetBarNameArray = internet_bar_name_list.split("、");
	     		
	     		client_ip_list = '<ul style="margin:0;padding:0;">';
	     		for (kk = 0; kk < arClientIpArray.length; kk ++)
	     		{
	     			if (arClientIpArray[kk].length > 0)
	     			{
//	     				client_ip_list += '<li style="align:left;float:left;list-style:none;width:110px;">';
//	     				if (arInternetBarNameArray[kk].length > 0)
//	     					client_ip_list += arInternetBarNameArray[kk];
//	     				else
//	     					client_ip_list += arClientIpArray[kk];
	     				client_ip_list += '<li style="align:left;float:left;list-style:none;width:110px;">' + IpToInternetBarName(arClientIpArray[kk]);
	     			}
	     		}
	     		if (client_ip_list.substr(client_ip_list.length - 1, 1) == "、")
	     			client_ip_list = client_ip_list.substr(0, client_ip_list.length - 1);
	     		client_ip_list += "</ul>";
	     		
	     		// 从规则分配数据中查找构造规则分配信息
	     		var adrule_list = "";
	     		for (kk = 0; kk < g_AllClientGroupAdRule.length; kk ++)
	     			if (strClientGroupId == MyJsonDecode(g_AllClientGroupAdRule[kk].client_group_id))
	     				break;
	     		if (kk < g_AllClientGroupAdRule.length)
	     		{
		     		adrule_list = MyJsonDecode(g_AllClientGroupAdRule[kk].adrule_list).replace(/#/g,"、");
		     		if (adrule_list.substr(adrule_list.length - 1, 1) == "、")
		     			adrule_list = adrule_list.substr(0, adrule_list.length - 1);
	     		}
	     		
		      strHtml += '<tr id="trAgent_'+strClientGroupId+'" onclick="Select_ClientGroup('+strClientGroupId+')">';
	        strHtml += '<td>'+MyJsonDecode(g_AllClientGroupIp[i].AgentName)+'</td>';
	        strHtml += '<td>'+MyJsonDecode(g_AllClientGroupIp[i].client_group_name).replace("default_client_group","默认分组")+'</td>';
	        strHtml += '<td>'+MyJsonDecode(g_AllClientGroupIp[i].remark)+'</td>';
	        strHtml += '<td>'+client_ip_list+'</td>';
	        strHtml += '<td>'+adrule_list+'</td>';
		      strHtml += '<td style="word-break:break-all;">'+StringOmitDisplay_Pure(MyJsonDecode(g_AllClientGroupIp[i].boot_bat),80)+'</td>';
		      strHtml += '</tr>';
	    	}

	    	$('#tbdClientGroupIpList').html(strHtml);
}
function Select_ClientGroup(strClientGroupId)
{
	var i = 0;
	g_strClientGroupId_Selected = strClientGroupId;
 	for (i = 0; i < g_AllClientGroupIp.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllClientGroupIp[i].client_group_id);
 		if (strId == g_strClientGroupId_Selected)
			$('#trAgent_'+strId).addClass('danger');
		else
			$('#trAgent_'+strId).removeClass('danger');
 	}
}
var func_Submit = function Submit()
{
}
function UpdateClientGroupIp()
{
	g_bUpdateOrInsert = true;
	ShowEditClientGroupIpDialog();
}
function InsertClientGroupIp()
{
	g_bUpdateOrInsert = false;
	ShowEditClientGroupIpDialog();
}
function ShowEditClientGroupIpDialog()
{
	var strOp = "insert_client_group_ip";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client_group_ip";
		strOpName = "修改";
	}
	if (! g_bUpdateOrInsert)
		$('#client_group_ip_id').val('');  // 新增要清空Id
	else
	{
		if (g_strClientGroupId_Selected == null || g_strClientGroupId_Selected == undefined || g_strClientGroupId_Selected == 0)
		{
			$.messager.alert('错误','请先选中网吧分组！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllClientGroupIp.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllClientGroupIp[i].client_group_id);
	 		if (strId == g_strClientGroupId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllClientGroupIp.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		
		$('#EditClientGroupIp__AgentID').val(MyJsonDecode(g_AllClientGroupIp[i].AgentID));
		Change_AgentID();
		$('#EditClientGroupIp__client_group_id').val(MyJsonDecode(g_AllClientGroupIp[i].client_group_id));
		Change_ClientGroupId();
	}
		
	$("#divEditClientGroupIpDialog").dialog({title: strOpName + '网吧分组IP分配'});
	$('#divEditClientGroupIpDialog').dialog('center');
	$('#divEditClientGroupIpDialog').dialog('open');
}
function Submit_EditClientGroupIp()
{
	var strOp = "insert_client_group_ip";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client_group_ip";
		strOpName = "修改";
	}
	if (! checkinput_EditClientGroupIp())
		return;
	// 构造id list
	var client_ip_list = "";
	$('input[name="CheckBox_client_ip_list"]:checked').each(function(){
			client_ip_list += $(this).val() + "_";
	});
	$('#EditClientGroupIp__client_ip_list').val(client_ip_list);
	
	$.ajax({
	    type: "POST",
	    url: "client_group_ip_mng/" + strOp,
	    data: $("#frmEditClientGroupIp").serialize(),
	    timeout: 240*1000,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'网吧分组IP分配失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'网吧分组IP分配失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"网吧分组IP分配成功！");
				$('#divEditClientGroupIpDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      GetAllClientGroupAssignInfo(1);
	    }
	});
}
function checkinput_EditClientGroupIp()
{
	return true;
}

function UpdateClientGroupAdRule()
{
	g_bUpdateOrInsert = true;
	ShowEditClientGroupAdRuleDialog();
}
function InsertClientGroupAdRule()
{
	g_bUpdateOrInsert = false;
	ShowEditClientGroupAdRuleDialog();
}
function ShowEditClientGroupAdRuleDialog()
{
	var strOp = "insert_client_group_adrule";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client_group_adrule";
		strOpName = "修改";
	}
	if (! g_bUpdateOrInsert)
		$('#client_group_adrule_id').val('');  // 新增要清空Id
	else
	{
		if (g_strClientGroupId_Selected == null || g_strClientGroupId_Selected == undefined || g_strClientGroupId_Selected == 0)
		{
			$.messager.alert('错误','请先选中网吧分组！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllClientGroupAdRule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllClientGroupAdRule[i].client_group_id);
	 		if (strId == g_strClientGroupId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllClientGroupAdRule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		
		$('#EditClientGroupAdRule__AgentID').val(MyJsonDecode(g_AllClientGroupAdRule[i].AgentID));
		Change_AgentID_AssignAdRule();
		$('#EditClientGroupAdRule__client_group_id').val(MyJsonDecode(g_AllClientGroupAdRule[i].client_group_id));
		Change_ClientGroupId_AssignAdRule();
	}
		
	$("#divEditClientGroupAdRuleDialog").dialog({title: strOpName + '网吧分组规则分配'});
	$('#divEditClientGroupAdRuleDialog').dialog('center');
	$('#divEditClientGroupAdRuleDialog').dialog('open');
}
function Submit_EditClientGroupAdRule()
{
	var strOp = "insert_client_group_adrule";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client_group_adrule";
		strOpName = "修改";
	}
	if (! checkinput_EditClientGroupAdRule())
		return;
	// 构造id list
	var adrule_list = "";
	$('input[name="CheckBox_adrule_list"]:checked').each(function(){
			adrule_list += $(this).val() + "_";
	});
	$('#EditClientGroupAdRule__adrule_list').val(adrule_list);
	
	$.ajax({
	    type: "POST",
	    url: "client_group_ip_mng/" + strOp,
	    data: $("#frmEditClientGroupAdRule").serialize(),
	    timeout: 240*1000,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'网吧分组规则分配失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'网吧分组规则分配失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"网吧分组规则分配成功！");
				$('#divEditClientGroupAdRuleDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      GetAllClientGroupAssignInfo(1);
	    }
	});
}
function checkinput_EditClientGroupAdRule()
{
	return true;
}

function Change_AgentID()
{
		var i = 0;
   	var strHtml = "";
   	var AgentID_Selected = $('#EditClientGroupIp__AgentID').val();
   	for (i = 0; i < g_AllClientGroup.length; i ++)
   		if (MyJsonDecode(g_AllClientGroup[i].AgentID) == AgentID_Selected)
      	strHtml += '<option value="'+MyJsonDecode(g_AllClientGroup[i].Id)+'">'
      							 + MyJsonDecode(g_AllClientGroup[i].client_group_name).replace("default_client_group","默认分组") + '</option>';
  	$('#EditClientGroupIp__client_group_id').html(strHtml);
  	
  	var nCount = 0;
   	strHtml = "";
   	strHtml += "<tr>";
   	for (i = 0; i < g_AllClientIp.length; i ++)
   	{
   		if (MyJsonDecode(g_AllClientIp[i].AgentID) == AgentID_Selected)
   		{
   			if ((nCount % 5) == 0)
   			strHtml += "</tr><tr>";
   			strHtml += "<td>";
      	strHtml += '<input type="checkbox" name="CheckBox_client_ip_list" value="'+MyJsonDecode(g_AllClientIp[i].PublicIP)+'" style="margin-left:10px;" />' + IpToInternetBarName(MyJsonDecode(g_AllClientIp[i].PublicIP));
   			strHtml += "</td>";
   			nCount ++;
      }
    }
//   	for (i = 0; i < g_AllClientGroupIp.length; i ++)
//   	{
//   		if (MyJsonDecode(g_AllClientGroupIp[i].AgentID) == AgentID_Selected)
//   		{
//	     		var client_ip_list = MyJsonDecode(g_AllClientGroupIp[i].client_ip_list).replace(/_/g,"、");
//	     		var arClientIpArray = client_ip_list.split("、");
//	     		var internet_bar_name_list = MyJsonDecode(g_AllClientGroupIp[i].internet_bar_name_list);  // 已经是中文顿号分隔了
//	     		var arInternetBarNameArray = internet_bar_name_list.split("、");
//	     		
//	     		for (kk = 0; kk < arClientIpArray.length; kk ++)
//	     		{
//	     			if (arClientIpArray[kk].length == 0)
//	     				continue;
//		   			if ((nCount % 5) == 0)
//		   				strHtml += "</tr><tr>";
//		   			strHtml += "<td>";
//		      	strHtml += 		'<input type="checkbox" name="CheckBox_client_ip_list" value="'+arClientIpArray[kk]+'" style="margin-left:10px;" />';
//		      	if (arInternetBarNameArray[kk].length > 0)
//		      	strHtml += 		arInternetBarNameArray[kk];
//		      	else
//		      	strHtml += 		arClientIpArray[kk];
//		   			strHtml += "</td>";
//		   			
//   					nCount ++;
//	     		}
//      }
//    }
   	strHtml += "</tr>";
  	$('#tblClientIpCheckboxList').html(strHtml);
}
function Change_ClientGroupId()
{
		var i = 0;
   	var strHtml = "";
   	
   	var client_group_id_Selected = $('#EditClientGroupIp__client_group_id').val();
   	var client_ip_list = "";
   	for (i = 0; i < g_AllClientGroupIp.length; i ++)
   		if (MyJsonDecode(g_AllClientGroupIp[i].client_group_id) == client_group_id_Selected)
   			client_ip_list = MyJsonDecode(g_AllClientGroupIp[i].client_ip_list);
   		
		$('input[name="CheckBox_client_ip_list"]').each(function(){
				$(this).prop('checked', IsInCommonList(client_ip_list, "_", $(this).val()));
		});
}
function Change_AgentID_AssignAdRule()
{
		var i = 0;
   	var strHtml = "";
   	var AgentID_Selected = $('#EditClientGroupAdRule__AgentID').val();
   	for (i = 0; i < g_AllClientGroup.length; i ++)
   		if (MyJsonDecode(g_AllClientGroup[i].AgentID) == AgentID_Selected)
      	strHtml += '<option value="'+MyJsonDecode(g_AllClientGroup[i].Id)+'">'
      							 + MyJsonDecode(g_AllClientGroup[i].client_group_name).replace("default_client_group","默认分组") + '</option>';
  	$('#EditClientGroupAdRule__client_group_id').html(strHtml);
  	
   	strHtml = "";
   	for (i = 0; i < g_AllAdRule.length; i ++)
   		if (MyJsonDecode(g_AllAdRule[i].AgentID) == AgentID_Selected)
      	strHtml += '<p style="margin:0;"/><input type="checkbox" name="CheckBox_adrule_list" value="'+MyJsonDecode(g_AllAdRule[i].Id)+'" style="margin-left:10px;" />' + MyJsonDecode(g_AllAdRule[i].AdName);
  	$('#tdAdRuleCheckboxList').html(strHtml);
}
function Change_ClientGroupId_AssignAdRule()
{
		var i = 0;
   	var strHtml = "";
   	
   	var client_group_id_Selected = $('#EditClientGroupAdRule__client_group_id').val();
   	var adrule_list = "";
   	for (i = 0; i < g_AllClientGroupAdRule.length; i ++)
   		if (MyJsonDecode(g_AllClientGroupAdRule[i].client_group_id) == client_group_id_Selected)
   			adrule_list = MyJsonDecode(g_AllClientGroupAdRule[i].adrule_id_list);  // adrule_id_list，并非adrule_list
   		
		$('input[name="CheckBox_adrule_list"]').each(function(){
				$(this).prop('checked', IsInCommonList(adrule_list, "#", $(this).val()));
		});
}

function DeleteClientGroup()
{
	if (g_strClientGroupId_Selected == null || g_strClientGroupId_Selected == undefined || g_strClientGroupId_Selected == 0)
	{
		$.messager.alert('错误','请先选中所要删除的网吧分组！');
		return;
	}
	// 查找对应数据在数组中的序号
 	for (i = 0; i < g_AllClientGroup.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllClientGroup[i].Id);
 		if (strId == g_strClientGroupId_Selected)
 			break;
 	}
 	if (i >= g_AllClientGroup.length)
 	{
		$.messager.alert('错误','数据错误，请联系管理人员修正！');
		return;
	}
 	if (MyJsonDecode(g_AllClientGroup[i].client_group_name)=='default_client_group')
 	{
		$.messager.alert('提示','不能删除默认分组');
		return;
	}
	
	$.messager.confirm('确认操作','您确定要删除此网吧分组吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "client_group_ip_mng/delete_client_group/client_group_id/" + g_strClientGroupId_Selected,
			    data: '',
	    timeout: 240*1000,
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除网吧分组失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除网吧分组失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除网吧分组成功！");
			      
			      // 删除页面元素，简单处理直接重新取一遍数据
			      GetAllClientGroupAssignInfo(1);
			    }
			});
		}
	});
}
function UpdateClientGroup()
{
	g_bUpdateOrInsert = true;
	ShowEditClientGroupDialog();
}
function InsertClientGroup()
{
	g_bUpdateOrInsert = false;
	ShowEditClientGroupDialog();
}
function ShowEditClientGroupDialog()
{
	var strOp = "insert_client_group";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client_group";
		strOpName = "修改";
	}
	if (! g_bUpdateOrInsert)
		$('#client_group_id').val('');  // 新增要清空Id
	else
	{
		if (g_strClientGroupId_Selected == null || g_strClientGroupId_Selected == undefined || g_strClientGroupId_Selected == 0)
		{
			$.messager.alert('错误','请先选中所要修改的网吧分组！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllClientGroup.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllClientGroup[i].Id);
	 		if (strId == g_strClientGroupId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllClientGroup.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
	 	if (MyJsonDecode(g_AllClientGroup[i].client_group_name)=='default_client_group')
	 	{
			$.messager.alert('提示','不能修改默认分组');
			return;
		}
		
		$('#EditClientGroup__Id').val(g_strClientGroupId_Selected);
		$('#EditClientGroup__client_group_name').val(MyJsonDecode(g_AllClientGroup[i].client_group_name));
		$('#EditClientGroup__remark').val(MyJsonDecode(g_AllClientGroup[i].remark));
	}
		
	$("#divEditClientGroupDialog").dialog({title: strOpName + '网吧分组'});
	$('#divEditClientGroupDialog').dialog('center');
	$('#divEditClientGroupDialog').dialog('open');
}
function Submit_EditClientGroup()
{
	var strOp = "insert_client_group";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client_group";
		strOpName = "修改";
	}
	if (! checkinput_EditClientGroup())
		return;
	$.ajax({
	    type: "POST",
	    url: "client_group_ip_mng/" + strOp,
	    data: $("#frmEditClientGroup").serialize(),
	    timeout: 240*1000,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'网吧分组失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'网吧分组失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"网吧分组成功！");
				$('#divEditClientGroupDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      GetAllClientGroupAssignInfo(1);
	    }
	});
}
function checkinput_EditClientGroup()
{
	var client_group_name = $.trim($("#EditClientGroup__client_group_name").val());
	if (client_group_name.length < 1 || client_group_name.length > 20)
	{
    $.messager.alert('错误','网吧分组名称长度必须为1到10个字符，请重新输入！');
		return false;
	}
	return true;
}
function IpToInternetBarName(strIp)
{
	var i = 0;
	for (i = 0; i < g_AllClientIp.length; i ++)
	{
		if (g_AllClientIp[i].InternetBarName.length == 0)
			continue;
		if (strIp == MyJsonDecode(g_AllClientIp[i].PublicIP))
		{
			var strInternetBarName = $.trim(MyJsonDecode(g_AllClientIp[i].InternetBarName));
			if (strInternetBarName.length > 0)
				return strInternetBarName;
		}
	}
	return strIp;
}

function ShowEditClientGroupBootBatDialog()
{
	var strOp = "update_client_group_boot_bat";
	var strOpName = "修改";
	
	if (g_strClientGroupId_Selected == null || g_strClientGroupId_Selected == undefined || g_strClientGroupId_Selected == 0)
	{
		$.messager.alert('错误','请先选中所要修改的网吧分组！');
		return;
	}
	// 查找对应数据在数组中的序号
 	for (i = 0; i < g_AllClientGroup.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllClientGroup[i].Id);
 		if (strId == g_strClientGroupId_Selected)
 			break;
 	}
 	if (i >= g_AllClientGroup.length)
 	{
		$.messager.alert('错误','数据错误，请联系管理人员修正！');
		return;
	}
	
	$('#EditClientGroupBootBat__client_group_id').val(g_strClientGroupId_Selected);
	$('#EditClientGroupBootBat__boot_bat').val(MyJsonDecode(g_AllClientGroup[i].boot_bat));
	
	$('#divEditClientGroupBootBatDialog').dialog('center');
	$('#divEditClientGroupBootBatDialog').dialog('open');
}
function Submit_EditClientGroupBootBat()
{
	var strOp = "update_client_group_boot_bat";
	var strOpName = "修改";
	
	if (! checkinput_EditClientGroupBootBat())
		return;
	$.ajax({
	    type: "POST",
	    url: "client_group_ip_mng/" + strOp,
	    data: $("#frmEditClientGroupBootBat").serialize(),
	    timeout: 240*1000,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'分组开机批处理失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'分组开机批处理失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"分组开机批处理成功！");
				$('#divEditClientGroupBootBatDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      GetAllClientGroupAssignInfo(1);
	    }
	});
}
function checkinput_EditClientGroupBootBat()
{
	var boot_bat = $.trim($("#EditClientGroupBootBat__boot_bat").val());
	if (boot_bat.length > 8000)
	{
    $.messager.alert('错误','分组批处理最大长度为8000个字符，请重新输入！');
		return false;
	}
	
	if ($('#sms_verify_code').is(':visible'))
	{
	var sms_verify_code = $.trim($("#sms_verify_code").val());
	if (g_AgentID != 0)
	if (sms_verify_code.length == 0)
	{
    $.messager.alert('错误','短信验证码不能为空，请重新输入！');
		return false;
	}
	}
	return true;
}