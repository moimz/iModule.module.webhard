<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 *
 * afterGetContext 이벤트를 처리한다.
 * 
 * @file /modules/webhard/events/afterGetContext.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
if (defined('__IM__') == false) exit;

if ($target == 'admin') {
	if ($context == 'panel') {
		if ($values->menu == 'webhard') {
			$html = '<script>
				Ext.onReady(function () { Ext.getCmp("iModuleAdminPanel").add(
					new Ext.Panel({
						layout:"fit",
						border:false,
						html:\'<iframe src="'.$IM->getModuleUrl('webhard','explorer').'" style="width:100%; height:100%;" frameborder="0"></iframe>\'
					})
				);
				Ext.getCmp("iModuleAdminPanel").getHeader().hide();
			});
			</script>';
		}
	}
}
?>
