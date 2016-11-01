<?php
/**
 * 이 파일은 iModule 웹하드모듈의 일부입니다. (https://www.imodule.kr)
 *
 * 웹하드 관련 모든 기능을 제어한다.
 * 
 * @file /modules/webhard/ModuleWebhard.class.php
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 3.0.0.160910
 */
class ModuleWebhard {
	/**
	 * iModule 및 Module 코어클래스
	 */
	private $IM;
	private $Module;
	
	/**
	 * DB 관련 변수정의
	 *
	 * @private string[] $table DB 테이블 별칭 및 원 테이블명을 정의하기 위한 변수
	 */
	private $table;
	
	/**
	 * 언어셋을 정의한다.
	 * 
	 * @private object $lang 현재 사이트주소에서 설정된 언어셋
	 * @private object $oLang package.json 에 의해 정의된 기본 언어셋
	 */
	private $lang = null;
	private $oLang = null;
	
	/**
	 * DB접근을 줄이기 위해 DB에서 불러온 데이터를 저장할 변수를 정의한다.
	 *
	 * @private object[] $paths 폴더정보
	 * @private string[] $paths 폴더경로
	 * @private string[] $paths 폴더 고유번호 경로
	 * @private string[] $permissions 폴더권한
	 * @private boolean[] $shareds 폴더공유여부
	 * @private boolean[] $deleteds 폴더삭제여부
	 */
	private $folders = array();
	private $paths = array();
	private $pathIdxs = array();
	private $permissions = array();
	private $shareds = array();
	private $deleteds = array();
	
	
	/**
	 * class 선언
	 *
	 * @param iModule $IM iModule 코어클래스
	 * @param Module $Module Module 코어클래스
	 * @see /classes/iModule.class.php
	 * @see /classes/Module.class.php
	 */
	function __construct($IM,$Module) {
		/**
		 * iModule 및 Module 코어 선언
		 */
		$this->IM = $IM;
		$this->Module = $Module;
		
		/**
		 * 모듈에서 사용하는 DB 테이블 별칭 정의
		 * @see 모듈폴더의 package.json 의 databases 참고
		 */
		$this->table = new stdClass();
		$this->table->activity = 'webhard_activity_table';
		$this->table->profile = 'webhard_profile_table';
		$this->table->folder = 'webhard_folder_table';
		$this->table->compress = 'webhard_compress_table';
		$this->table->file = 'webhard_file_table';
		$this->table->favorite = 'webhard_favorite_table';
		$this->table->share = 'webhard_share_table';
		$this->table->share_log = 'webhard_share_log_table';
	}
	
	/**
	 * 모듈 코어 클래스를 반환한다.
	 * 현재 모듈의 각종 설정값이나 모듈의 package.json 설정값을 모듈 코어 클래스를 통해 확인할 수 있다.
	 *
	 * @return Module $Module
	 */
	function getModule() {
		return $this->Module;
	}
	
	/**
	 * 모듈 설치시 정의된 DB코드를 사용하여 모듈에서 사용할 전용 DB클래스를 반환한다.
	 *
	 * @return DB $DB
	 */
	function db() {
		return $this->IM->db($this->getModule()->getInstalled()->database);
	}
	
	/**
	 * 모듈에서 사용중인 DB테이블 별칭을 이용하여 실제 DB테이블 명을 반환한다.
	 *
	 * @param string $table DB테이블 별칭
	 * @return string $table 실제 DB테이블 명
	 */
	function getTable($table) {
		return empty($this->table->$table) == true ? null : $this->table->$table;
	}
	
	/**
	 * [코어] 사이트 외부에서 현재 모듈의 API를 호출하였을 경우, API 요청을 처리하기 위한 함수로 API 실행결과를 반환한다.
	 * 소스코드 관리를 편하게 하기 위해 각 요쳥별로 별도의 PHP 파일로 관리한다.
	 *
	 * @param string $api API명
	 * @return object $datas API처리후 반환 데이터 (해당 데이터는 /api/index.php 를 통해 API호출자에게 전달된다.)
	 * @see /api/index.php
	 */
	function getApi($api) {
		$data = new stdClass();
		
		/**
		 * 모듈의 api 폴더에 $api 에 해당하는 파일이 있을 경우 불러온다.
		 */
		if (is_file($this->getModule()->getPath().'/api/'.$api.'.php') == true) {
			INCLUDE $this->getModule()->getPath().'/api/'.$api.'.php';
		}
		
		/**
		 * 이벤트를 호출한다.
		 */
		$values = (object)get_defined_vars();
		$this->IM->fireEvent('afterGetApi','portfolio',$api,$values,$data);
		
		return $data;
	}
	
	/**
	 * [코어] 알림메세지를 구성한다.
	 *
	 * @param string $code 알림코드
	 * @param int $fromcode 알림이 발생한 대상의 고유값
	 * @param array $content 알림데이터
	 * @return string $push 알림메세지
	 */
	function getPush($code,$fromcode,$content) {
		return null;
	}
	
	/**
	 * [사이트관리자] 모듈 설정패널을 구성한다.
	 *
	 * @return string $panel 설정패널 HTML
	 */
	function getConfigPanel() {
		/**
		 * 설정패널 PHP에서 iModule 코어클래스와 모듈코어클래스에 접근하기 위한 변수 선언
		 */
		$IM = $this->IM;
		$Module = $this->getModule();
		
		ob_start();
		INCLUDE $this->getModule()->getPath().'/admin/configs.php';
		$panel = ob_get_contents();
		ob_end_clean();
		
		return $panel;
	}
	
