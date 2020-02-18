<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodules.io)
 * 
 * 항목을 압축하여 다운로드 한다.
 *
 * @file /modules/webhard/process/compress.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0
 * @modified 2020. 2. 18.
 */
if (defined('__IM__') == false) exit;

$mode = Request('mode');

if ($mode == 'start') {
	$files = Request('files');
	$hash = md5($files.'-'.$this->IM->getModule('member')->getLogged().'-'.time());
	
	if ($this->db()->select($this->table->compress)->where('hash',$hash)->has() == false) {
		$this->db()->insert($this->table->compress,array('hash'=>$hash,'midx'=>$this->IM->getModule('member')->getLogged(),'files'=>$files,'reg_date'=>time()))->execute();
		
		$results->success = true;
		$results->hash = $hash;
	} else {
		$results->success = false;
	}
}

if ($mode == 'compress') {
	$hash = Request('hash');
	$compress = $this->db()->select($this->table->compress)->where('hash',$hash)->getOne();
	
	if ($compress->midx == $this->IM->getModule('member')->getLogged()) {
		if (true || $compress->status == 'WAIT') {
			$this->db()->update($this->table->compress,array('status'=>'COMPRESSING'))->where('hash',$hash)->execute();
			
			$files = json_decode($compress->files);
			$compressFiles = array();
			for ($i=0, $loop=count($files);$i<$loop;$i++) {
				if ($files[$i]->type == 'folder') {
					$compressFiles = array_merge($compressFiles,$this->compressFolder($files[$i]->idx));
				} else {
					if ($this->checkFilePermission($files[$i]->idx,'R') == true) $compressFiles[] = $files[$i]->idx;
				}
			}
			
			@ini_set('zlib.output_compression', 'Off');
			@ini_set('output_buffering', 'Off');
			@ini_set('output_handler', '');
			@apache_setenv('no-gzip', 1);
			
			header('Content-type:text/html; charset=utf-8',true);
			header("Content-Length: ".(count($compressFiles) * 4096));
			flush();
			
			$mZip = new Zip();
			$mZip->open('download.zip',$this->getTempPath(true).'/'.$hash.'.zip');
			
			$storeFiles = array('/'=>array());
			for ($i=0, $loop=count($compressFiles);$i<$loop;$i++) {
				ob_implicit_flush(true);
				$temp = explode('/',$compressFiles[$i]);
				$idx = array_pop($temp);
				$path = count($temp) == 0 ? '' : implode('/',$temp).'/';
				
				if ($path && $idx == 0) {
					$mZip->addEmptyDir(substr($path,0,-1));
					$storeFiles[$path] = array();
				}
				
				$file = $this->db()->select($this->table->file)->where('idx',$idx)->getOne();
				if ($file != null) {
					if (in_array($file->name,$storeFiles[$path ? $path : '/']) == true) {
						$nameLooper = 1;
						$temp = explode('.',$file->name);
						$exec = array_pop($temp);
						$name = implode('.',$temp);
						while (in_array($name.'('.$nameLooper.').'.$exec,$storeFiles[$path]) == true) {
							$nameLooper++;
						}
						$file->name = $name.'('.$nameLooper.').'.$exec;
					}
					$storeFiles[$path ? $path : '/'][] = $file->name;
					$mZip->addFile($this->getFilePath($file->path),$path.$file->name);
				}
				echo str_repeat('.',4096);
				ob_end_flush();
			}
			
			$mZip->close();
			$this->db()->update($this->table->compress,array('status'=>'COMPRESSED'))->where('hash',$hash)->execute();
			exit;
		}
	} else {
		$results->success = false;
		$results->message = $this->getErrorText('FORBIDDEN');
	}
}

if ($mode == 'download') {
	$hash = Request('hash');
	
	$compress = $this->db()->select($this->table->compress)->where('hash',$hash)->where('status','COMPRESSED')->getOne();
	$filePath = $this->getTempPath(true).'/'.$hash.'.zip';
	
	if ($compress == null || is_file($filePath) == false) {
		header("HTTP/1.1 404 Not Found");
		exit;
	} else {
		$this->db()->update($this->table->compress,array('status'=>'DOWNLOADED'))->where('hash',$hash)->execute();
		header("Pragma: no-cache");
		header("Expires: 0");
		header("Content-Type: application/zip");
		header("Content-Disposition: attachment; filename=\"".date('Y-m-d',$compress->reg_date).".zip\"");
		header("Content-Transfer-Encoding: binary");
		header("Content-Length: ".filesize($filePath));
		header("Connection: Keep-Alive");

		readfile($filePath);
		unlink($filePath);
		$this->db()->delete($this->table->compress)->where('hash',$hash)->execute();
		exit;
	}
	exit;
}
?>