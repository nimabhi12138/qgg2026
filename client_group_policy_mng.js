
var g_AllAgentModule = null;
var g_AllModule = null;
//var g_AllClientGroup = null;
var g_AllRouteMacBarName = null;
var g_AllOuterIpBarName = null;
var g_strClientGroupId_Selected = "";
var g_strAgentID_Selected = "";
var g_bUpdateOrInsert = true;

jQuery(document).ready(function() {
	func_Get();
	$("#divEditClientGroupModuleDialog").show();
	$("#divEditClientGroupModuleDialog").dialog('center');
	$("#divEditClientGroupModuleDialog").dialog('close');
	$("#divEditAgentModuleDialog").show();
	$("#divEditAgentModuleDialog").dialog('center');
	$("#divEditAgentModuleDialog").dialog('close');
	$("#divEditModuleParamDialog").show();
	$("#divEditModuleParamDialog").dialog('center');
	$("#divEditModuleParamDialog").dialog('close');
	$("#divEditExcludeRouteMacListDialog").show();
	$("#divEditExcludeRouteMacListDialog").dialog('center');
	$("#divEditExcludeRouteMacListDialog").dialog('close');
	$("#divEditExcludeOuterIpListDialog").show();
	$("#divEditExcludeOuterIpListDialog").dialog('center');
	$("#divEditExcludeOuterIpListDialog").dialog('close');
	$('#divAgentModuleList').css('height', $(window).height() - 80);
	$('#btnEditAgentModule').linkbutton().find('.l-btn-text').addClass('blue_font');
	$('#btnAddAgentModule').linkbutton().find('.l-btn-text').addClass('blue_font');
});
var func_Get = function Get()
{
	//func_GetAllAgentModule();
	SetHdiAgentConfig_ToAgentModuleParam();
}
function SetHdiAgentConfig_ToAgentModuleParam()
{
	$.ajax({
	    type: "GET",
	    url: "client_group_policy_mng/SetHdiAgentConfig_ToAgentModuleParam",
	    data: '',
	    success: function (result) {
	    	func_GetAllAgentModule();
	    }
		});	
}
var func_GetAllAgentModule = function GetAllAgentModule()
{
	var strMsg = "";
	var nItemCount = 0;
	var i = 0;
	var kk = 0;
	g_strClientGroupId_Selected = "";
	var strQuery = "";
	
 	if (g_AgentID_ToDisplay.length > 0)
 		strQuery += "&AgentID_ToDisplay=" + g_AgentID_ToDisplay;
	$.ajax({
	    type: "GET",
	    url: "client_group_policy_mng/get_all_client_group_policy",
	    data: strQuery,
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误','获取客户端模块配置信息失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = '获取客户端模块配置信息失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	    	if (jsonResult.szData == undefined)
	      {
	        	$.messager.alert('错误','获取客户端模块配置信息失败！详细：数据错误');
	          	return;
	     	}
	     	g_AllAgentModule = jsonResult.szData.tAllAgentModule;
	     	g_AllModule = jsonResult.szData.tAllModule;
	     	//g_AllClientGroup = jsonResult.szData.tAllClientGroup;
	     	g_AllRouteMacBarName = jsonResult.szData.tAllClientGroup;  // 无妨
	     	g_AllOuterIpBarName = jsonResult.szData.tAllOuterIpBarName;
	     	var strHtml = "";
	     	
	     	strHtml = "";
	     	for (i = 0; i < g_AllModule.length; i ++)
		      strHtml += '<input type="checkbox" name="CheckBox_module_id_list" value="'+MyJsonDecode(g_AllModule[i].Id)+'" style="margin-left:10px;" />' + MyJsonDecode(g_AllModule[i].module_display_name);
	    	$('#EditClientGroupModule__tdModuleCheckboxList').html(strHtml);
	    	
	     	strHtml = "";
//	     	for (i = 0; i < g_AllClientGroup.length; i ++)
//	     		if (strHtml.indexOf('<option value="'+MyJsonDecode(g_AllClientGroup[i].AgentID)+'">') < 0)
//		      	strHtml += '<option value="'+MyJsonDecode(g_AllClientGroup[i].AgentID)+'">' + MyJsonDecode(g_AllClientGroup[i].AgentName)+'</option>';
	     	for (i = 0; i < g_AllAgentModule.length; i ++)
	     		if (strHtml.indexOf('<option value="'+MyJsonDecode(g_AllAgentModule[i].AgentID)+'">') < 0)
		      	strHtml += '<option value="'+MyJsonDecode(g_AllAgentModule[i].AgentID)+'">' + MyJsonDecode(g_AllAgentModule[i].AgentName)+'</option>';
	    	$('#EditClientGroupModule__AgentID').html(strHtml);
	    	$('#EditAgentModule__AgentID').html(strHtml);	
	    	
	    	Changed_AgentID();
	     	
	     	var strAgentId_Current = "";
				var bIsAgent_NoGroupModule = true;
				var bIsAgent_NoGlobalModule = true;
	     	
	     	strHtml = "";
	     	for (i = 0; i < g_AllAgentModule.length; i ++)
	     	{
	     		var strClientGroupId = MyJsonDecode(g_AllAgentModule[i].ClientGroupId);
	     		var strAgentId = MyJsonDecode(g_AllAgentModule[i].AgentID);
	     		var strAgentName = MyJsonDecode(g_AllAgentModule[i].AgentName);
					var m_d_name_list_GM = MyJsonDecode(g_AllAgentModule[i].m_d_name_list_GM);
					var m_d_name_list = MyJsonDecode(g_AllAgentModule[i].m_d_name_list);
					var m_d_param_list_GM = MyJsonDecode(g_AllAgentModule[i].m_d_param_list_GM);
					var m_d_excl_mac_GM = MyJsonDecode(g_AllAgentModule[i].m_d_excl_mac_GM);
					var m_d_excl_ip_GM = MyJsonDecode(g_AllAgentModule[i].m_d_excl_ip_GM);
					var client_group_name = MyJsonDecode(g_AllAgentModule[i].client_group_name);
					
					
					if (strAgentId_Current != strAgentId)
					{
						strAgentId_Current = strAgentId;
						
						bIsAgent_NoGroupModule = true;
						bIsAgent_NoGlobalModule = true;
						
						// 至少存在一个分组模块或一个全局才显示
						// 不存在分组模块但存在全局模块时只显示默认分组
						for (kk = i/*!!!*/; kk < g_AllAgentModule.length; kk ++)
				 		{
							if (MyJsonDecode(g_AllAgentModule[kk].AgentID) != strAgentId)  // 都是连续的
								break;
							var TT__m_d_name_list_GM = MyJsonDecode(g_AllAgentModule[kk].m_d_name_list_GM);
							var TT__m_d_name_list = MyJsonDecode(g_AllAgentModule[kk].m_d_name_list);
							
							if (TT__m_d_name_list_GM.length > 0 && TT__m_d_name_list_GM != null)
								bIsAgent_NoGlobalModule = false;
							if (TT__m_d_name_list.length    > 0 && TT__m_d_name_list    != null)
								bIsAgent_NoGroupModule = false;
						}
					}
					
					if (bIsAgent_NoGlobalModule && bIsAgent_NoGroupModule)
						continue;
					if (! bIsAgent_NoGlobalModule && bIsAgent_NoGroupModule && client_group_name != "default_client_group")
						continue;
						
					if (client_group_name != "default_client_group")
					{
						m_d_excl_mac_GM = "";
						m_d_excl_ip_GM = "";
						m_d_param_list_GM = "";
					}
	     		
		      strHtml += '<tr id="trClientGroup_'+strClientGroupId+'" onclick="Select_ClientGroup('+strClientGroupId+')">';
		     	strHtml += '<td>';
			    if (g_AgentID == 0)
			    if (g_LevelType == 0)
					strHtml += 		'<a id="ahAgentNameLinkPanel_'+strAgentId+'" href="#" onmouseenter="Show_AgentNameLinkPanel_Common('+strAgentId+','+strAgentId+',\''+strAgentName+'\');">';
	        strHtml += 			strAgentName;
			    if (g_AgentID == 0)
			    if (g_LevelType == 0)
					strHtml += 		'</a>';
		     	strHtml += '</td>';
	        strHtml += '<td>'+m_d_name_list_GM+'</td>';
	        strHtml += '<td>'+GenerateModuleParamHtml(m_d_param_list_GM)+'</td>';
	        strHtml += '<td>'+GenerateExcludeRouteMacListHtml(m_d_excl_mac_GM, strAgentId)+'</td>';
	        strHtml += '<td>'+GenerateExcludeOuterIpListHtml(m_d_excl_ip_GM, strAgentId)+'</td>';
	        strHtml += '<td>'+client_group_name.replace("default_client_group","默认分组")+'</td>';
	        strHtml += '<td>'+m_d_name_list+'</td>';
		      strHtml += '</tr>';
	    	}
	    	$('#tbdAgentModuleList').html(strHtml);
	    }
	});
}
function Select_ClientGroup(strAgentID)
{
	var i = 0;
	g_strClientGroupId_Selected = strAgentID;
 	for (i = 0; i < g_AllAgentModule.length; i ++)
 	{
 		var strId = MyJsonDecode(g_AllAgentModule[i].ClientGroupId);
 		if (strId == g_strClientGroupId_Selected)
			$('#trClientGroup_'+strId).addClass('danger');
		else
			$('#trClientGroup_'+strId).removeClass('danger');
			
 		if (strId == g_strClientGroupId_Selected)
 			g_strAgentID_Selected = MyJsonDecode(g_AllAgentModule[i].AgentID);
 	}
}
var func_Submit = function Submit()
{
}
function DeleteAgentModule()
{
	if (g_strClientGroupId_Selected == null || g_strClientGroupId_Selected == undefined || g_strClientGroupId_Selected == 0)
	{
		$.messager.alert('错误','请先选中所要删除的客户端模块配置！');
		return;
	}
	$.messager.confirm('确认操作','您确定要删除此客户端模块配置吗？',function(bYes){   
		if (bYes)
		{
			$.ajax({
			    type: "GET",
			    url: "client_group_policy_mng/delete_client_group_module?client_group_id=" + g_strClientGroupId_Selected,
			    data: '',
			    success: function (result) {
			    	var strHtml = "";
			    	result = RemoveDebugInfoInJsonResult(result);
			    	if (result.length == 0)
			      {
			      	$.messager.alert('错误','删除客户端模块配置失败！详细：数据错误');
			        	return;
			   		}
			    	var jsonResult = jQuery.parseJSON(result);
			    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
			      {
			      	strMsg = '删除客户端模块配置失败！详细：' + MyJsonDecode(jsonResult.szMsg);
			      	$.messager.alert('错误', strMsg);
			        	return;
			   		}
			      $.messager.alert('提示', "删除客户端模块配置成功！");
			      
			      // 删除页面元素，简单处理直接重新取一遍数据
			      SetHdiAgentConfig_ToAgentModuleParam();
			    }
			});
		}
	});
}
function UpdateClientGroupModule()
{
	g_bUpdateOrInsert = true;
	ShowEditClientGroupModuleDialog();
}
function InsertClientGroupModule()
{
	g_bUpdateOrInsert = false;
	ShowEditClientGroupModuleDialog();
}
function ShowEditClientGroupModuleDialog()
{
	var strOp = "insert_client_group_module";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client_group_module";
		strOpName = "修改";
	}
	
	if (! g_bUpdateOrInsert)
	{
		$('#client_group_module_id').val('');  // 新增要清空Id
		
		Changed_AgentID();
	}
	else
	{
		if (g_strClientGroupId_Selected == null || g_strClientGroupId_Selected == undefined || g_strClientGroupId_Selected == 0)
		{
			$.messager.alert('错误','请先选中所要修改的客户端模块配置！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllAgentModule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllAgentModule[i].ClientGroupId);
	 		if (strId == g_strClientGroupId_Selected)
	 			break;
	 	}
	 	if (i >= g_AllAgentModule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#EditClientGroupModule__AgentID').val(MyJsonDecode(g_AllAgentModule[i].AgentID));
		Changed_AgentID();
		$('#EditClientGroupModule__client_group_id').val(g_strClientGroupId_Selected);
		$('#EditClientGroupModule__AgentName').val(MyJsonDecode(g_AllAgentModule[i].AgentName));
		
		var m_id_list = MyJsonDecode(g_AllAgentModule[i].m_id_list);
		$('#EditClientGroupModule__tdModuleCheckboxList').find('input[name="CheckBox_module_id_list"]').each(function(){
				$(this).prop('checked', IsInCommonList(m_id_list, "_", $(this).val()));
		});
	}
		
	//$("#divEditClientGroupModuleDialog").dialog({title: strOpName + '客户端分组模块配置'});
	$("#divEditClientGroupModuleDialog").dialog({title: '新增/修改客户端分组模块配置'});
	$('#divEditClientGroupModuleDialog').dialog('center');
	$('#divEditClientGroupModuleDialog').dialog('open');
}
function Submit_EditClientGroupModule()
{
	var strOp = "insert_client_group_module";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_client_group_module";
		strOpName = "修改";
	}
	if (! checkinput_EditClientGroupModule())
		return;
	// 构造id list
	var module_id_list = "";
	$('#EditClientGroupModule__tdModuleCheckboxList').find('input[name="CheckBox_module_id_list"]:checked').each(function(){
			module_id_list += $(this).val() + "_";
	});
	$('#EditClientGroupModule__module_id_list').val(module_id_list);
	
	$.ajax({
	    type: "POST",
	    url: "client_group_policy_mng/" + strOp,
	    data: $("#frmEditClientGroupModule").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'客户端模块配置失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'客户端模块配置失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"客户端模块配置成功！");
				$('#divEditClientGroupModuleDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      SetHdiAgentConfig_ToAgentModuleParam();
	    }
	});
}
function checkinput_EditClientGroupModule()
{
	// 分组模块中不能存在和全局模块相同项
	var bExisted_Identical_GlobalModule = false;
	$('#EditClientGroupModule__tdModuleCheckboxList').find('input[name="CheckBox_module_id_list"]:checked').each(function(){
			var module_id = $(this).val();
     	for (i = 0; i < g_AllAgentModule.length; i ++)
     	{
     		if (g_strAgentID_Selected != MyJsonDecode(g_AllAgentModule[i].AgentID))
     			continue;
     		var strAgentName = MyJsonDecode(g_AllAgentModule[i].AgentName);
				var m_id_list_GM = MyJsonDecode(g_AllAgentModule[i].m_id_list_GM);
				if (IsInCommonList(m_id_list_GM, "_", module_id))
				{
					bExisted_Identical_GlobalModule = true;
					return;
				}
			}
	});
	if (bExisted_Identical_GlobalModule)
	{
		$.messager.alert('错误', '分组模块和全局模块不能存在相同项！请检查输入');
		return false;
	}
	return true;
}