	/**
	 * [사이트관리자] 모듈 관리자패널 구성한다.
	 *
	 * @return string $panel 관리자패널 HTML
	 */
	function getAdminPanel() {
		/**
		 * 설정패널 PHP에서 iModule 코어클래스와 모듈코어클래스에 접근하기 위한 변수 선언
		 */
		$IM = $this->IM;
		$Module = $this;
		
		ob_start();
		INCLUDE $this->getModule()->getPath().'/admin/index.php';
		$panel = ob_get_contents();
		ob_end_clean();
		
		return $panel;
	}
	
	/**
	 * [사이트관리자] 모듈의 전체 컨텍스트 목록을 반환한다.
	 *
	 * @return object $lists 전체 컨텍스트 목록
	 */
	function getContexts() {
		$contexts = $this->getText('admin/contexts');
		$lists = array();
		foreach ($contexts as $context=>$title) {
			$lists[] = array('context'=>$context,'title'=>$title);
		}
		
		return $lists;
	}
	
	/**
	 * [사이트관리자] 모듈의 컨텍스트 환경설정을 구성한다.
	 *
	 * @param object $site 설정대상 사이트
	 * @param string $context 설정대상 컨텍스트명
	 * @return object[] $configs 환경설정
	 */
	function getContextConfigs($site,$context) {
		$configs = array();
		
		$templet = new stdClass();
		$templet->title = $this->IM->getText('text/templet');
		$templet->name = 'templet';
		$templet->type = 'select';
		$templet->data = array();
		
		$templet->data[] = array('#',$this->getText('admin/configs/form/default_setting'));
		
		$templets = $this->getModule()->getTemplets();
		for ($i=0, $loop=count($templets);$i<$loop;$i++) {
			$templet->data[] = array($templets[$i]->getName(),$templets[$i]->getTitle().' ('.$templets[$i]->getDir().')');
		}
		
		$templet->value = count($templet->data) > 0 ? $templet->data[0][0] : '#';
		$configs[] = $templet;
		
		return $configs;
	}
	
	/**
	 * 언어셋파일에 정의된 코드를 이용하여 사이트에 설정된 언어별로 텍스트를 반환한다.
	 * 코드에 해당하는 문자열이 없을 경우 1차적으로 package.json 에 정의된 기본언어셋의 텍스트를 반환하고, 기본언어셋 텍스트도 없을 경우에는 코드를 그대로 반환한다.
	 *
	 * @param string $code 언어코드
	 * @param string $replacement 일치하는 언어코드가 없을 경우 반환될 메세지 (기본값 : null, $code 반환)
	 * @return string $language 실제 언어셋 텍스트
	 */
	function getText($code,$replacement=null) {
		if ($this->lang == null) {
			if (is_file($this->getModule()->getPath().'/languages/'.$this->IM->language.'.json') == true) {
				$this->lang = json_decode(file_get_contents($this->getModule()->getPath().'/languages/'.$this->IM->language.'.json'));
				if ($this->IM->language != $this->getModule()->getPackage()->language && is_file($this->getModule()->getPath().'/languages/'.$this->getModule()->getPackage()->language.'.json') == true) {
					$this->oLang = json_decode(file_get_contents($this->getModule()->getPath().'/languages/'.$this->getModule()->getPackage()->language.'.json'));
				}
			} elseif (is_file($this->getModule()->getPath().'/languages/'.$this->getModule()->getPackage()->language.'.json') == true) {
				$this->lang = json_decode(file_get_contents($this->getModule()->getPath().'/languages/'.$this->getModule()->getPackage()->language.'.json'));
				$this->oLang = null;
			}
		}
		
		$returnString = null;
		$temp = explode('/',$code);
		
		$string = $this->lang;
		for ($i=0, $loop=count($temp);$i<$loop;$i++) {
			if (isset($string->{$temp[$i]}) == true) {
				$string = $string->{$temp[$i]};
			} else {
				$string = null;
				break;
			}
		}
		
		if ($string != null) {
			$returnString = $string;
		} elseif ($this->oLang != null) {
			if ($string == null && $this->oLang != null) {
				$string = $this->oLang;
				for ($i=0, $loop=count($temp);$i<$loop;$i++) {
					if (isset($string->{$temp[$i]}) == true) {
						$string = $string->{$temp[$i]};
					} else {
						$string = null;
						break;
					}
				}
			}
			
			if ($string != null) $returnString = $string;
		}
		
		/**
		 * 언어셋 텍스트가 없는경우 iModule 코어에서 불러온다.
		 */
		if ($returnString != null) return $returnString;
		elseif (in_array(reset($temp),array('text','button','action')) == true) return $this->IM->getText($code,$replacement);
		else return $replacement == null ? $code : $replacement;
	}
	
	/**
	 * 상황에 맞게 에러코드를 반환한다.
	 *
	 * @param string $code 에러코드
	 * @param object $value(옵션) 에러와 관련된 데이터
	 * @param boolean $isRawData(옵션) RAW 데이터 반환여부
	 * @return string $message 에러 메세지
	 */
	function getErrorText($code,$value=null,$isRawData=false) {
		$message = $this->getText('error/'.$code,$code);
		if ($message == $code) return $this->IM->getErrorText($code,$value,null,$isRawData);
		
		$description = null;
		switch ($code) {
			default :
				if (is_object($value) == false && $value) $description = $value;
		}
		
		$error = new stdClass();
		$error->message = $message;
		$error->description = $description;
		
		if ($isRawData === true) return $error;
		else return $this->IM->getErrorText($error);
	}
	
	/**
	 * 특정 컨텍스트에 대한 제목을 반환한다.
	 *
	 * @param string $context 컨텍스트명
	 * @return string $title 컨텍스트 제목
	 */
	function getContextTitle($context) {
		return $this->getText('admin/contexts/'.$context);
	}
	
