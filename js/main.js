/* ------------------------------
 * -- Constants -----------------
 * ------------------------------
 */
var PANEL_MARGIN_BOTTOM = 5;
var KEY_ARROW_LEFT		= 37;
var KEY_ARROW_UP		= 38;
var KEY_ARROW_RIGHT		= 39;
var KEY_ARROW_DOWN		= 40;
var KEY_NB_0			= 96;
var KEY_NB_1			= 97;
var KEY_NB_9			= 105;
/* ------------------------------
 * -- Variables -----------------
 * ------------------------------
 */
 // first launch
var currentPage=0;
 // other
var contentJson=undefined;
var jsonPages=undefined;
var jsonParameters=undefined;
var currentPanel=undefined;
var panelObjClicked=undefined;
var currentPictureMode=undefined;
var isDblClick=undefined;

jQuery(document).ready(function() {
	init ();

	$(window).resize(function() {
		resizeContent();
		resizePanels();
	});

	$('#right-cpanel').on('click','.panel',panelClicked);
	$('#btn-prev-page').click(function(){changePage(currentPage-1);});
	$('#btn-next-page').click(function(){changePage(currentPage+1);});
	$('#btn-reload-page').click(function(){changePage(currentPage);});
	$('#left-cpanel').on('click','.image', function(){imageClicked()});
	$('#left-cpanel').on('dblclick','.image', function(){imageDblClicked()});
});

/* ------------------------------
 * -- init ----------------------
 * ------------------------------
 */
function init () {
	initVariables();

 	if (initJson ()) {
 		initPage();
		initPanels();
		initJsonParameters();
		centerHeaderGlyphicons();
		resizeContent();
		resizePanels();
		resizeContent();
		displayImage();
		initKeyMap();
	}
}

function initVariables () {
	contentJson = undefined;
	jsonPages = undefined;
	jsonParameters = undefined;
	//currentPage = 0;
	currentPanel = -1;
	panelObjClicked = undefined;
	currentPictureMode=0;
	isDblClick=false;
}

function initJson () {
	try {
		var strContent = JSON.stringify(json);
		contentJson=$.parseJSON(strContent);
		jsonPages=contentJson[0].pages;
   		jsonParameters=contentJson[0].parameters;
	}
	catch (err) {
		var body = '<p>JSON parsing error => check content.json <br><br>Erreur :</p>';
		body += err;
		$('#modal-message .modal-body').html(body);
		$('#modal-message').modal('show');
		return false;
	}
	return true;
}

function initJsonParameters() {
	// columns size
	jsonPages[currentPage].colRightSize=12-parseInt(jsonPages[currentPage].colLeftSize);
	$('.cpanel').removeClass(function (index, css) {
		return (css.match (/(^|\s)col-\S+/g) || []).join(' ');
	});
	$('#left-cpanel').addClass('col-md-'+jsonPages[currentPage].colLeftSize);
	$('#right-cpanel').addClass('col-md-'+jsonPages[currentPage].colRightSize);
	// inverse panels
	if (jsonParameters.inversePanels) {
		$('#left-cpanel').insertAfter('#right-cpanel');
	}
	// background color
	$('#content').css('background-color',jsonParameters.bColor);
	// header font size
	$('header h1').css('font-size',jsonParameters.headerFontSize);
	// header color
	$('header').css('color',jsonParameters.headerColor);
	// header background color
	$('header').css('background-color',jsonParameters.headerBColor);
	// panel header font size
	$('.panel-heading h3').css('font-size',jsonParameters.panelHeaderFontSize);
	// panel header color
	$('.panel-heading').css('color',jsonParameters.panelHeaderColor);
	// panel header background color
	$('.panel-heading').css('background-color',jsonParameters.panelHeaderBColor);
	// panel content font size
	$('.panel-body div').css('font-size',jsonParameters.panelContentFontSize);
	// panel content line height
	$('.panel-body').css('line-height',jsonParameters.panelContentLineHeight);
	// panel content color
	$('.panel-body').css('color',jsonParameters.panelContentColor);
	// panel content background color
	$('.panel-body').css('background-color',jsonParameters.panelContentBColor);
	// image style
	$('.image').css('border-style',jsonParameters.imageBorderStyle);
	// image color
	$('.image').css('border-width',jsonParameters.imageBorderWidth);
	// image background color
	$('.image').css('border-color',jsonParameters.imageBordercolor);
	// Full screen image animation !
	var cssVal = 'width 0.'+jsonParameters.animationTime+'s ease, margin 0.'+jsonParameters.animationTime+'s ease, padding 0.'+jsonParameters.animationTime+'s ease;';
	$('#content .cpanel').attr("style", 
   		'-webkit-transition:'+cssVal+'; '+'-moz-transition:'+cssVal+'; '+'-o-transition:'+cssVal+'; '+'transition:'+cssVal+'; '
	);
}