function Changed_AgentID()
{
	var AgentID = $('#EditClientGroupModule__AgentID option:selected').val();
 	var strHtml = "";
 	var i = 0;
 	
 	strHtml = "";
 	for (i = 0; i < g_AllAgentModule.length; i ++)
 		if (AgentID == MyJsonDecode(g_AllAgentModule[i].AgentID))
    	strHtml += '<option value="'+MyJsonDecode(g_AllAgentModule[i].ClientGroupId)+'">' + MyJsonDecode(g_AllAgentModule[i].client_group_name).replace("default_client_group","默认分组")+'</option>';
	$('#EditClientGroupModule__client_group_id').html(strHtml);
	
	Change_Agent_ModuleList();
	
	
  Change_Select_AgentModule();
  
  if (g_strClientGroupId_Selected != 0)
		$('#EditClientGroupModule__client_group_id').val(g_strClientGroupId_Selected);
	Change_Select_ClientGroupModule();
}
function Change_Agent_ModuleList()
{
   	var strHtml = "";
   	var i = 0;
   	
   	var strAgentID_Seleted = $('#EditClientGroupModule__AgentID option:selected').val();
   	
//   	strHtml = "";
//   	if (g_AgentID != strAgentID_Seleted)
//   	{
//   	strHtml += '<div style="width:100%;border-width:0 0 1px 0;border-color:#ccc;border-style:solid;padding-bottom:5px;">';
//   	for (i = 0; i < g_AllModule.length; i ++)
//   	{
//   		var strAgentID = MyJsonDecode(g_AllModule[i].AgentID);
//   		if (	 (g_AgentID == strAgentID)   )
//      		strHtml += '<input type="checkbox" name="CheckBox_module_id_list" value="'+MyJsonDecode(g_AllModule[i].Id)+'" style="margin-left:10px;" />' + MyJsonDecode(g_AllModule[i].module_display_name);
//  	}
//   	strHtml += '</div>';
//  	}
//   	strHtml += '<div style="width:100%;margin-top:12px;">';
//   	for (i = 0; i < g_AllModule.length; i ++)
//   	{
//   		var strAgentID = MyJsonDecode(g_AllModule[i].AgentID);
//   		if (  strAgentID == strAgentID_Seleted    )
//      		strHtml += '<input type="checkbox" name="CheckBox_module_id_list" value="'+MyJsonDecode(g_AllModule[i].Id)+'" style="margin-left:10px;" />' + MyJsonDecode(g_AllModule[i].module_display_name);
//  	}
//   	strHtml += '</div>';

   	var strHtml_AgentVisibleModule = "";
   	for (i = 0; i < g_AllModule.length; i ++)
   	{
   		var strAgentID = MyJsonDecode(g_AllModule[i].AgentID);
   		var agent_visible = MyJsonDecode(g_AllModule[i].agent_visible);
   		if (strAgentID == 0    && (agent_visible == 1 || agent_visible == 4)  )
      		strHtml_AgentVisibleModule += '<li style="width:150px;float:left;"><input type="checkbox" name="CheckBox_module_id_list" value="'+MyJsonDecode(g_AllModule[i].Id)
      								+ '" style="margin-left:10px;" onclick="'+((agent_visible == 4 && g_AgentID!=0)?'ClearAgentReadOnlyModule(this);':'')+'" />' + MyJsonDecode(g_AllModule[i].module_display_name) + '</li>';
  	}
   	
   	strHtml = "";
   	if (g_AgentID != strAgentID_Seleted || strHtml_AgentVisibleModule.length > 0)
   	{
   	strHtml += '<ul style="width:100%;border-width:0 0 1px 0;border-color:#ccc;border-style:solid;list-style:none;margin:0;padding:0;padding-bottom:5px;">';
   	var strHtml_Items = "";
   	for (i = 0; i < g_AllModule.length; i ++)
   	{
   		var strAgentID = MyJsonDecode(g_AllModule[i].AgentID);
   		var agent_visible = MyJsonDecode(g_AllModule[i].agent_visible);
   		if (	 (g_AgentID == strAgentID && g_AgentID != strAgentID_Seleted)
   				|| (strAgentID == 0   && (agent_visible == 1 || agent_visible == 4)    )   )
      		strHtml_Items += '<li style="width:150px;float:left;"><input type="checkbox" name="CheckBox_module_id_list" value="'+MyJsonDecode(g_AllModule[i].Id)
      							+'" style="margin-left:10px;" onclick="'+((agent_visible == 4 && g_AgentID!=0)?'ClearAgentReadOnlyModule(this);':'')+'" />' + MyJsonDecode(g_AllModule[i].module_display_name) + '</li>';
  	}
  	if (strHtml_Items.length > 0)
  		strHtml += '<li class="blue_font" style="margin-bottom:3px;">官方模块</li>';
   	strHtml += strHtml_Items;
   	strHtml += '<li style="clear:both;"></li>';
   	strHtml += '</ul>';
  	}
   	var strHtml_Items = "";
   	strHtml += '<ul style="width:100%;list-style:none;margin:0;padding:0;margin-top:12px;">';
   	for (i = 0; i < g_AllModule.length; i ++)
   	{
   		var strAgentID = MyJsonDecode(g_AllModule[i].AgentID);
   		if (  strAgentID == strAgentID_Seleted       )
      		strHtml_Items += '<li style="width:150px;float:left;"><input type="checkbox" name="CheckBox_module_id_list" value="'+MyJsonDecode(g_AllModule[i].Id)+'" style="margin-left:10px;" />' + MyJsonDecode(g_AllModule[i].module_display_name) + '</li>';
  	}
  	if (strHtml_Items.length > 0)
  		strHtml += '<li class="blue_font" style="margin-bottom:3px;">自定义模块</li>';
   	strHtml += strHtml_Items;
   	strHtml += '<li style="clear:both;"></li>';
   	strHtml += '</ul>';
  	$('#EditClientGroupModule__tdModuleCheckboxList').html(strHtml);
}