	/**
	 * 사이트맵에 나타날 뱃지데이터를 생성한다.
	 *
	 * @param string $context 컨텍스트종류
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @return object $badge 뱃지데이터 ($badge->count : 뱃지숫자, $badge->latest : 뱃지업데이트 시각(UNIXTIME), $badge->text : 뱃지텍스트)
	 * @todo check count information
	 */
	function getContextBadge($context,$config) {
		/**
		 * null 일 경우 뱃지를 표시하지 않는다.
		 */
		return null;
	}
	
	/**
	 * 템플릿 정보를 가져온다.
	 *
	 * @param string $this->getTemplet($configs) 템플릿명
	 * @return string $package 템플릿 정보
	 */
	function getTemplet($templet=null) {
		$templet = $templet == null ? '#' : $templet;
		
		/**
		 * 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정일 경우
		 */
		if (is_object($templet) == true) {
			$templet = $templet !== null && isset($templet->templet) == true ? $templet->templet : '#';
		}
		
		/**
		 * 템플릿명이 # 이면 모듈 기본설정에 설정된 템플릿을 사용한다.
		 */
		$templet = $templet == '#' ? $this->getModule()->getConfig('templet') : $templet;
		return $this->getModule()->getTemplet($templet);
	}
	
	/**
	 * 페이지 컨텍스트를 가져온다.
	 *
	 * @param string $context 컨테이너 종류
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @return string $html 컨텍스트 HTML
	 */
	function getContext($context,$configs=null) {
		/**
		 * 컨텍스트 컨테이너를 설정한다.
		 */
		$html = PHP_EOL.'<!-- WEBHARD MODULE -->'.PHP_EOL.'<div data-role="context" data-type="module" data-module="'.$this->getModule()->getName().'">'.PHP_EOL;
		
		$this->IM->addHeadResource('style',$this->getModule()->getDir().'/styles/style.css');
		$this->IM->addHeadResource('script',$this->getModule()->getDir().'/scripts/script.js');
		
		/**
		 * 컨텍스트 헤더
		 */
		$html.= $this->getHeader($context,$configs);
		
		/**
		 * 컨테이너 종류에 따라 컨텍스트를 가져온다.
		 */
		switch ($context) {
			case 'explorer' :
				$html.= $this->getExplorerContext($configs);
				break;
		}
		
		/**
		 * 컨텍스트 푸터
		 */
		$html.= $this->getFooter($context,$configs);
		
		/**
		 * 컨텍스트 컨테이너를 설정한다.
		 */
		$html.= PHP_EOL.'</div>'.PHP_EOL.'<!--// WEBHARD MODULE -->'.PHP_EOL;
		
		return $html;
	}
	
	/**
	 * 컨텍스트 헤더를 가져온다.
	 *
	 * @param string $context 컨테이너 종류
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @return string $html 컨텍스트 HTML
	 */
	function getHeader($context,$configs=null) {
		/**
		 * 템플릿파일을 호출한다.
		 */
		return $this->getTemplet($configs)->getHeader(get_defined_vars());
	}
	
	/**
	 * 컨텍스트 푸터를 가져온다.
	 *
	 * @param string $context 컨테이너 종류
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @return string $html 컨텍스트 HTML
	 */
	function getFooter($context,$configs=null) {
		/**
		 * 템플릿파일을 호출한다.
		 */
		return $this->getTemplet($configs)->getFooter(get_defined_vars());
	}
	
	/**
	 * 에러메세지를 반환한다.
	 *
	 * @param string $code 에러코드 (에러코드는 iModule 코어에 의해 해석된다.)
	 * @param object $value 에러코드에 따른 에러값
	 * @return $html 에러메세지 HTML
	 */
	function getError($code,$value=null) {
		/**
		 * iModule 코어를 통해 에러메세지를 구성한다.
		 */
		$error = $this->getErrorText($code,$value,true);
		return $this->IM->getError($error);
	}
	
	/**
	 * 웹하드 탐색기 컨텍스트를 가져온다.
	 *
	 * @param object $configs 사이트맵 관리를 통해 설정된 페이지 컨텍스트 설정
	 * @return string $html 컨텍스트 HTML
	 */
	function getExplorerContext($configs) {
		/**
		 * 로그인이 되어 있지 않다면, 에러메세지를 출력한다.
		 */
		if ($this->IM->getModule('member')->isLogged() == false) return $this->getTemplet($configs)->getError('REQUIRED_LOGIN');
		
		/**
		 * 회원프로필을 가져온다.
		 */
		$profile = $this->getProfile();
		
		$view = $this->IM->view ? $this->IM->view : 'folder';
		$path = Request('idx');
		
		if ($view == 'folder') {
			$path = $path ? $this->getRootFolder()->name.'/'.$path : $this->getRootFolder()->name;
			$pathIdxs = $this->getFolderPathToPathIdx($path);
			$idx = end($pathIdxs);
			
			
			if ($this->IM->view != 'folder' || $path != $this->getFolderPath($idx)) {
				$temp = explode('/',$this->getFolderPath($idx));
				$root = array_shift($temp);
				
				header("location:".$this->IM->getUrl(null,null,'folder',''));
			}
			
			$pathIdx = implode('/',$pathIdxs);
		}
		
		$header = PHP_EOL.'<form id="ModuleWebhardExplorerForm">'.PHP_EOL;
		$header.= '<input type="hidden" name="view" value="'.$view.'">'.PHP_EOL;
		$header.= '<input type="hidden" name="idx" value="'.$idx.'">'.PHP_EOL;
		$header.= '<input type="text" name="path" value="'.$path.'">'.PHP_EOL;
		$header.= '<input type="text" name="pathIdx" value="'.$pathIdx.'">'.PHP_EOL;
		$header.= '<input type="hidden" name="templet" value="'.$this->getTemplet($configs)->getName().'">'.PHP_EOL;
		$footer = PHP_EOL.'</form>'.PHP_EOL.'<script>Webhard.init();</script>'.PHP_EOL;
		
		/**
		 * FUCKING IE!!!
		 */
		if (preg_match('/(MSIE|Trident)/',$_SERVER['HTTP_USER_AGENT']) == true) {
			$footer.= '<script src="'.$this->getModule()->getDir().'/scripts/ie.js"></script>'.PHP_EOL;
		}
		
		/**
		 * 템플릿파일을 호출한다.
		 */
		return $this->getTemplet($configs)->getContext('explorer',get_defined_vars(),$header,$footer);
	}
	
