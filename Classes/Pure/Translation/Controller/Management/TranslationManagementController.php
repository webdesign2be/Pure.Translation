<?php
namespace Pure\Translation\Controller\Management;

use TYPO3\Flow\Annotations as Flow;
use TYPO3\Flow\I18n\Exception\InvalidLocaleIdentifierException;
use TYPO3\Flow\I18n\Locale;
use TYPO3\Flow\I18n\Translator;
use TYPO3\Neos\Service\XliffService;
use TYPO3\Flow\Package\PackageManagerInterface;

class TranslationManagementController extends \TYPO3\Neos\Controller\Module\AbstractModuleController {

	/**
	 * @Flow\Inject
	 * @var \Pure\Translation\Domain\Service\TranslationService
	 */
	protected $translationService;

	/**
	 * @Flow\Inject
	 * @var \Pure\Translation\Domain\Repository\XLIFFFileRepository
	 */
	protected $xliffFileRepository;

	/**
	 * @var array
	 */
	protected $settings;

	/**
	 * @var array
	 */
	protected $defaultOptions;

	/**
	 * Inject package settings
	 *
	 * @param array $settings
	 * @return void
	 */
	public function injectSettings(array $settings) {
		$this->settings = $settings;
	}

	/**
	 * @param string $locale
	 * @return void
	 */
	public function indexAction($locale = '') {
		$allTranslations = $this->translationService->retrieveAllGroupedByIdentifierAndLocale();
		$translations = $this->translationService->retrieveAllGroupedByIdentifierAndHavingNumericLocale();
		$locales = $this->translationService->getAllLocales();

		$this->view->assign('allTranslationsJSON', json_encode($allTranslations));
		$this->view->assign('translations', $translations);
		$this->view->assign('availableLocalesJSON', json_encode($locales));
		$this->view->assign('availableLocales', $locales);
		$this->view->assign('defaultLocale', $locale);
	}

	/**
	 * @param array $commands
	 * @return void
	 */
	public function saveAction($commands) {
		foreach ($commands as $locale => $translations) {
			foreach ($translations as $translation) {
				if($xliffFile = $this->xliffFileRepository->findMainByPackageKeyAndLocale(
					$translation['packageKey'], $translation['locale'])) {
						$xliffFile->set($translation['identifier'], $translation['value']);
						$this->xliffFileRepository->add($xliffFile);
				}
			}
		}

		$this->xliffFileRepository->persistAll();
		$this->redirect('index', NULL, NULL, array('locale' => $locale));
	}
}