function Change_Agent_ModuleList_EditAgentModule()
{
   	var strHtml = "";
   	var i = 0;
   	
   	var strAgentID_Seleted = $('#EditAgentModule__AgentID option:selected').val();
   	
   	var strHtml_AgentVisibleModule = "";
   	for (i = 0; i < g_AllModule.length; i ++)
   	{
   		var strAgentID = MyJsonDecode(g_AllModule[i].AgentID);
   		var agent_visible = MyJsonDecode(g_AllModule[i].agent_visible);
   		if (strAgentID == 0    && (agent_visible == 1 || agent_visible == 4)  )
      		strHtml_AgentVisibleModule += '<li style="width:150px;float:left;"><input type="checkbox" name="CheckBox_module_id_list" value="'+MyJsonDecode(g_AllModule[i].Id)
      						+'" style="margin-left:10px;" onclick="'+((agent_visible == 4 && g_AgentID!=0)?'ClearAgentReadOnlyModule(this);':'')+'" />' + MyJsonDecode(g_AllModule[i].module_display_name) + '</li>';
  	}
   	
   	strHtml = "";
   	if (g_AgentID != strAgentID_Seleted || strHtml_AgentVisibleModule.length > 0)
   	{
   	strHtml += '<ul style="width:100%;border-width:0 0 1px 0;border-color:#ccc;border-style:solid;list-style:none;margin:0;padding:0;padding-bottom:5px;">';
   	var strHtml_Items = "";
   	for (i = 0; i < g_AllModule.length; i ++)
   	{
   		var strAgentID = MyJsonDecode(g_AllModule[i].AgentID);
   		var agent_visible = MyJsonDecode(g_AllModule[i].agent_visible);
   		if (	 (g_AgentID == strAgentID && g_AgentID != strAgentID_Seleted)
   				|| (strAgentID == 0    && (agent_visible == 1 || agent_visible == 4)  )   )
      		strHtml_Items += '<li style="width:150px;float:left;"><input type="checkbox" name="CheckBox_module_id_list" value="'+MyJsonDecode(g_AllModule[i].Id)
      								+'" style="margin-left:10px;" onclick="'+((agent_visible == 4 && g_AgentID!=0)?'ClearAgentReadOnlyModule(this);':'')+'" />' + MyJsonDecode(g_AllModule[i].module_display_name) + '</li>';
  	}
  	if (strHtml_Items.length > 0)
  		strHtml += '<li class="blue_font" style="margin-bottom:3px;">官方模块</li>';
   	strHtml += strHtml_Items;
   	strHtml += '<li style="clear:both;"></li>';
   	strHtml += '</ul>';
  	}
   	var strHtml_Items = "";
   	strHtml += '<ul style="width:100%;list-style:none;margin:0;padding:0;margin-top:12px;">';
   	for (i = 0; i < g_AllModule.length; i ++)
   	{
   		var strAgentID = MyJsonDecode(g_AllModule[i].AgentID);
   		if (  strAgentID == strAgentID_Seleted       )
      		strHtml_Items += '<li style="width:150px;float:left;"><input type="checkbox" name="CheckBox_module_id_list" value="'+MyJsonDecode(g_AllModule[i].Id)+'" style="margin-left:10px;" />' + MyJsonDecode(g_AllModule[i].module_display_name) + '</li>';
  	}
  	if (strHtml_Items.length > 0)
  		strHtml += '<li class="blue_font" style="margin-bottom:3px;">自定义模块</li>';
   	strHtml += strHtml_Items;
   	strHtml += '<li style="clear:both;"></li>';
   	strHtml += '</ul>';
  	$('#EditAgentModule__tdModuleCheckboxList').html(strHtml);
}
function UpdateAgentModule()
{
	g_bUpdateOrInsert = true;
	ShowEditAgentModuleDialog();
}
function InsertAgentModule()
{
	g_bUpdateOrInsert = false;
	ShowEditAgentModuleDialog();
}
function ShowEditAgentModuleDialog()
{
	var strOp = "insert_agent_module";
	var strOpName = "新增";
	
	Change_Agent_ModuleList_EditAgentModule();
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_agent_module";
		strOpName = "修改";
	}
	if (! g_bUpdateOrInsert)
		$('#agent_module_id').val('');  // 新增要清空Id
	else
	{
		if (g_strAgentID_Selected == null || g_strAgentID_Selected == undefined || g_strAgentID_Selected == 0)
		{
			$.messager.alert('错误','请先选中所要修改的客户端模块配置！');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllAgentModule.length; i ++)
	 	{
	 		var strId = MyJsonDecode(g_AllAgentModule[i].AgentID);
	 		if (strId == g_strAgentID_Selected)
	 			break;
	 	}
	 	if (i >= g_AllAgentModule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		$('#EditAgentModule__AgentID').val(g_strAgentID_Selected);
		$('#EditAgentModule__AgentName').val(MyJsonDecode(g_AllAgentModule[i].AgentName));
		
		Change_Agent_ModuleList();
		
		var m_id_list_GM = MyJsonDecode(g_AllAgentModule[i].m_id_list_GM);
		$('#EditAgentModule__tdModuleCheckboxList').find('input[name="CheckBox_module_id_list"]').each(function(){
				$(this).prop('checked', IsInCommonList(m_id_list_GM, "_", $(this).val()));
		});
	}
		
	//$("#divEditAgentModuleDialog").dialog({title: strOpName + '客户端全局模块配置'});
	$("#divEditAgentModuleDialog").dialog({title: '新增/修改客户端全局模块配置'});
	$('#divEditAgentModuleDialog').dialog('center');
	$('#divEditAgentModuleDialog').dialog('open');
}
function Submit_EditAgentModule()
{
	var strOp = "insert_agent_module";
	var strOpName = "新增";
	
	if (g_bUpdateOrInsert)
	{
		strOp = "update_agent_module";
		strOpName = "修改";
	}
	if (! checkinput_EditAgentModule())
		return;
	
	// 20250402 带带陪玩和蝌蚪陪玩二选一
	if (g_AgentID > 0)
	{
		var bDaidai_Selected = false;
		var bKedou_Selected = false;
		$('#EditAgentModule__tdModuleCheckboxList').find('input[name="CheckBox_module_id_list"]:checked').each(function(){
			for (var kk = 0; kk < g_AllModule.length; kk ++)
				if (MyJsonDecode(g_AllModule[kk].Id) == $(this).val() && MyJsonDecode(g_AllModule[kk].module_name) == "daidai")
					bDaidai_Selected = true;
			for (var kk = 0; kk < g_AllModule.length; kk ++)
				if (MyJsonDecode(g_AllModule[kk].Id) == $(this).val() && MyJsonDecode(g_AllModule[kk].module_name) == "Nav9")
					bKedou_Selected = true;
		});
		if (bDaidai_Selected && bKedou_Selected)
		{
			$.messager.alert('提示', '不能同时选中带带陪玩和蝌蚪陪玩，请检查输入');
			return;
		}
	}
	
	
	// 构造id list
	var module_id_list = "";
	$('#EditAgentModule__tdModuleCheckboxList').find('input[name="CheckBox_module_id_list"]:checked').each(function(){
			module_id_list += $(this).val() + "_";
	});
	$('#EditAgentModule__module_id_list').val(module_id_list);
	
	$.ajax({
	    type: "POST",
	    url: "agent_module_mng/" + strOp,
	    data: $("#frmEditAgentModule").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'客户端模块配置失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'客户端模块配置失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"客户端模块配置成功！");
				$('#divEditAgentModuleDialog').dialog('close');
	      
	      // 删除页面元素，简单处理直接重新取一遍数据
	      SetHdiAgentConfig_ToAgentModuleParam();
	    }
	});
}
function checkinput_EditAgentModule()
{
	var nAssigned_Nav7_DaiDai_ModuleCount = 0;
	$('#EditAgentModule__tdModuleCheckboxList').find('input[name="CheckBox_module_id_list"]').each(function(){
			if (! $(this).prop("checked"))
				return true;
			var strCheckBox_Text = $(this).parent().text();
			//if (strCheckBox_Text == "开黑陪玩[导航7]" || strCheckBox_Text == "游戏陪玩")
			if (strCheckBox_Text.indexOf("陪玩") > 0)
				nAssigned_Nav7_DaiDai_ModuleCount ++;
	});
	if (nAssigned_Nav7_DaiDai_ModuleCount >=2)
	{
			$.messager.alert('错误','导航7和带带陪玩模块不能同时分配！请二选一');
			return false;
	}
	return true;
}