	/**
	 * 새폴더 생성 모달 컨텍스트를 가져온다.
	 *
	 * @param int $parent 새 폴더를 생성할 폴더 고유번호
	 * @return string $html 모달컨텍스트 HTML
	 */
	function getCreateModal($parent) {
		
		$title = '새폴더 생성하기';
		
		$content = PHP_EOL;
		$content.= '<input type="hidden" name="parent" value="'.$parent.'">'.PHP_EOL;
		
		$content.= '<label>'.$this->getText('text/folder_name').'</label>';
		$content.= '<div data-role="input"><input type="text" name="name"></div>';
		
		
		return $this->getTemplet()->getModal($title,$content);
	}
	
	/**
	 * 항목 이동/복사 에러 모달 컨텍스트를 가져온다.
	 *
	 * @param int $idx 에러가 발생한 객체순서
	 * @param string $error 에러코드
	 * @param object $item 에러가 발생한 항목
	 * @return string $html 모달컨텍스트 HTML
	 */
	function getMoveErrorModal($idx,$mode,$error,$item) {
		$title = $this->getErrorText(strtoupper($mode).'_FAILED');
		
		$content = PHP_EOL;
		$content.= '<input type="hidden" name="idx" value="'.$idx.'">'.PHP_EOL;
		$content.= '<input type="hidden" name="option" value="cancel">'.PHP_EOL;
		
		$content.= '<div class="text">';
		if ($item != null) $content.= $this->getText('text/error_item').' : <b>'.($item->type == 'folder' ? '/' : '').$item->name.'</b><br><br>';
		
		$content.= $this->getErrorText($error);
		
		$buttons = array();
		
		if ($error == 'NOT_ALLOWED_MOVE_FOR_LOCK_ITEM' || $error == 'NOT_ALLOWED_DELETE_IN_TARGET') {
			$content.= '<br>'.$this->getText('text/suggest_copy');
			
			$button = new stdClass();
			$button->type = 'cancel';
			$button->text = $this->getText('button/cancel');
			$buttons[] = $button;
			
			$button = new stdClass();
			$button->type = 'copy';
			$button->class = 'submit';
			$button->text = $this->getText('button/copy');
			$buttons[] = $button;
		} else {
			$button = new stdClass();
			$button->type = 'cancel';
			$button->class = 'submit';
			$button->text = $this->getText('button/confirm');
			$buttons[] = $button;
		}
		
		$content.= '</div>';
		
		return $this->getTemplet()->getModal($title,$content,false,false,$buttons);
	}
	
	/**
	 * 항목 이동/복사시 대상폴더에 중복된 이름을 가진 폴더를 확인하는 모달 컨텍스트를 가져온다.
	 *
	 * @param int $idx 에러가 발생한 객체순서
	 * @param string $folder 이동/복사되는 폴더객체
	 * @param object $duplicated 중복된 폴더객체
	 * @return string $html 모달컨텍스트 HTML
	 */
	function getFolderDuplicatedOptionModal($idx,$folder,$duplicated) {
		$title = $this->getErrorText('CHECKED_DUPLICATED_ITEM');
		
		$content = PHP_EOL;
		$content.= '<input type="hidden" name="idx" value="'.$idx.'">'.PHP_EOL;
		$content.= '<input type="hidden" name="option" value="cancel">'.PHP_EOL;
		
		$content.= '<div class="text">';
		$content.= $this->getText('text/confirm_duplicated');
		
		$detail = array(
			'<ul data-role="duplicated">',
				'<li class="title">'.$this->getText('text/error_item').' : <b>'.$folder->name.'</b></li>',
				'<li class="item"><b>'.$this->getText('text/origin_item').'</b> : <span data-role="time" data-moment="LLL" data-time="'.$duplicated->update_date.'"></span><span class="size">('.GetFileSize($duplicated->size).')</span></li>',
				'<li class="item"><b>'.$this->getText('text/current_item').'</b> : <span data-role="time" data-moment="LLL" data-time="'.$folder->update_date.'"></span><span class="size">('.GetFileSize($duplicated->size).')</span></li>',
			'</ul>'
		);
		
		$content.= implode(PHP_EOL,$detail);
		
		
		$buttons = array();
		
		$button = new stdClass();
		$button->type = 'cancel';
		$button->text = $this->getText('button/cancel');
		$buttons[] = $button;
		
		$button = new stdClass();
		$button->type = 'merge';
		$button->class = 'submit';
		$button->text = $this->getText('button/merge');
		$buttons[] = $button;
		
		$button = new stdClass();
		$button->type = 'replace';
		$button->class = 'danger';
		$button->text = $this->getText('button/replace');
		$buttons[] = $button;
		
		$content.= '</div>';
		
		$content.= '<div data-role="input"><label><input type="checkbox" name="continue">'.$this->getText('text/option_continue').'</label></div>';
		
		return $this->getTemplet()->getModal($title,$content,false,false,$buttons);
	}
	