function initKeyMap () {
	$('body').unbind('keydown');
	$('body').bind('keydown', function(e) {
		switch(e.keyCode) {
			case KEY_ARROW_LEFT:
				if (e.ctrlKey) {
					if(jsonParameters.inversePanels) { // not very pretty
						resizeTogglePannels(parseInt(jsonPages[currentPage].colLeftSize)+1,
											parseInt(jsonPages[currentPage].colRightSize)-1
											);
					}
					else {
						resizeTogglePannels(parseInt(jsonPages[currentPage].colLeftSize)-1,
											parseInt(jsonPages[currentPage].colRightSize)+1
											);
					}
				}
				else {
					changePage(currentPage-1);
				}
				break;
			case KEY_ARROW_RIGHT:
				if (e.ctrlKey) {
					if(jsonParameters.inversePanels) { // not very pretty
						resizeTogglePannels(parseInt(jsonPages[currentPage].colLeftSize)-1,
											parseInt(jsonPages[currentPage].colRightSize)+1
											);
					}
					else {
						resizeTogglePannels(parseInt(jsonPages[currentPage].colLeftSize)+1,
											parseInt(jsonPages[currentPage].colRightSize)-1
											);
					}
				}
				else {
					changePage(currentPage+1);
				}
				break;
			case KEY_ARROW_UP:
				changePanel(currentPanel-1);
				break;
			case KEY_ARROW_DOWN:
				changePanel(currentPanel+1);
				break;
			case KEY_NB_0:
				changePage(currentPage);
				break;
			default:
				if (e.keyCode >= KEY_NB_1 && e.keyCode <= KEY_NB_9) {
					var nb = parseInt(e.keyCode)-KEY_NB_1;
					changePanel(nb);
				}
				break;
		}
	});
}

function initPage () {
	updateTitle();
}

function initPanels () {
	var htmlRP = '';
	var htmlLP = '';
	var nbPanels = jsonPages[currentPage].panels.length;

	htmlLP += '<img class="image image-page" src="img/'+jsonPages[currentPage].image+'" />';
	$.each(jsonPages[currentPage].panels, function(i, item) {
		var currentPanel=jsonPages[currentPage].panels[i];
		var imgMode='img-mode-'+	((undefined===currentPanel.imgMode)
									? 0
									: currentPanel.imgMode);
		htmlLP += '<img id="img-'+i+'" class="image '+imgMode+'" data-n-panel="'+i+'" src="img/'+currentPanel.image+'" style="display: none;" />';

		htmlRP += '	<div id="panel-'+i+'" data-n-panel="'+i+'" class="panel panel-primary" style="height:'+90/nbPanels+'%;">';
		htmlRP += '		<div class="panel-heading">';
		htmlRP += '			<h3 class="panel-title">'+currentPanel.title+'</h3>';
		htmlRP += '		</div>';
		htmlRP += '		<div class="panel-body">';
	$.each(jsonPages[currentPage].panels[i].content, function(j, item) {
		var baliseBeg = '<div>';
		var baliseEnd = '</div>';
		var content = jsonPages[currentPage].panels[i].content[j];
		if(jsonPages[currentPage].panels[i].content[j] instanceof Array) {
			content = jsonPages[currentPage].panels[i].content[j][0];
			baliseBeg='<div class="'+jsonPages[currentPage].panels[i].content[j][1]+'">';
		}
		htmlRP += '			'+baliseBeg+content+baliseEnd;
	});
		htmlRP += '		</div>';
		htmlRP += '</div>';
    });
    $('#panels-container').html(htmlRP);
    $('#images-container').html(htmlLP);
}
/* ------------------------------
 * -- view ----------------------
 * ------------------------------
 */