function GenerateModuleParamHtml(m_d_param_list_GM)
{
	var strHtml = "";
	var arModuleParamArray = m_d_param_list_GM.split('*^*');
	var i = 0;
	var kk = 0;
	
		strHtml += '<ul style="margin:0px;padding:0px;word-break:break-all;">';
	for (i = 0; i < arModuleParamArray.length; i ++)
	{
		var strItemList = arModuleParamArray[i];
		var arItemArray = strItemList.split('@#');
		if (arItemArray.length < 3)
			continue;
			
		var strParamTitle = "";
		var strParam = arItemArray[2];
		
		var strModuelName = arItemArray[1];
		strModuelName = strModuelName.toLowerCase();  // 转换为小写！！！！！！
		if (strModuelName.indexOf("导航2") >= 0 || strModuelName == "nav2")
		{
			strParamTitle = "图标个数";
			if (arItemArray[2].length == 0)
				arItemArray[2] = "2";   //<<<  20200528导航2重新开通  //>>>
				
			strParam = arItemArray[2];
			if (strParam == "1")
				strParam = "1个图标";
			else if (strParam == "3")
				strParam = "3个图标";
			else if (strParam == "2")
				strParam = "2个图标";
			else
				strParam = "2个图标";   //<<<  20200528导航2重新开通  //>>>
		}
		else if (strModuelName.indexOf("导航3") >= 0 || strModuelName == "nav3")
		{
			strParamTitle = "图标个数";
			if (arItemArray[2].length == 0)
				arItemArray[2] = "1";   //<<<  20200429导航3改为默认一个图标，导航2已关闭，先不管  //>>>
				
			strParam = arItemArray[2];
			if (strParam == "1")
				strParam = "1个图标";
			else if (strParam == "3")
				strParam = "3个图标";
			else if (strParam == "2")
				strParam = "2个图标";
			else
				strParam = "2个图标";   //<<<  20200429导航3改为默认一个图标，导航2已关闭，先不管  //>>>
		}
		else if (strModuelName.indexOf("导航6") >= 0 || strModuelName == "nav6")
		{
			strParamTitle = "不挂载Steam";
			if (arItemArray[2] != "1")
				arItemArray[2] = "0";
				
			if (arItemArray[2] != "1")
				strParam = "不挂载Steam：0";
			else
				strParam = "不挂载Steam：1";
		}
		else if (strModuelName.indexOf("日志一卡通") >= 0 || strModuelName == "feedbacklog")
		{
			strParamTitle = "是否隐藏一卡通桌标";
			if (arItemArray[2] == "dont_hide")
				arItemArray[2] = "0";
			else
				arItemArray[2] = "1";
				
			if (arItemArray[2] == "1")
				strParam = "隐藏桌标：1";
			else
				strParam = "隐藏桌标：0";
		}
		else if (strModuelName.indexOf("logg") >= 0 || strModuelName == "log_g" || strModuelName.indexOf("logq") >= 0 || strModuelName == "log_q")  // 此处的strModuelName为显示名
		{
			strParamTitle = "QQ广告类型";
			if (arItemArray[2].length == 0)
				arItemArray[2] = "0";
				
			strParam = arItemArray[2];
			if (strParam == "1")
				strParam = "QQ挂载";
			else if (strParam == "2")
				strParam = "QQ挂载 + 弹窗";
			else if (strParam == "0")
				strParam = "无QQ广告";
			else
				strParam = "未知";
		}
		
		if (strParam.length == 0)
			continue;
		
		strHtml += '<li style="list-style:none;">';
		strHtml += '<a onclick="ShowEditModuleParamDialog('+arItemArray[0]+', '+arItemArray[2]+', \''+strParamTitle+'\');">';
		strHtml += arItemArray[1] + " - " + strParam;
		strHtml += "</a>";
		strHtml += '</li>';
	}
		strHtml += '</ul>';
	return strHtml;
}
function GenerateExcludeRouteMacListHtml(m_d_excl_mac_GM, AgentID)
{
	var strHtml = "";
	var arModuleParamArray = m_d_excl_mac_GM.split('*^*');
	var i = 0;
	var kk = 0;
	
		strHtml += '<ul style="margin:0px;padding:0px;word-break:break-all;">';
	for (i = 0; i < arModuleParamArray.length; i ++)
	{
		var strItemList = arModuleParamArray[i];
		var arItemArray = strItemList.split('@#');
		if (arItemArray.length < 3)
			continue;
		//if (arItemArray[2].length == 0)
		//	continue;
		
		var strExcludeList = arItemArray[2].replace(/\r/g,"").replace(/\n/g,"");
		
		//<<<
		var strRouteMac_Text = "";
		var arRouteMac_Array = strExcludeList.split(';');
		for (var kk = 0; kk < arRouteMac_Array.length; kk ++)
		{
			var strRouteMac_Item = arRouteMac_Array[kk];
			if (strRouteMac_Item.length == 0)
				break;
			var bbb = 0;
	     	for (bbb = 0; bbb < g_AllRouteMacBarName.length; bbb ++)
	     	{
	     		if (AgentID != MyJsonDecode(g_AllRouteMacBarName[bbb].AgentID))
					continue;
		     	var route_mac = MyJsonDecode(g_AllRouteMacBarName[bbb].route_mac);
				if (strRouteMac_Item == route_mac || strRouteMac_Item == "++" + route_mac)
	     		{
		     		var str = MyJsonDecode(g_AllRouteMacBarName[bbb].internet_bar_name);
		     		if (str.length > 0)
					{
						if (strRouteMac_Item == "++" + route_mac)
							str = "++" + str;
		     			strRouteMac_Text += str + ";";
						break;
					}
				}
		    }
			if (bbb >= g_AllRouteMacBarName.length)
		     	strRouteMac_Text += strRouteMac_Item + ";";
		}
		//>>>
			
		strHtml += '<li style="list-style:none;">';
		strHtml += '<a onclick="ShowEditExcludeRouteMacListDialog('+arItemArray[0]+', \''+strExcludeList+'\','+AgentID+');">';
		strHtml += arItemArray[1] + " - " + strRouteMac_Text;
		strHtml += "</a>";
		strHtml += '</li>';
	}
		strHtml += '</ul>';
	return strHtml;
}
function GenerateExcludeOuterIpListHtml(m_d_excl_ip_GM, AgentID)
{
	var strHtml = "";
	var arModuleParamArray = m_d_excl_ip_GM.split('*^*');
	var i = 0;
	var kk = 0;
	
	for (i = 0; i < arModuleParamArray.length; i ++)
	{
		var strItemList = arModuleParamArray[i];
		var arItemArray = strItemList.split('@#');
		if (arItemArray.length < 3)
			continue;
		//if (arItemArray[2].length == 0)
		//	continue;
	
		var strExcludeList = arItemArray[2].replace(/\r/g,"").replace(/\n/g,"");
		
		//<<<
		var strOuterIp_Text = "";
		var arOuterIp_Array = strExcludeList.split(';');
		for (var kk = 0; kk < arOuterIp_Array.length; kk ++)
		{
			var strOuterIp_Item = arOuterIp_Array[kk];
			if (strOuterIp_Item.length == 0)
				break;
			var bbb = 0;
	     	for (bbb = 0; bbb < g_AllOuterIpBarName.length; bbb ++)
	     	{
	     		if (AgentID != MyJsonDecode(g_AllOuterIpBarName[bbb].AgentID))
					continue;
		     	var client_ip = MyJsonDecode(g_AllOuterIpBarName[bbb].client_ip);
				if (strOuterIp_Item == client_ip || strOuterIp_Item == "++" + client_ip)
	     		{
		     		var str = MyJsonDecode(g_AllOuterIpBarName[bbb].internet_bar_name);
		     		if (str.length > 0)
					{
						if (strOuterIp_Item == "++" + client_ip)
							str = "++" + str;
		     			strOuterIp_Text += str + ";";
						break;
					}
				}
		    }
			if (bbb >= g_AllOuterIpBarName.length)
		     	strOuterIp_Text += strOuterIp_Item + ";";
		}
		//>>>
		
		strHtml += '<ul style="margin:0px;padding:0px;word-break:break-all;">';
		strHtml += '<li style="list-style:none;">';
		strHtml += '<a onclick="ShowEditExcludeOuterIpListDialog('+arItemArray[0]+', \''+strExcludeList+'\','+AgentID+');">';
		strHtml += arItemArray[1] + " - " + strOuterIp_Text;
		strHtml += "</a>";
		strHtml += '</li>';
		strHtml += '</ul>';
	}
	return strHtml;
}