	/**
	 * 회원의 웹하드 프로필을 가져온다.
	 *
	 * @return object $profile
	 */
	function getProfile() {
		if ($this->IM->getModule('member')->isLogged() == null) return null;
		
		$profile = $this->db()->select($this->table->profile)->where('midx',$this->IM->getModule('member')->getLogged())->getOne();
		if ($profile == null) {
			$this->db()->insert($this->table->profile,array('midx'=>$this->IM->getModule('member')->getLogged(),'disk_limit'=>$this->getModule()->getConfig('root_size')))->execute();
			return $this->getProfile();
		}
		
		$values = new stdClass();
		$values->profile = $profile;
		$this->IM->fireEvent('afterGetData','webhard','profile',$values);
		
		return $profile;
	}
	
	/**
	 * 폴더정보를 가져온다.
	 *
	 * @param int $idx 폴더 고유정보
	 * @return object $folder 폴더정보
	 */
	function getFolder($idx) {
		if (isset($this->folders[$idx]) == true) return $this->folders[$idx];
		
		$folder = $this->db()->select($this->table->folder)->where('idx',$idx)->getOne();
		if ($folder == null) {
			$this->folders[$idx] = null;
		} else {
			$folder->type = 'folder';
			$folder->is_shared = $folder->is_shared == 'TRUE';
			$folder->is_delete = $folder->is_delete == 'TRUE';
			$folder->is_lock = $folder->is_lock == 'TRUE';
			
			$this->folders[$idx] = $folder;
		}
		
		return $this->folders[$idx];
	}
	
	/**
	 * 폴더경로를 가져온다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @return string $path 폴더경로
	 */
	function getFolderPath($idx) {
		if (isset($this->paths[$idx]) == true) return $this->paths[$idx];
		
		$folder = $this->getFolder($idx);
		
		/**
		 * 부모폴더의 경우
		 */
		if ($folder->parent == 0) return $folder->name;
		
		/**
		 * 폴더주인이 아닌경우, 해당폴더를 공유받은 폴더를 찾는다.
		 */
		if ($folder->owner != $this->IM->getModule('member')->getLogged()) {
			$share = $this->db()->select($this->table->folder)->where('owner',$this->IM->getModule('member')->getLogged())->where('linked',$folder->idx)->where('is_delete','FALSE')->getOne();
			
			/**
			 * 공유받은폴더가 있다면, 해당폴더 경로를 반환한다.
			 */
			if ($share != null) {
				$this->paths[$idx] = $this->getFolderPath($share->idx);
				return $this->paths[$idx];
			}
		}
		
		$path = $this->getFolderPath($folder->parent);
		
		/**
		 * 폴더가 삭제된 경우 현재 폴더를 붙이지 않는다.
		 */
		if ($this->checkFolderDeleted($folder->idx) == true) {
			$this->paths[$idx] = $path;
		} else {
			$this->paths[$idx] = $path.'/'.$folder->name;
		}
		
		return $this->paths[$idx];
	}
	
	/**
	 * 폴더경로를 가져온다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @return string $path 폴더 고유번호 경로
	 */
	function getFolderPathIdx($idx) {
		if (isset($this->pathIdxs[$idx]) == true) return $this->pathIdxs[$idx];
		
		$folder = $this->getFolder($idx);
		
		/**
		 * 부모폴더의 경우
		 */
		if ($folder->parent == 0) {
			$this->pathIdxs[$idx] = $folder->idx;
		} else {
			/**
			 * 폴더주인이 아닌경우, 해당폴더를 공유받은 폴더를 찾는다.
			 */
			if ($folder->owner != $this->IM->getModule('member')->getLogged()) {
				$share = $this->db()->select($this->table->folder,'idx')->where('owner',$this->IM->getModule('member')->getLogged())->where('linked',$folder->idx)->where('is_delete','FALSE')->getOne();
				
				/**
				 * 공유받은폴더가 있다면, 해당폴더 경로를 반환한다.
				 */
				if ($share != null) {
					$this->pathIdxs[$idx] = $this->getFolderPathIdx($share->idx);
					return $this->pathIdxs[$idx];
				}
			}
			
			$path = $this->getFolderPathIdx($folder->parent);
			
			/**
			 * 폴더가 삭제된 경우 현재 폴더를 붙이지 않는다.
			 */
			if ($this->checkFolderDeleted($folder->idx) == true) {
				$this->pathIdxs[$idx] = $path;
			} else {
				$this->pathIdxs[$idx] = $path.'/'.$folder->idx;
			}
		}
		
		return $this->pathIdxs[$idx];
	}
	
	/**
	 * 폴더경로를 폴더 고유번호 경로로 변환한다.
	 *
	 * @param string $path 폴더경로
	 * @return int[] $pathidx 폴더 고유번호 경로배열
	 */
	function getFolderPathToPathIdx($path) {
		$path = explode('/',$path);
		if (end($path) == '') array_pop($path);
		array_shift($path);
		$pathIdxs = array($this->getRootFolder()->idx);
		while (count($path) > 0) {
			$name = array_shift($path);
			if ($name == '') continue;
			
			$parent = end($pathIdxs);
			$check = $this->db()->select($this->table->folder)->where('name',$name)->where('parent',$parent)->where('is_delete','FALSE')->getOne();
			if ($check == null || $this->checkFolderPermission($check->idx,'R') == false) break;
			
			array_push($pathIdxs,$check->idx);
		}
		
		return $pathIdxs;
	}
	