function resizePanels () {
	var nbPanels = $('.panel').length;
	var clickedPanelSize = $('#panels-container').height();
	var headerPanelSize = $('.panel-heading').outerHeight();

	if (undefined !== panelObjClicked) {
		$('.panel').animate({
			height: headerPanelSize
		}, {duration:jsonParameters.animationTime, queue:false});
		clickedPanelSize -= (nbPanels-1)*(headerPanelSize+PANEL_MARGIN_BOTTOM);
		panelObjClicked.animate({
			height: clickedPanelSize
		}, {duration:jsonParameters.animationTime, queue:false});
		panelObjClicked.find('.panel-body').css('height',clickedPanelSize-headerPanelSize);
	}
	else {
		var panelsHeight = clickedPanelSize/nbPanels-PANEL_MARGIN_BOTTOM;
		$('.panel').animate({
			height: panelsHeight
		}, {duration:jsonParameters.animationTime, queue:false});
		$('.panel-body').css('height',panelsHeight-headerPanelSize);
	}
}

function resizeTogglePannels(sizeLeftCol,sizeRightCol,isFullScreenImg) {
	isFullScreenImg = (undefined===isFullScreenImg) ? false : isFullScreenImg;
	if(12===sizeLeftCol+sizeRightCol&&Math.min(sizeLeftCol,sizeRightCol)>=0) {
		$('#left-cpanel').toggleClass('col-md-'+jsonPages[currentPage].colLeftSize+' col-md-'+sizeLeftCol);
		$('#right-cpanel').toggleClass('col-md-'+jsonPages[currentPage].colRightSize+' col-md-'+sizeRightCol);
		if (!isFullScreenImg) {
			jsonPages[currentPage].colLeftSize=sizeLeftCol;
			jsonPages[currentPage].colRightSize=sizeRightCol;
		}
	}
}

function resizeContent () {
	$('#content').css({'height':(($(window).height())-$('header').height())+'px'});
	$('#images-container').css('line-height',($('#left-cpanel').height()-30)+'px'); // why 30 ? may be 2x15px padding parent ? .. it's work :p
}

function centerHeaderGlyphicons () {
	var mTop = ($('header').outerHeight()-$('.glyphicon').height())/2;
	$('.glyphicon').css('margin-top',mTop);
}

function updateTitle () {
	$('#page-title').text(jsonPages[currentPage].title);
	$('title').text(jsonPages[currentPage].title);
}

function displayImage () {
	$('.image:visible').hide();
	var image = undefined;
	if (undefined===panelObjClicked) {
		image = $('.image-page');
	}
	else {
		var nPanel = panelObjClicked.attr('data-n-panel')
		image = $('#images-container [data-n-panel='+nPanel+']');
	}
	image.show();
	image.on('load', function(){
		updatePictureSize(currentPictureMode);
	});
}

function updatePictureSize (mode) {
	var nbModes = 4;
	var oldMode = 'img-mode-'+currentPictureMode;
	if (mode>=nbModes) {
		mode=0;
	}
	currentPictureMode=mode;
	var newMode = 'img-mode-'+currentPictureMode;
	$('.image:visible').css('margin-top',0);
	$('.image:visible').toggleClass(oldMode+' '+newMode);
}

/* ------------------------------
 * -- click ---------------------
 * ------------------------------
 */

function imageClicked () {
	isDblClick=false;
	setTimeout(function () {
		if (!isDblClick) {
			updatePictureSize(currentPictureMode+1);
		}
	}, 400);
}

function imageDblClicked () {
	isDblClick=true;
	resizeTogglePannels(12,0,true);
}

function panelClicked () {
	panelObjClicked=$(this);
	currentPanel=parseInt(panelObjClicked.attr('data-n-panel'));
	resizePanels();
	displayImage();
}

function changePanel (number) {
	var nbPanels = jsonPages[currentPage].panels.length;
	if (number < nbPanels && number >= 0) {
		var idPanel = '#panel-'+number;
		$(idPanel).trigger('click');
	}
}

function changePage (number) {
	var nbPages = jsonPages.length;
	$('.glyphicon').parent().css('color', 'white');
	if (number >= nbPages-1) {
		$('#btn-next-page').parent().css('color', 'gray');
		number=nbPages-1;
	}
	else if (number <= 0) {
		$('#btn-prev-page').parent().css('color', 'gray');
		number=0;
	}

	currentPage=number;
	init();
}

/* ------------------------------
 * -- misc ----------------------
 * ------------------------------
 */