function ShowEditModuleParamDialog(agent_module_id, icon_count, strParamTitle)
{
	{
		$('#EditModuleParam__agent_module_id').val(String(agent_module_id));
		$('#EditModuleParam__icon_count').val(String(icon_count));
		$('#spnParamTitle').html(strParamTitle);
	}
	if (strParamTitle == "不挂载Steam")
		$('#spnTips').show();
	else
		$('#spnTips').hide();
		
	//$("#divEditModuleParamDialog").dialog({title: strOpName + '客户端全局模块配置'});
	$('#divEditModuleParamDialog').dialog('center');
	$('#divEditModuleParamDialog').dialog('open');
}
function Submit_EditModuleParam()
{
//	var strOp = "insert_agent_module";
//	var strOpName = "新增";
//	
//	if (g_bUpdateOrInsert)
	{
		strOp = "update_agent_module";
		strOpName = "修改";
	}
	if (! checkinput_EditModuleParam())
		return;
	
	$.ajax({
	    type: "POST",
	    url: "client_group_policy_mng/set_yy_icon_count",
	    data: $("#frmEditModuleParam").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'客户端模块参数失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'客户端模块参数失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"客户端模块参数成功！");
				$('#divEditModuleParamDialog').dialog('close');
	      
	      func_Get();
	    }
	});
}
function checkinput_EditModuleParam()
{
	var strParamTitle = $('#spnParamTitle').html();
	if (strParamTitle == "图标个数")
	{
		var icon_count = $.trim($('#EditModuleParam__icon_count').val());
		if (icon_count == "")
			icon_count = 1;
		if (icon_count != 1 && icon_count != 2 && icon_count != 3)
		{
		  $.messager.alert('错误', "图标个数只能输入1、2、3其中之一！");
			return false;
		}
	}
	else if (strParamTitle == "不挂载Steam")
	{
		var icon_count = $.trim($('#EditModuleParam__icon_count').val());
		if (icon_count != 1 && icon_count != 0)
		{
		  $.messager.alert('错误', "图标个数只能输入0、1其中之一！");
			return false;
		}
	}
	else if (strParamTitle == "QQ广告类型")
	{
		var icon_count = $.trim($('#EditModuleParam__icon_count').val());
		if (icon_count != 1 && icon_count != 0 && icon_count != 2)
		{
		  $.messager.alert('错误', "QQ广告类型只能输入0、1、2其中之一！");
			return false;
		}
	}
	return true;
}
function ShowEditExcludeRouteMacListDialog(agent_module_id, icon_count, AgentID)
{
	{
		$('#EditExcludeRouteMacList__agent_module_id').val(String(agent_module_id));
		$('#EditExcludeRouteMacList__exclude_route_mac_list').val(icon_count);
	}
	//<<< 20260317
	if (g_AgentID == 0)
	{
		if (icon_count.indexOf("+") >= 0)
			g_bExcludeOrInclude_RouteMac = false;
		else
			g_bExcludeOrInclude_RouteMac = true;
		$("#ckbSelect_ExcludeOrInclude_RouteMac").prop('checked', ! g_bExcludeOrInclude_RouteMac);
		Select_ExcludeOrInclude_RouteMac();
	}
	//>>>
	
	var strHtml = "";
	var i = 0;
	     	strHtml = "";
	     	for (i = 0; i < g_AllRouteMacBarName.length; i ++)
	     	{
	     		if (AgentID == MyJsonDecode(g_AllRouteMacBarName[i].AgentID))
	     		{
					var str = "";
		     		var route_mac = MyJsonDecode(g_AllRouteMacBarName[i].route_mac);
		     		var internet_bar_name = MyJsonDecode(g_AllRouteMacBarName[i].internet_bar_name);
					if (internet_bar_name.length > 0)
						str = '<span class="switch_disp_bar_name">' + internet_bar_name + '</span>' + '<span class="switch_disp_route_mac" style="display:none;">' + route_mac + '</span>';
					else
		     			str = route_mac;
		     		var strChecked = "";
		     		if (icon_count.indexOf(route_mac) >= 0)
		     			strChecked = " checked ";
		      	strHtml += '<li style="width:120px;list-style:none;float:left;">';
		      	strHtml += '<input type="checkbox" value="'+route_mac+'" style="" onclick="SelectCheckBox_ExcludeRouteMac(this, \''+route_mac+'\');" '+strChecked+' />' + str;
		      	strHtml += '</li>';
		      }
		    }
	    	$('#ulAllRouteMacSelectList').html(strHtml);
		
	//$("#divEditExcludeRouteMacListDialog").dialog({title: strOpName + '客户端全局模块配置'});
	$('#divEditExcludeRouteMacListDialog').dialog('center');
	$('#divEditExcludeRouteMacListDialog').dialog('open');
	
	Switch_DisplayNameMac();
}
function Submit_EditExcludeRouteMacList()
{
//	var strOp = "insert_agent_module";
//	var strOpName = "新增";
//	
//	if (g_bUpdateOrInsert)
	{
		strOp = "update_agent_module";
		strOpName = "修改";
	}
	if (! checkinput_EditExcludeRouteMacList())
		return;
	
	$.ajax({
	    type: "POST",
	    url: "client_group_policy_mng/set_exclude_route_mac_list",
	    data: $("#frmEditExcludeRouteMacList").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'客户端排除路由器MAC列表失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'客户端排除路由器MAC列表失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"客户端排除路由器MAC列表成功！");
				$('#divEditExcludeRouteMacListDialog').dialog('close');
	      
	      func_Get();
	    }
	});
}
function checkinput_EditExcludeRouteMacList()
{
	if (! /^[0-9a-zA-Z;+]*$/g.test($('#EditExcludeRouteMacList__exclude_route_mac_list').val()))
  {
  	$.messager.alert('错误','输入有误！只能输入MAC、英文分号、加号');
    return false;
	}
	return true;
}
function ShowEditExcludeOuterIpListDialog(agent_module_id, icon_count, AgentID)
{
	{
		$('#EditExcludeOuterIpList__agent_module_id').val(String(agent_module_id));
		$('#EditExcludeOuterIpList__exclude_outer_ip_list').val(icon_count);
	}
	//<<< 20260317
	if (g_AgentID == 0)
	{
		if (icon_count.indexOf("+") >= 0)
			g_bExcludeOrInclude_OuterIp = false;
		else
			g_bExcludeOrInclude_OuterIp = true;
		$("#ckbSelect_ExcludeOrInclude_OuterIp").prop('checked', ! g_bExcludeOrInclude_OuterIp);
		Select_ExcludeOrInclude_OuterIp();
	}
	//>>>
	
	var strHtml = "";
	var i = 0;
	     	strHtml = "";
	     	for (i = 0; i < g_AllOuterIpBarName.length; i ++)
	     	{
	     		if (AgentID == MyJsonDecode(g_AllOuterIpBarName[i].AgentID))
	     		{
					var str = "";
		     		var client_ip = MyJsonDecode(g_AllOuterIpBarName[i].client_ip);
		     		var internet_bar_name = MyJsonDecode(g_AllOuterIpBarName[i].internet_bar_name);
					if (internet_bar_name.length > 0)
						str = '<span class="switch_disp_bar_name">' + internet_bar_name + '</span>' + '<span class="switch_disp_ip" style="display:none;">' + client_ip + '</span>';
					else
		     			str = client_ip;
					
		     		var strChecked = "";
		     		if (icon_count.indexOf(client_ip+";") >= 0 || icon_count.indexOf(";"+client_ip) >= 0 || icon_count == client_ip)
		     			strChecked = " checked ";
		      	strHtml += '<li style="width:140px;list-style:none;float:left;">';
		      	strHtml += '<input type="checkbox" value="'+client_ip+'" style="" onclick="SelectCheckBox_ExcludeOuterIp(this, \''+client_ip+'\');" '+strChecked+' />' + str;
		      	strHtml += '</li>';
		      }
		    }
	    	$('#ulAllIpSelectList').html(strHtml);
		
	//$("#divEditExcludeOuterIpListDialog").dialog({title: strOpName + '客户端全局模块配置'});
	$('#divEditExcludeOuterIpListDialog').dialog('center');
	$('#divEditExcludeOuterIpListDialog').dialog('open');
	
	Switch_DisplayNameIp();
}
function Submit_EditExcludeOuterIpList()
{
//	var strOp = "insert_agent_module";
//	var strOpName = "新增";
//	
//	if (g_bUpdateOrInsert)
	{
		strOp = "update_agent_module";
		strOpName = "修改";
	}
	if (! checkinput_EditExcludeOuterIpList())
		return;
	
	$.ajax({
	    type: "POST",
	    url: "client_group_policy_mng/set_exclude_outer_ip_list",
	    data: $("#frmEditExcludeOuterIpList").serialize(),
	    success: function (result) {
	    	var strHtml = "";
	    	result = RemoveDebugInfoInJsonResult(result);
	    	if (result.length == 0)
	      {
	      	$.messager.alert('错误',strOpName+'客户端排除外网IP列表失败！详细：数据错误');
	        	return;
	   		}
	    	var jsonResult = jQuery.parseJSON(result);
	    	if (! jsonResult.bResult || jsonResult.bResult == "false" || jsonResult.bResult == "0")
	      {
	      	strMsg = strOpName+'客户端排除外网IP列表失败！详细：' + MyJsonDecode(jsonResult.szMsg);
	      	$.messager.alert('错误', strMsg);
	        	return;
	   		}
	      $.messager.alert('提示', strOpName+"客户端排除外网IP列表成功！");
				$('#divEditExcludeOuterIpListDialog').dialog('close');
	      
	      func_Get();
	    }
	});
}
function checkinput_EditExcludeOuterIpList()
{
	if (! /^[0-9;\.+]*$/g.test($('#EditExcludeOuterIpList__exclude_outer_ip_list').val()))
  {
  	$.messager.alert('错误','输入有误！只能输入IP、英文分号、加号');
    return false;
	}
	return true;
}