	/**
	 * 폴더의 권한을 가져온다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @param string $permission 폴더권한
	 */
	function getFolderPermission($idx) {
		if (isset($this->permissions[$idx]) == true) return $this->permissions[$idx];
		
		$folder = $this->getFolder($idx);
		if ($folder == null) return '';
		
		/**
		 * 폴더주인이 아닌경우,
		 */
		if ($folder->owner != $this->IM->getModule('member')->getLogged()) {
			$share = $this->db()->select($this->table->folder)->where('owner',$this->IM->getModule('member')->getLogged())->where('linked',$folder->idx)->getOne();
			
			/**
			 * 공유받은폴더가 있다면, 해당폴더 권한을 반환한다.
			 */
			if ($share != null) {
				$this->permissions[$idx] = $share->permission;
				return $this->permissions[$idx];
			}
		}
		
		$this->permissions[$idx] = $folder->permission;
		return $this->permissions[$idx];
	}
	
	/**
	 * 폴더정보를 가져온다.
	 *
	 * @param int $idx 폴더 고유정보
	 * @return object $folder 폴더정보
	 */
	function getFile($idx) {
		$file = $this->db()->select($this->table->file)->where('idx',$idx)->getOne();
		if ($file == null) return null;
		
		$file->is_delete = $file->is_delete == 'TRUE';
		
		return $file;
	}
	
	/**
	 * 파일의 권한을 가져온다.
	 *
	 * @param int $idx 파일 고유번호
	 * @param string $permission 폴더권한
	 */
	function getFilePermission($idx) {
		$file = $this->getFile($idx);
		
		if ($file->owner == $this->IM->getModule('member')->getLogged()) return 'RWD';
		if ($this->IM->getModule('member')->isLogged() == false) return '';
		return $this->getFolderPermission($file->folder);
	}
	
	/**
	 * 회원의 루트폴더 정보를 가져온다.
	 *
	 * @param int $midx(옵션) 회원고유번호, 없을 경우 현재 로그인한 사용자
	 * @return object $root 루트폴더정보
	 */
	function getRootFolder($midx=null) {
		$midx = $midx == null ? $this->IM->getModule('member')->getLogged() : $midx;
		if ($midx == 0) return null;
		
		$check = $this->db()->select($this->table->folder)->where('owner',$midx)->where('parent',0)->getOne();
		if ($check == null) {
			$name = $this->getModule()->getConfig('root_name');
			
			$this->db()->insert($this->table->folder,array('owner'=>$midx,'creator'=>$midx,'editor'=>$midx,'name'=>$name,'reg_date'=>time(),'update_date'=>time()))->execute();
			return $this->getRootFolder($midx);
		} else {
			return $check;
		}
	}
	
	/**
	 * 대상폴더내에서 중복을 피하기 위한 파일이름을 반환한다.
	 *
	 * @param int $parent 대상폴더 고유번호
	 * @param string $name 중복된 파일이름
	 * @return string $newname 중복되지 않는 새로운 이름
	 */
	function getEscapeDuplicatedFileName($folder,$name) {
		$temp = explode('.',$name);
		$extension = array_pop($temp);
		$name = implode('.',$temp);
		$number = 0;
		while (true) {
			$newname = $number == 0 ? $name.'.'.$extension : $name.'('.$number.').'.$extension;
			if ($this->db()->select($this->table->file)->where('folder',$folder)->where('is_delete','FALSE')->where('name',$newname)->has() == false) {
				return $newname;
			}
			$number++;
		}
	}
	
	/**
	 * 대상폴더내에서 중복을 피하기 위한 폴더이름을 반환한다.
	 *
	 * @param int $parent 대상폴더 고유번호
	 * @param string $name 중복된 폴더이름
	 * @return string $newname 중복되지 않는 새로운 이름
	 */
	function getEscapeDuplicatedFolderName($parent,$name) {
		$number = 0;
		while (true) {
			$newname = $number == 0 ? $name : $name.'('.$number.')';
			if ($this->db()->select($this->table->folder)->where('parent',$parent)->where('is_delete','FALSE')->where('name',$newname)->has() == false) {
				return $newname;
			}
			$number++;
		}
	}
	
	/**
	 * 폴더명이 유효한지 확인한다.
	 *
	 * @param int $name 폴더명
	 * @return string/boolean 유효한 폴더명일 경우 true, 그렇지 않을 경우 에러메세지
	 */
	function checkFolderName($name) {
		if (preg_match('/(\/|#|\?|"|%|<|>|\'|\||\\\)+/',$name) == true) return $this->getErrorText('INVALID_FOLDER_NAME');
		if (preg_match('/^(\.)+$/',$name) == true) return $this->getErrorText('NOT_ALLOWED_CHARACTER_IN_FORDER_NAME');
		if (strlen($name) == 0 || strlen($name) > 200) return $this->getErrorText('INVALID_FOLDER_NAME_LENGTH');
		
		return true;
	}
	
	/**
	 * 폴더의 권한을 확인한다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @param string $check 확인할 권한
	 * @param boolean $hasPermission
	 */
	function checkFolderPermission($idx,$check) {
		$permission = $this->getFolderPermission($idx);
		return strpos($permission,$check) !== false;
	}
	
	/**
	 * 파일의 권한을 확인한다.
	 *
	 * @param int $idx 파일 고유번호
	 * @param string $check 확인할 권한
	 * @param boolean $hasPermission
	 */
	function checkFilePermission($idx,$check) {
		$permission = $this->getFilePermission($idx);
		return strpos($permission,$check) !== false;
	}
	
	/**
	 * 폴더가 공유중인 폴더인지 확인한다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @param boolean $isShared
	 */
	function checkFolderShared($idx) {
		if (isset($this->shareds[$idx]) == true) return $this->shareds[$idx];
		
		$folder = $this->getFolder($idx);
		if ($folder->parent == 0) {
			$this->shareds[$idx] = false;
		} else {
			$this->shareds[$idx] = $folder->linked > 0 || $folder->is_shared == true || $this->checkFolderShared($folder->parent);
		}
		
		return $this->shareds[$idx];
	}
	
