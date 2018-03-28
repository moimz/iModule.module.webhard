<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 *
 * 웹하드 설정을 위한 설정폼을 생성한다.
 * 
 * @file /modules/webhard/admin/configs.php
 * @author Arzz (arzz@arzz.com)
 * @license GPLv3
 * @version 3.0.0
 * @modified 2018. 3. 18.
 */
if (defined('__IM__') == false) exit;
?>
<script>
var config = new Ext.form.Panel({
	id:"ModuleConfigForm",
	border:false,
	bodyPadding:10,
	width:750,
	fieldDefaults:{labelAlign:"right",labelWidth:100,anchor:"100%",allowBlank:true},
	items:[
		new Ext.form.FieldSet({
			title:Webhard.getText("admin/configs/form/default_setting"),
			items:[
				new Ext.form.ComboBox({
					fieldLabel:Webhard.getText("admin/configs/form/templet"),
					name:"templet",
					store:new Ext.data.JsonStore({
						proxy:{
							type:"ajax",
							simpleSortMode:true,
							url:ENV.getProcessUrl("webhard","@getTemplets"),
							reader:{type:"json",root:"lists",totalProperty:"totalCount"}
						},
						autoLoad:true,
						remoteSort:false,
						sorters:[{property:"sort",direction:"ASC"}],
						pageSize:0,
						fields:["value","display"]
					}),
					editable:false,
					displayField:"display",
					valueField:"value",
					listeners:{
						change:function(form,value) {
							$.send(ENV.getProcessUrl("webhard","@getTempletConfigs"),{templet:value},function(result) {
								if (result.success == true) {
									Admin.setTempletConfigs("ModuleConfigTempletConfigs","@templet_configs-",result.configs);
								}
							});
						}
					}
				})
			]
		}),
		new Ext.form.FieldSet({
			title:Webhard.getText("admin/configs/form/root_setting"),
			items:[
				new Ext.form.FieldContainer({
					layout:"hbox",
					items:[
						new Ext.form.TextField({
							fieldLabel:Webhard.getText("admin/configs/form/root_name"),
							name:"root_name",
							flex:1,
							afterBodyEl:'<div class="x-form-help">'+Webhard.getText("admin/configs/form/root_name_help")+'</div>'
						}),
						new Ext.form.NumberField({
							fieldLabel:Webhard.getText("admin/configs/form/root_size"),
							name:"root_size",
							flex:1,
							afterBodyEl:'<div class="x-form-help">'+Webhard.getText("admin/configs/form/root_size_help")+'</div>'
						})
					]
				})
			]
		}),
		new Ext.form.FieldSet({
			id:"ModuleConfigTempletConfigs",
			title:Admin.getText("text/templet_configs"),
			hidden:true
		})
	]
});
</script>