function Change_Select_AgentModule()
{
		var AgentID_Selected = $('#EditAgentModule__AgentID').val();
		if (AgentID_Selected == null || AgentID_Selected == undefined || AgentID_Selected == 0)
		{
			$.messager.alert('错误','未选中代理商');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllAgentModule.length; i ++)
	 	{
	 		var strAgentId = MyJsonDecode(g_AllAgentModule[i].AgentID);
	 		if (strAgentId == AgentID_Selected)
	 			break;
	 	}
	 	if (i >= g_AllAgentModule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		
		g_strAgentID_Selected = AgentID_Selected;
		
		var m_id_list_GM = MyJsonDecode(g_AllAgentModule[i].m_id_list_GM);
		$('#EditAgentModule__tdModuleCheckboxList').find('input[name="CheckBox_module_id_list"]').each(function(){
				$(this).prop('checked', IsInCommonList(m_id_list_GM, "_", $(this).val()));
		});
}
function Change_Select_ClientGroupModule()
{
		var client_group_id_Selected = $('#EditClientGroupModule__client_group_id').val();
		if (client_group_id_Selected == null || client_group_id_Selected == undefined || client_group_id_Selected == 0)
		{
			$.messager.alert('错误','未选中分组');
			return;
		}
		// 查找对应数据在数组中的序号
	 	for (i = 0; i < g_AllAgentModule.length; i ++)
	 	{
	 		var strClientGroupId = MyJsonDecode(g_AllAgentModule[i].ClientGroupId);
	 		if (client_group_id_Selected == strClientGroupId)
	 			break;
	 	}
	 	if (i >= g_AllAgentModule.length)
	 	{
			$.messager.alert('错误','数据错误，请联系管理人员修正！');
			return;
		}
		
		g_strClientGroupId_Selected = client_group_id_Selected;
		
		var m_id_list = MyJsonDecode(g_AllAgentModule[i].m_id_list);
		$('#EditClientGroupModule__tdModuleCheckboxList').find('input[name="CheckBox_module_id_list"]').each(function(){
				$(this).prop('checked', IsInCommonList(m_id_list, "_", $(this).val()));
		});
}

function SelectCheckBox_ExcludeRouteMac(sender, route_mac)
{
	if (! g_bExcludeOrInclude_RouteMac)
		route_mac = "++" + route_mac;
	
	var str = $('#EditExcludeRouteMacList__exclude_route_mac_list').val();
	if (str.length > 0)
		if (str.substr(str.length - 1, 1) != ";")
			str += ";";
		
	if ($(sender).prop('checked'))
	{
		if (str.indexOf(route_mac) < 0)
			str += route_mac + ";";
	}
	else
	{
		route_mac = route_mac.replace("++", "\\+\\+");
		var regex =new RegExp(route_mac + ";", "gi");
		str = str.replace(regex, '');
		var regex =new RegExp(route_mac, "gi");
		str = str.replace(regex, '');
	}
	$('#EditExcludeRouteMacList__exclude_route_mac_list').val(str);
}
function SelectCheckBox_ExcludeOuterIp(sender, route_mac)
{
	if (! g_bExcludeOrInclude_OuterIp)
		route_mac = "++" + route_mac;
		
	var str = $('#EditExcludeOuterIpList__exclude_outer_ip_list').val();
	if (str.length > 0)
		if (str.substr(str.length - 1, 1) != ";")
			str += ";";
		
	if ($(sender).prop('checked'))
	{
		if (str.indexOf(route_mac+";") >= 0 || str.indexOf(";"+route_mac) >= 0 || str == route_mac)  // 还不完善
			str = str;
		else
			str += route_mac + ";";
	}
	else
	{
		route_mac = route_mac.replace("++", "\\+\\+");
		var regex =new RegExp(route_mac + ";", "gi");
		str = str.replace(regex, '');
		//var regex =new RegExp(route_mac, "gi");  // IP不能这样搞，因为IP长度不固定
		//str = str.replace(regex, '');
	}
	$('#EditExcludeOuterIpList__exclude_outer_ip_list').val(str);
}

function ClearAgentReadOnlyModule(sender)
{
	if ($(sender).prop("checked"))
	{
		$.messager.alert('提示','此模块您无分配权限！');
		$(sender).prop("checked", false);
	}
}

function Switch_DisplayNameMac()
{
	if ($('#ckbSwitch_DisplayNameMac').prop('checked'))
	{
		$(".switch_disp_route_mac").hide();
		$(".switch_disp_bar_name").show();
	}
	else
	{
		$(".switch_disp_route_mac").show();
		$(".switch_disp_bar_name").hide();
	}
}
function Switch_DisplayNameIp()
{
	if ($('#ckbSwitch_DisplayNameIp').prop('checked'))
	{
		$(".switch_disp_ip").hide();
		$(".switch_disp_bar_name").show();
	}
	else
	{
		$(".switch_disp_ip").show();
		$(".switch_disp_bar_name").hide();
	}
}
function Select_AllExcludeRouteMac()
{
	if ($('#ckbSelect_AllExcludeRouteMac').prop('checked'))
	{
		var strSelectList = "";
		$('#ulAllRouteMacSelectList li input').each(function(index){
			$(this).prop("checked", true);
			strSelectList += $(this).val() + ";";
		});
		$('#EditExcludeRouteMacList__exclude_route_mac_list').val(strSelectList);
	}
	else
	{
		$('#ulAllRouteMacSelectList li input').each(function(index){
			$(this).prop("checked", false);
			strSelectList += $(this).val();
		});
		$('#EditExcludeRouteMacList__exclude_route_mac_list').val("");
	}
}
function Select_AllExcludeOuterIp()
{
	if ($('#ckbSelect_AllExcludeOuterIp').prop('checked'))
	{
		var strSelectList = "";
		$('#ulAllIpSelectList li input').each(function(index){
			$(this).prop("checked", true);
			strSelectList += $(this).val() + ";";
		});
		$('#EditExcludeOuterIpList__exclude_outer_ip_list').val(strSelectList);
	}
	else
	{
		$('#ulAllIpSelectList li input').each(function(index){
			$(this).prop("checked", false);
			strSelectList += $(this).val();
		});
		$('#EditExcludeOuterIpList__exclude_outer_ip_list').val("");
	}
}
var g_bExcludeOrInclude_OuterIp = true;
function Select_ExcludeOrInclude_OuterIp()
{
	var g_bExcludeOrInclude_OuterIp_Pre = g_bExcludeOrInclude_OuterIp;
	if ($('#ckbSelect_ExcludeOrInclude_OuterIp').prop('checked'))
	{
		g_bExcludeOrInclude_OuterIp = false;
		$('#spnExcludeOrInclude_OuterIp').text("选择 / 排除");
		$('#spnExcludeOrInclude_OuterIp').removeClass('red_font');
		$('#spnExcludeOrInclude_OuterIp').addClass('green_font');
		$('#EditExcludeOuterIpList__exclude_outer_ip_list').css('border', '1px solid #05BB10');
		$('#EditExcludeOuterIpList__exclude_outer_ip_list').css('color', '#05BB10');
	}
	else
	{
		g_bExcludeOrInclude_OuterIp = true;
		$('#spnExcludeOrInclude_OuterIp').text("排除 / 选择");
		$('#spnExcludeOrInclude_OuterIp').removeClass('green_font');
		$('#spnExcludeOrInclude_OuterIp').addClass('red_font');
		$('#EditExcludeOuterIpList__exclude_outer_ip_list').css('border', '1px solid #DD0A22');
		$('#EditExcludeOuterIpList__exclude_outer_ip_list').css('color', '#DD0A22');
	}
	if (g_bExcludeOrInclude_OuterIp != g_bExcludeOrInclude_OuterIp_Pre)
	{
		$('#EditExcludeOuterIpList__exclude_outer_ip_list').val('');
		$('#ckbSelect_AllExcludeOuterIp').prop('checked', false);
		Select_AllExcludeOuterIp();
	}
}

var g_bExcludeOrInclude_RouteMac = true;
function Select_ExcludeOrInclude_RouteMac()
{
	var g_bExcludeOrInclude_RouteMac_Pre = g_bExcludeOrInclude_RouteMac;
	if ($('#ckbSelect_ExcludeOrInclude_RouteMac').prop('checked'))
	{
		g_bExcludeOrInclude_RouteMac = false;
		$('#spnExcludeOrInclude_RouteMac').text("选择 / 排除");
		$('#spnExcludeOrInclude_RouteMac').removeClass('red_font');
		$('#spnExcludeOrInclude_RouteMac').addClass('green_font');
		$('#EditExcludeRouteMacList__exclude_route_mac_list').css('border', '1px solid #05BB10');
		$('#EditExcludeRouteMacList__exclude_route_mac_list').css('color', '#05BB10');
	}
	else
	{
		g_bExcludeOrInclude_RouteMac = true;
		$('#spnExcludeOrInclude_RouteMac').text("排除 / 选择");
		$('#spnExcludeOrInclude_RouteMac').removeClass('green_font');
		$('#spnExcludeOrInclude_RouteMac').addClass('red_font');
		$('#EditExcludeRouteMacList__exclude_route_mac_list').css('border', '1px solid #DD0A22');
		$('#EditExcludeRouteMacList__exclude_route_mac_list').css('color', '#DD0A22');
	}
	if (g_bExcludeOrInclude_RouteMac != g_bExcludeOrInclude_RouteMac_Pre)
	{
		$('#EditExcludeRouteMacList__exclude_route_mac_list').val('');
		$('#ckbSelect_AllExcludeRouteMac').prop('checked', false);
		Select_AllExcludeRouteMac();
	}
}