	/**
	 * 삭제된 폴더인지 확인한다.
	 *
	 * @param int $idx 폴더 고유번호
	 * @param boolean $isDeleted
	 */
	function checkFolderDeleted($idx) {
		if (isset($this->deleteds[$idx]) == true) return $this->deleteds[$idx];
		
		$folder = $this->getFolder($idx);
		if ($folder->parent == 0) {
			$this->deleteds[$idx] = false;
		} else {
			$this->deleteds[$idx] = $folder->is_delete == true || $this->checkFolderDeleted($folder->parent);
		}
		
		return $this->deleteds[$idx];
	}
	
	/**
	 * 삭제된 파일인지 확인한다.
	 *
	 * @param int $idx 파일 고유번호
	 * @param boolean $isDeleted
	 */
	function checkFileDeleted($idx) {
		$file = $this->getFile($idx);
		return $file == null || $file->is_delete == true || $this->checkFolderDeleted($file->folder);
	}
	
	/**
	 * 활동내역을 기록한다.
	 *
	 * @param string $type 활동분류
	 * @param int $target 활동이 일어난 폴더고유번호 또는 파일고유번호
	 * @param object $datas 활동데이터
	 * @param int $reg_date 활동이 일어난 시각
	 */
	function addActivity($type,$target,$datas,$reg_date=null) {
		$is_record = false;
		$data = new stdClass();
		
		if ($type == 'UPLOAD') {
			$data->folder = new stdClass();
			$data->folder->idx = $target;
			$data->folder->path = $this->getFolderPath($target);
			
			$data->files = array();
			for ($i=0, $loop=count($datas);$i<$loop;$i++) {
				if ($datas[$i]->idx > 0) {
					$file = $this->db()->select($this->table->file,'idx,name,type,size,update_date')->where('idx',$datas[$i]->idx)->getOne();
					if ($datas[$i]->duplicatedOption == 'replace') $this->recordActivity('REPLACE_FILE',$file->idx,$file);
					elseif ($datas[$i]->duplicatedOption == null) $this->recordActivity('CREATE_FILE',$file->idx,$file);
					
					if ($datas[$i]->duplicatedOption == null || $datas[$i]->duplicatedOption == 'replace') {
						$data->files[] = $file;
						$reg_date = $reg_date == null || $reg_date > $file->update_date ? $file->update_date : $reg_date;
					}
				}
			}
			
			if (count($data->files) == 0) return;
			
			$target = $target == 0 ? '@'.$this->IM->getModule('member')->getLogged() : '/'.$target;
			$is_record = true;
		}
		
		if ($type == 'CREATE_FOLDER' || $type == 'CREATE_FILE' || $type == 'REPLACE_FILE') {
			$data = $datas;
			$reg_date = $datas->update_date;
			$is_record = true;
		}
		
		if ($type == 'DELETE') {
			$data->folder = new stdClass();
			$data->folder->idx = $target;
			$data->folder->path = $this->getFolderPath($target);
			
			$data->items = array();
			for ($i=0, $loop=count($datas);$i<$loop;$i++) {
				if ($datas[$i]->deleted == true) {
					if ($datas[$i]->type == 'folder') {
						$folder = $this->db()->select($this->table->folder)->where('idx',$datas[$i]->idx)->getOne();
						$this->recordActivity('DELETE_FOLDER',$folder->idx,$folder);
						
						$item = new stdClass();
						$item->type = 'folder';
						$item->idx = $folder->idx;
						$item->name = $folder->name;
						$item->size = $folder->size;
					} else {
						$file = $this->db()->select($this->table->file)->where('idx',$datas[$i]->idx)->getOne();
						$this->recordActivity('DELETE_FILE',$file->idx,$file);
						
						$item = new stdClass();
						$item->type = $file->type;
						$item->idx = $file->idx;
						$item->name = $file->name;
						$item->size = $file->size;
					}
					
					$data->items[] = $item;
				}
			}
			
			$target = $target == 0 ? '@'.$this->IM->getModule('member')->getLogged() : '/'.$target;
			$is_record = true;
		}
		
		if ($type == 'DELETE_FOLDER' || $type == 'DELETE_FILE') {
			$data = $datas;
			$reg_date = $datas->update_date;
			$target = $type == 'DELETE_FOLDER' ? '/'.$target : $target;
			$is_record = true;
		}
		
		if ($is_record == true) {
			$reg_date = $reg_date == null ? time() : $reg_date;
		
			$this->db()->insert($this->table->activity,array('reg_date'=>$reg_date,'target'=>$target,'type'=>$type,'midx'=>$this->IM->getModule('member')->getLogged(),'data'=>json_encode($data,JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES)))->execute();
		}
	}
	
	/**
	 * 대상파일을 다른폴더로 복사한다.
	 *
	 * @param object $file 복사할 대상 파일 객체
	 * @param int $target 복사할 위치 파일 고유번호
	 * @return boolean $success 성공여부
	 */
	function copyFile($file,$target,$is_check=true) {
		if ($is_check == true) {
			if ($this->db()->select($this->table->file)->where('folder',$target)->where('name',$file->name)->where('is_delete','FALSE')->has() == true) return false;
		}
		
		$temp = explode('/',$file->path);
		$temp = explode('.',end($temp));
		
		$path = $this->getCurrentPath().'/'.$temp[0].'.'.base_convert(microtime(true)*10000,10,32).'.'.end($temp);
		@copy($this->getFilePath($file->path),$this->getFilePath($path));
		
		$insert = array();
		$insert['folder'] = $target;
		$insert['owner'] = $insert['creator'] = $insert['editor'] = $this->IM->getModule('member')->getLogged();
		$insert['path'] = $path;
		$insert['name'] = $file->name;
		$insert['type'] = $file->type;
		$insert['mime'] = $file->mime;
		$insert['size'] = $file->size;
		$insert['width'] = $file->width;
		$insert['height'] = $file->height;
		$insert['status'] = $file->status;
		$insert['reg_date'] = $insert['update_date'] = time();
		
		$this->db()->insert($this->table->file,$insert)->execute();
		
		return true;
	}
	
