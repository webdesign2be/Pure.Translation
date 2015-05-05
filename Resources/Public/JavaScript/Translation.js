$(function() {
	$langTitles = [];
	$.each($('.translation-column .neos-thead span'), function( key, value ) {
		if(key === 0) {
			$('.langSelector').append('<div class="currentLang">' + $(this).text().toUpperCase() + '</div>').append('<div class="selectableLang hidden"></div>');
		} else {
			$('.langSelector .selectableLang').append('<div class="lang-' + $(this).text() + '">' + $(this).text().toUpperCase() + '</div>');
		}
	});

	$('.translation-column').eq(0).toggleClass('hide').toggleClass('show');

	$('.langSelector').on('click', function() {
		$(this).children('.selectableLang').toggleClass('hidden');
	});

	$('.translations').on('click', '.selectableLang > div', function() {
		console.log($(this).text());
		// show / hide language
		$('#' + $(this).text().toUpperCase()).toggleClass('hide').toggleClass('show');
		$('#' + $('.currentLang').eq(0).text().toUpperCase()).toggleClass('hide').toggleClass('show');

		$('.selectableLang').append('<div class="lang-' + $('.currentLang').eq(0).text().toLowerCase() + '">' + $('.currentLang').eq(0).text() + '</div>');

		$('.currentLang').text($(this).text());
		$('.lang-' + $(this).text().toLowerCase()).remove();
	});
});