	/**
	 * 대상폴더를 다른폴더로 복사한다.
	 *
	 * @param object $origin 복사할 대상 폴더 객체
	 * @param int $target 복사할 위치 폴더 고유번호
	 * @return boolean $success 성공여부
	 */
	function copyFolder($folder,$target,$is_check=true) {
		if ($is_check == true) {
			if ($this->db()->select($this->table->folder)->where('parent',$target)->where('name',$folder->name)->where('is_delete','FALSE')->has() == true) return false;
		}
		
		$insert = array();
		$insert['owner'] = $insert['creator'] = $insert['editor'] = $this->IM->getModule('member')->getLogged();
		$insert['parent'] = $target;
		$insert['name'] = $folder->name;
		$insert['size'] = 0;
		$insert['permission'] = 'RWD';
		$insert['reg_date'] = $insert['update_date'] = time();
		
		$idx = $this->db()->insert($this->table->folder,$insert)->execute();
		
		$children = $this->db()->select($this->table->folder)->where('parent',$folder->linked ? $folder->linked : $folder->idx)->where('is_delete','FALSE');
		if ($this->checkFolderPermission($folder->idx,'R') == false) $children->where('creator',$this->IM->getModule('member')->getLogged());
		$children = $children->get();
		for ($i=0, $loop=count($children);$i<$loop;$i++) {
			$this->copyFolder($children[$i],$idx,false);
		}
		
		$files = $this->db()->select($this->table->file)->where('folder',$folder->linked ? $folder->linked : $folder->idx)->where('is_delete','FALSE');
		if ($this->checkFolderPermission($folder->idx,'R') == false) $files->where('creator',$this->IM->getModule('member')->getLogged());
		$files = $files->get();
		for ($i=0, $loop=count($files);$i<$loop;$i++) {
			$this->copyFile($files[$i],$idx,false);
		}
		
		$this->updateFolder($idx);
		
		return true;
	}
	
	/**
	 * 대상폴더를 다른폴더와 병합한다.
	 *
	 * @param int $origin 복사할 대상 폴더 고유번호
	 * @param int $target 복사할 위치 폴더 고유번호
	 * @return boolean $success 성공여부
	 */
	function mergeFolder($origin,$target,$is_copy=false) {
		$childFolders = $this->db()->select($this->table->folder)->where('parent',$target)->where('is_delete','FALSE')->get();
		for ($i=0, $loop=count($childFolders);$i<$loop;$i++) {
			$duplicated = $this->db()->select($this->table->folder)->where('parent',$origin)->where('name',$childFolders[$i]->name)->where('is_delete','FALSE')->getOne();
			if ($duplicated != null) {
				$this->mergeFolder($duplicated->idx,$childFolders[$i]->idx,$is_copy);
			} else {
				if ($is_copy == true) $this->copyFolder($childFolders[$i],$origin,false);
				else $this->db()->update($this->table->folder,array('parent'=>$origin))->where('idx',$childFolders[$i]->idx)->execute();
			}
		}
		
		$childFiles = $this->db()->select($this->table->file)->where('folder',$target)->where('is_delete','FALSE')->get();
		for ($i=0, $loop=count($childFiles);$i<$loop;$i++) {
			$duplicated = $this->db()->select($this->table->file)->where('folder',$origin)->where('name',$childFiles[$i]->name)->where('is_delete','FALSE')->getOne();
			if ($duplicated != null) $childFiles[$i]->name = $this->getEscapeDuplicatedFileName($origin,$childFiles[$i]->name);
			
			if ($is_copy == true) {
				$this->copyFile($childFiles[$i],$origin,false);
			} else {
				$this->db()->update($this->table->file,array('folder'=>$origin,'name'=>$childFiles[$i]->name))->where('idx',$childFiles[$i]->idx)->execute();
			}
		}
		
		$this->updateFolder($origin);
		if ($is_copy == false) $this->db()->delete($this->table->folder)->where('idx',$target)->execute();
		
		return true;
	}
	
	/**
	 * 폴더용량 및 최종수정시각을 업데이트한다.
	 *
	 * @param int $idx 폴더고유번호
	 */
	function updateFolder($idx) {
	}
	
	/**
	 * 현재 모듈에서 처리해야하는 요청이 들어왔을 경우 처리하여 결과를 반환한다.
	 * 소스코드 관리를 편하게 하기 위해 각 요쳥별로 별도의 PHP 파일로 관리한다.
	 * 작업코드가 '@' 로 시작할 경우 사이트관리자를 위한 작업으로 최고관리자 권한이 필요하다.
	 *
	 * @param string $action 작업코드
	 * @return object $results 수행결과
	 * @see /process/index.php
	 */
	function doProcess($action) {
		$results = new stdClass();
		
		/**
		 * 모듈의 process 폴더에 $action 에 해당하는 파일이 있을 경우 불러온다.
		 */
		if (is_file($this->getModule()->getPath().'/process/'.$action.'.php') == true) {
			INCLUDE $this->getModule()->getPath().'/process/'.$action.'.php';
		}
		
		$values = (object)get_defined_vars();
		$this->IM->fireEvent('afterDoProcess','member',$action,$values,$results);
		
		return $results;
	}
}
?>